import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const MARKERS_PATH = path.join(process.cwd(), "public/data/markers.json");

function isAuthed(request: NextRequest): boolean {
  return request.cookies.get("trailtap-admin")?.value === "authenticated";
}

export async function GET() {
  const data = await readFile(MARKERS_PATH, "utf-8");
  return NextResponse.json(JSON.parse(data));
}

export async function PUT(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { marker } = body;

  if (!marker?.id) {
    return NextResponse.json({ error: "Marker ID required" }, { status: 400 });
  }

  const data = JSON.parse(await readFile(MARKERS_PATH, "utf-8"));
  const index = data.findIndex((m: { id: string }) => m.id === marker.id);

  if (index === -1) {
    return NextResponse.json({ error: "Marker not found" }, { status: 404 });
  }

  data[index] = { ...data[index], ...marker };
  await writeFile(MARKERS_PATH, JSON.stringify(data, null, 2));

  return NextResponse.json({ success: true, marker: data[index] });
}

export async function POST(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { marker } = body;

  if (!marker?.name || !marker?.shortCode) {
    return NextResponse.json({ error: "Name and shortCode required" }, { status: 400 });
  }

  const data = JSON.parse(await readFile(MARKERS_PATH, "utf-8"));

  // Generate ID from name
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

  data.push(newMarker);
  await writeFile(MARKERS_PATH, JSON.stringify(data, null, 2));

  return NextResponse.json({ success: true, marker: newMarker });
}

export async function DELETE(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Marker ID required" }, { status: 400 });
  }

  const data = JSON.parse(await readFile(MARKERS_PATH, "utf-8"));
  const filtered = data.filter((m: { id: string }) => m.id !== id);

  if (filtered.length === data.length) {
    return NextResponse.json({ error: "Marker not found" }, { status: 404 });
  }

  await writeFile(MARKERS_PATH, JSON.stringify(filtered, null, 2));
  return NextResponse.json({ success: true });
}
