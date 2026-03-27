import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const JSON_PATH = path.join(process.cwd(), "public/data/businesses.json");

export async function GET() {
  const { getBusinesses } = await import("@/data/businesses");
  const businesses = await getBusinesses();
  return NextResponse.json(businesses);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business } = await request.json();
  if (!business?.name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const id = `biz-${business.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}-${Date.now().toString(36)}`;
  const newBusiness = {
    id,
    name: business.name,
    type: business.type || "pub",
    description: business.description || "",
    offer: business.offer || null,
    offerExpiry: business.offerExpiry || null,
    address: business.address || "",
    latitude: business.latitude || 0,
    longitude: business.longitude || 0,
    phone: business.phone || "",
    website: business.website || null,
    openingHours: business.openingHours || "",
    distanceFromTrail_miles: business.distanceFromTrail_miles || 0,
    imageUrl: business.imageUrl || "",
    isSponsor: business.isSponsor || false,
    markerIds: business.markerIds || [],
  };

  if (isFirestoreAvailable()) {
    try {
      await getDb().collection("businesses").doc(id).set(newBusiness);
      return NextResponse.json({ success: true, business: newBusiness });
    } catch (e) {
      console.warn("Firestore write failed, falling back to JSON:", e);
    }
  }

  const data = JSON.parse(await readFile(JSON_PATH, "utf-8"));
  data.push(newBusiness);
  await writeFile(JSON_PATH, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true, business: newBusiness });
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business } = await request.json();
  if (!business?.id) {
    return NextResponse.json({ error: "Business ID required" }, { status: 400 });
  }

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const docRef = db.collection("businesses").doc(business.id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }
      const updated = { ...doc.data(), ...business };
      await docRef.set(updated);
      return NextResponse.json({ success: true, business: updated });
    } catch (e) {
      console.warn("Firestore write failed, falling back to JSON:", e);
    }
  }

  const data = JSON.parse(await readFile(JSON_PATH, "utf-8"));
  const index = data.findIndex((b: { id: string }) => b.id === business.id);
  if (index === -1) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  data[index] = { ...data[index], ...business };
  await writeFile(JSON_PATH, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true, business: data[index] });
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Business ID required" }, { status: 400 });
  }

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const docRef = db.collection("businesses").doc(id);
      if (!(await docRef.get()).exists) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }
      await docRef.delete();
      return NextResponse.json({ success: true });
    } catch (e) {
      console.warn("Firestore delete failed, falling back to JSON:", e);
    }
  }

  const data = JSON.parse(await readFile(JSON_PATH, "utf-8"));
  const filtered = data.filter((b: { id: string }) => b.id !== id);
  if (filtered.length === data.length) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  await writeFile(JSON_PATH, JSON.stringify(filtered, null, 2));
  return NextResponse.json({ success: true });
}
