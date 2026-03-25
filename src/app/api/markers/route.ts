import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { invalidateMarkersCache } from "@/data/markers";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MARKERS_PATH = path.join(process.cwd(), "public/data/markers.json");

export async function GET() {
  const { getMarkers } = await import("@/data/markers");
  const markers = await getMarkers();
  return NextResponse.json(markers);
}

export async function PUT(request: NextRequest) {
  if (!(await verifySession(request)).authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { marker } = body;

  if (!marker?.id) {
    return NextResponse.json({ error: "Marker ID required" }, { status: 400 });
  }

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const docRef = db.collection("markers").doc(marker.id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return NextResponse.json({ error: "Marker not found" }, { status: 404 });
      }
      const updated = { ...doc.data(), ...marker };
      await docRef.set(updated);
      invalidateMarkersCache();
      return NextResponse.json({ success: true, marker: updated });
    } catch (e) {
      console.warn("Firestore write failed, falling back to JSON:", e);
    }
  }

  // JSON file fallback
  const data = JSON.parse(await readFile(MARKERS_PATH, "utf-8"));
  const index = data.findIndex((m: { id: string }) => m.id === marker.id);

  if (index === -1) {
    return NextResponse.json({ error: "Marker not found" }, { status: 404 });
  }

  data[index] = { ...data[index], ...marker };
  await writeFile(MARKERS_PATH, JSON.stringify(data, null, 2));
  invalidateMarkersCache();

  return NextResponse.json({ success: true, marker: data[index] });
}

export async function POST(request: NextRequest) {
  if (!(await verifySession(request)).authenticated) {
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

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      await db.collection("markers").doc(id).set(newMarker);
      invalidateMarkersCache();
      return NextResponse.json({ success: true, marker: newMarker });
    } catch (e) {
      console.warn("Firestore write failed, falling back to JSON:", e);
    }
  }

  // JSON file fallback
  const data = JSON.parse(await readFile(MARKERS_PATH, "utf-8"));
  data.push(newMarker);
  await writeFile(MARKERS_PATH, JSON.stringify(data, null, 2));
  invalidateMarkersCache();

  return NextResponse.json({ success: true, marker: newMarker });
}

export async function DELETE(request: NextRequest) {
  if (!(await verifySession(request)).authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Marker ID required" }, { status: 400 });
  }

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const docRef = db.collection("markers").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return NextResponse.json({ error: "Marker not found" }, { status: 404 });
      }
      await docRef.delete();
      invalidateMarkersCache();
      return NextResponse.json({ success: true });
    } catch (e) {
      console.warn("Firestore delete failed, falling back to JSON:", e);
    }
  }

  // JSON file fallback
  const data = JSON.parse(await readFile(MARKERS_PATH, "utf-8"));
  const filtered = data.filter((m: { id: string }) => m.id !== id);

  if (filtered.length === data.length) {
    return NextResponse.json({ error: "Marker not found" }, { status: 404 });
  }

  await writeFile(MARKERS_PATH, JSON.stringify(filtered, null, 2));
  invalidateMarkersCache();
  return NextResponse.json({ success: true });
}
