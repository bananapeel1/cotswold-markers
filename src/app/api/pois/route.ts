import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const JSON_PATH = path.join(process.cwd(), "public/data/pois.json");

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
  };

  if (isFirestoreAvailable()) {
    try {
      await getDb().collection("pois").doc(id).set(newPoi);
      return NextResponse.json({ success: true, poi: newPoi });
    } catch (e) {
      console.warn("Firestore write failed, falling back to JSON:", e);
    }
  }

  const data = JSON.parse(await readFile(JSON_PATH, "utf-8"));
  data.push(newPoi);
  await writeFile(JSON_PATH, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true, poi: newPoi });
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poi } = await request.json();
  if (!poi?.id) {
    return NextResponse.json({ error: "POI ID required" }, { status: 400 });
  }

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const docRef = db.collection("pois").doc(poi.id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return NextResponse.json({ error: "POI not found" }, { status: 404 });
      }
      const updated = { ...doc.data(), ...poi };
      await docRef.set(updated);
      return NextResponse.json({ success: true, poi: updated });
    } catch (e) {
      console.warn("Firestore write failed, falling back to JSON:", e);
    }
  }

  const data = JSON.parse(await readFile(JSON_PATH, "utf-8"));
  const index = data.findIndex((p: { id: string }) => p.id === poi.id);
  if (index === -1) {
    return NextResponse.json({ error: "POI not found" }, { status: 404 });
  }
  data[index] = { ...data[index], ...poi };
  await writeFile(JSON_PATH, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true, poi: data[index] });
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "POI ID required" }, { status: 400 });
  }

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const docRef = db.collection("pois").doc(id);
      if (!(await docRef.get()).exists) {
        return NextResponse.json({ error: "POI not found" }, { status: 404 });
      }
      await docRef.delete();
      return NextResponse.json({ success: true });
    } catch (e) {
      console.warn("Firestore delete failed, falling back to JSON:", e);
    }
  }

  const data = JSON.parse(await readFile(JSON_PATH, "utf-8"));
  const filtered = data.filter((p: { id: string }) => p.id !== id);
  if (filtered.length === data.length) {
    return NextResponse.json({ error: "POI not found" }, { status: 404 });
  }
  await writeFile(JSON_PATH, JSON.stringify(filtered, null, 2));
  return NextResponse.json({ success: true });
}
