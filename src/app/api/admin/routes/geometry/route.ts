import { NextRequest, NextResponse } from "next/server";
import { invalidateContent } from "@/lib/firestoreRead";
import { gpx } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import { getDb, getStorageBucket, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import {
  geometryCoords,
  checkRouteGeometry,
  haversineMiles,
} from "@/lib/validation/geometry";
import type { ElevationPoint } from "@/data/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

/**
 * Elevation profile from the uploaded coordinates — same approach as
 * getElevationProfile in src/data/routes.ts: cumulative haversine distance,
 * 2dp miles / integer metres, points without elevation skipped, downsampled
 * evenly to 90 points. Null when the track carries no elevation.
 */
function buildProfile(coords: number[][], maxPoints = 90): ElevationPoint[] | null {
  const points: ElevationPoint[] = [];
  let cumulative = 0;
  for (let i = 0; i < coords.length; i++) {
    if (i > 0) {
      cumulative += haversineMiles(
        coords[i - 1][1],
        coords[i - 1][0],
        coords[i][1],
        coords[i][0]
      );
    }
    const ele = coords[i][2];
    if (ele == null) continue;
    points.push({
      distanceMi: Math.round(cumulative * 100) / 100,
      elevationM: Math.round(ele),
    });
  }
  if (points.length < 2) return null;

  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  const sampled: ElevationPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(points[Math.round(i * step)]);
  }
  return sampled;
}

export async function POST(request: NextRequest) {
  const session = await verifyAdmin(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with a file and routeId" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  const routeId = form.get("routeId");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (typeof routeId !== "string" || !routeId) {
    return NextResponse.json({ error: "routeId is required" }, { status: 400 });
  }

  const fileName = file.name.toLowerCase();
  const isGpx = fileName.endsWith(".gpx");
  const isGeoJson = fileName.endsWith(".geojson") || fileName.endsWith(".json");
  if (!isGpx && !isGeoJson) {
    return NextResponse.json(
      { error: "Unsupported file type — upload a .gpx or .geojson/.json file" },
      { status: 400 }
    );
  }

  const text = await file.text();
  let geojson: unknown;
  try {
    if (isGpx) {
      // togeojson preserves GPX elevation as the third coordinate ordinate
      const doc = new DOMParser().parseFromString(text, "text/xml");
      geojson = gpx(doc as unknown as Parameters<typeof gpx>[0]);
    } else {
      geojson = JSON.parse(text);
    }
  } catch {
    return NextResponse.json(
      { error: `Could not parse ${file.name} — is it a valid ${isGpx ? "GPX" : "GeoJSON"} file?` },
      { status: 400 }
    );
  }

  const coords = geometryCoords(geojson);

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("routes").doc(routeId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }
    const route = doc.data() as {
      slug: string;
      name: string;
      distanceMiles: number;
    };

    const check = checkRouteGeometry(coords, route.distanceMiles);
    if (check.errors.length > 0) {
      return NextResponse.json(
        { error: "Geometry validation failed", errors: check.errors },
        { status: 400 }
      );
    }

    const feature = {
      type: "Feature",
      properties: { name: route.name, slug: route.slug, source: "admin-upload" },
      geometry: { type: "LineString", coordinates: coords },
    };

    const bucket = getStorageBucket();
    const storagePath = `routes/${route.slug}.geojson`;
    const storageFile = bucket.file(storagePath);
    await storageFile.save(JSON.stringify(feature), {
      metadata: {
        contentType: "application/geo+json",
        cacheControl: "public, max-age=31536000",
      },
    });
    await storageFile.makePublic();
    // Versioned query so re-uploads bypass the 1-year cache on the stable path
    const geometryUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}?v=${Date.now()}`;

    await docRef.set({
      ...doc.data(),
      geometryUrl,
      geometrySource: "admin-upload",
      updatedAt: new Date().toISOString(),
      ...(session.email ? { updatedBy: session.email } : {}),
    });
    invalidateContent("routes");

    return NextResponse.json({
      success: true,
      geometryUrl,
      lengthMiles: Math.round(check.lengthMiles * 100) / 100,
      warnings: check.warnings,
      profile: buildProfile(coords),
    });
  } catch (e) {
    console.error("Route geometry upload failed:", e);
    return dbUnavailable();
  }
}
