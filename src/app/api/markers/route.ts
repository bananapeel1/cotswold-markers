import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import { markerSchema, formatIssues } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

export async function GET() {
  const { getMarkers } = await import("@/data/markers");
  const markers = await getMarkers();
  return NextResponse.json(markers);
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { marker, confirmCoordinateChange } = body;

  if (!marker?.id) {
    return NextResponse.json({ error: "Marker ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("markers").doc(marker.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 });
    }

    const existing = doc.data() as { latitude: number; longitude: number };
    const updated = { ...existing, ...marker };

    const parsed = markerSchema.safeParse(updated);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: formatIssues(parsed.error) },
        { status: 400 }
      );
    }

    // Markers are physical posts snapped to the trail — moving one must be a
    // deliberate act, confirmed by the editor UI, never a stray form edit.
    const coordsChanged =
      updated.latitude !== existing.latitude ||
      updated.longitude !== existing.longitude;
    if (coordsChanged && confirmCoordinateChange !== true) {
      return NextResponse.json(
        {
          error:
            "This edit moves the marker's position. Confirm the coordinate change to save it.",
          requiresCoordinateConfirmation: true,
        },
        { status: 409 }
      );
    }

    await docRef.set(updated);
    return NextResponse.json({ success: true, marker: updated });
  } catch (e) {
    console.error("Marker update failed:", e);
    return dbUnavailable();
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { marker } = body;

  if (!marker?.name || !marker?.shortCode) {
    return NextResponse.json({ error: "Name and shortCode required" }, { status: 400 });
  }

  const id = `cw-${marker.shortCode.toLowerCase().replace("cw", "")}-${marker.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;
  const newMarker = {
    id,
    shortCode: marker.shortCode,
    name: marker.name,
    subtitle: marker.subtitle || "",
    latitude: marker.latitude || 51.75,
    longitude: marker.longitude || -2.07,
    trailMile: marker.trailMile || 0,
    elevation_m: marker.elevation_m || 100,
    segment: marker.segment || "",
    dayOnTrail: marker.dayOnTrail || 1,
    description: marker.description || "",
    facilities: marker.facilities || [],
    emergencyInfo: {
      nearestRoad: "",
      gridReference: "",
      what3words: "",
      nearestPhone: "",
      mountainRescue: "",
    },
    storyIds: [],
    businessIds: [],
    nextMarkerId: null,
    prevMarkerId: null,
    distanceToNext_miles: 0,
    isActive: true,
    imageUrl: "",
  };

  const parsed = markerSchema.safeParse(newMarker);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatIssues(parsed.error) },
      { status: 400 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("markers").doc(id);
    if ((await docRef.get()).exists) {
      return NextResponse.json(
        { error: `A marker with id "${id}" already exists` },
        { status: 409 }
      );
    }
    await docRef.set(newMarker);
    return NextResponse.json({ success: true, marker: newMarker });
  } catch (e) {
    console.error("Marker create failed:", e);
    return dbUnavailable();
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Marker ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("markers").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 });
    }
    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Marker delete failed:", e);
    return dbUnavailable();
  }
}
