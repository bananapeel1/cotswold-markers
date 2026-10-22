import { readFile } from "fs/promises";
import { invalidateContent } from "@/lib/firestoreRead";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import { geometryCoords, haversineMiles } from "@/lib/validation/geometry";

export const dynamic = "force-dynamic";

// POIs within ~250m of any point on the route line count as "along the route"
const NEARBY_MILES = 0.155;

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

async function readGeometry(source: string): Promise<string | null> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const res = await fetch(source);
    if (!res.ok) return null;
    return res.text();
  }
  const filePath = path.join(process.cwd(), "public", source.replace(/^\//, ""));
  return readFile(filePath, "utf-8");
}

export async function POST(request: NextRequest) {
  const session = await verifyAdmin(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { routeId } = await request.json();
  if (typeof routeId !== "string" || !routeId) {
    return NextResponse.json({ error: "Route ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("routes").doc(routeId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }
    const route = doc.data() as {
      geometryUrl?: string | null;
      geometryFile?: string | null;
    };

    const source = route.geometryUrl || route.geometryFile;
    if (!source) {
      return NextResponse.json(
        {
          error:
            "This route has no geometry — upload a GPX or GeoJSON track before recomputing nearby POIs.",
        },
        { status: 400 }
      );
    }

    let raw: string | null = null;
    try {
      raw = await readGeometry(source);
    } catch {
      raw = null;
    }
    if (!raw) {
      return NextResponse.json(
        { error: "Could not load the route's geometry file." },
        { status: 400 }
      );
    }

    let coords: number[][] = [];
    try {
      coords = geometryCoords(JSON.parse(raw));
    } catch {
      coords = [];
    }
    if (coords.length < 2) {
      return NextResponse.json(
        { error: "The route's geometry has no usable coordinates." },
        { status: 400 }
      );
    }

    const poisSnapshot = await db.collection("pois").get();
    const poiIds: string[] = [];
    for (const poiDoc of poisSnapshot.docs) {
      const poi = poiDoc.data() as {
        id?: string;
        latitude?: number;
        longitude?: number;
      };
      if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") {
        continue;
      }
      const near = coords.some(
        ([lng, lat]) =>
          haversineMiles(poi.latitude!, poi.longitude!, lat, lng) <= NEARBY_MILES
      );
      if (near) poiIds.push(poi.id ?? poiDoc.id);
    }

    await docRef.set({
      ...doc.data(),
      poiIds,
      updatedAt: new Date().toISOString(),
      ...(session.email ? { updatedBy: session.email } : {}),
    });
    invalidateContent("routes");

    return NextResponse.json({ success: true, poiIds, count: poiIds.length });
  } catch (e) {
    console.error("Route POI recompute failed:", e);
    return dbUnavailable();
  }
}
