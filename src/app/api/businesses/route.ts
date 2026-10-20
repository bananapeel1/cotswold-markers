import { NextRequest, NextResponse } from "next/server";
import { invalidateContent } from "@/lib/firestoreRead";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import { businessSchema, formatIssues } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

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
    ...(business.discountCode ? { discountCode: business.discountCode } : {}),
  };

  const parsed = businessSchema.safeParse(newBusiness);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatIssues(parsed.error) },
      { status: 400 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    await getDb().collection("businesses").doc(id).set(newBusiness);
    invalidateContent("businesses");
    return NextResponse.json({ success: true, business: newBusiness });
  } catch (e) {
    console.error("Business create failed:", e);
    return dbUnavailable();
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business } = await request.json();
  if (!business?.id) {
    return NextResponse.json({ error: "Business ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("businesses").doc(business.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    const updated = { ...doc.data(), ...business };

    const parsed = businessSchema.safeParse(updated);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: formatIssues(parsed.error) },
        { status: 400 }
      );
    }

    await docRef.set(updated);
    invalidateContent("businesses");
    return NextResponse.json({ success: true, business: updated });
  } catch (e) {
    console.error("Business update failed:", e);
    return dbUnavailable();
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Business ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("businesses").doc(id);
    if (!(await docRef.get()).exists) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    await docRef.delete();
    invalidateContent("businesses");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Business delete failed:", e);
    return dbUnavailable();
  }
}
