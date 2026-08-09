import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const snapshot = await getDb().collection("allowedAdmins").get();
    const admins = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          email: doc.id,
          name: data.name || "",
          addedAt: data.addedAt || "",
        };
      })
      .sort((a, b) => a.addedAt.localeCompare(b.addedAt));
    return NextResponse.json(admins);
  } catch (e) {
    console.error("Admin users GET failed:", e);
    return dbUnavailable();
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("allowedAdmins").doc(email);
    if ((await docRef.get()).exists) {
      return NextResponse.json(
        { error: "This email is already an admin" },
        { status: 409 }
      );
    }

    const admin = { email, name, addedAt: new Date().toISOString() };
    await docRef.set(admin);
    return NextResponse.json({ success: true, admin });
  } catch (e) {
    console.error("Admin users POST failed:", e);
    return dbUnavailable();
  }
}

export async function DELETE(request: NextRequest) {
  const session = await verifyAdmin(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emailParam = new URL(request.url).searchParams.get("email");
  const email = emailParam?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (session.email && session.email.toLowerCase() === email) {
    return NextResponse.json(
      { error: "You can't remove your own admin access" },
      { status: 400 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const snapshot = await db.collection("allowedAdmins").get();

    const target = snapshot.docs.find((doc) => doc.id === email);
    if (!target) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (snapshot.size <= 1) {
      return NextResponse.json(
        { error: "There must always be at least one admin" },
        { status: 400 }
      );
    }

    await target.ref.delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Admin users DELETE failed:", e);
    return dbUnavailable();
  }
}
