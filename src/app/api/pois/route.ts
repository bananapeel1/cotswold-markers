import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import { poiSchema, formatIssues } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

export async function GET() {
  const { getPOIs } = await import("@/data/pois");
  const pois = await getPOIs();
  return NextResponse.json(pois);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poi } = await request.json();
  if (!poi?.name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const id = `poi-${poi.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}-${Date.now().toString(36)}`;
  const newPoi = {
    id,
    name: poi.name,
    type: poi.type || "pub",
    description: poi.description || "",
    latitude: poi.latitude || 0,
    longitude: poi.longitude || 0,
    openingHours: poi.openingHours || null,
    nearestMarkerIds: poi.nearestMarkerIds || [],
    ...(poi.accessibility ? { accessibility: poi.accessibility } : {}),
    ...(poi.siteType ? { siteType: poi.siteType } : {}),
    ...(poi.access ? { access: poi.access } : {}),
    ...(poi.nhle ? { nhle: poi.nhle } : {}),
    ...(poi.verification ? { verification: poi.verification } : {}),
  };

  const parsed = poiSchema.safeParse(newPoi);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatIssues(parsed.error) },
      { status: 400 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    await getDb().collection("pois").doc(id).set(newPoi);
    return NextResponse.json({ success: true, poi: newPoi });
  } catch (e) {
    console.error("POI create failed:", e);
    return dbUnavailable();
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poi } = await request.json();
  if (!poi?.id) {
    return NextResponse.json({ error: "POI ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("pois").doc(poi.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "POI not found" }, { status: 404 });
    }
    const updated = { ...doc.data(), ...poi };

    const parsed = poiSchema.safeParse(updated);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: formatIssues(parsed.error) },
        { status: 400 }
      );
    }

    await docRef.set(updated);
    return NextResponse.json({ success: true, poi: updated });
  } catch (e) {
    console.error("POI update failed:", e);
    return dbUnavailable();
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "POI ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("pois").doc(id);
    if (!(await docRef.get()).exists) {
      return NextResponse.json({ error: "POI not found" }, { status: 404 });
    }
    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POI delete failed:", e);
    return dbUnavailable();
  }
}
