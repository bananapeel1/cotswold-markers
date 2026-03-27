import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getDb, isFirestoreAvailable, getAdminAuth } from "@/lib/firebase";

export const dynamic = "force-dynamic";

/**
 * PUT /api/user/profile — Update display name in Firestore
 */
export async function PUT(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 50) : null;

  if (!displayName) {
    return NextResponse.json({ error: "displayName required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const db = getDb();
    await db.collection("users").doc(session.uid).set(
      { displayName, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    // Also update Firebase Auth profile
    try {
      await getAdminAuth().updateUser(session.uid, { displayName });
    } catch {
      // non-critical
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

/**
 * GET /api/user/profile?export=true — Export all user data as JSON
 */
export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const isExport = request.nextUrl.searchParams.get("export") === "true";
  if (!isExport) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const db = getDb();

    // Get user document (scans, badges, streak)
    const userDoc = await db.collection("users").doc(session.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Get journal entries
    const journalSnap = await db
      .collection("journalEntries")
      .where("userId", "==", session.uid)
      .orderBy("timestamp", "desc")
      .get();
    const journalEntries = journalSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get friend connections
    const friendsSnap = await db
      .collection("friendships")
      .where("userIds", "array-contains", session.uid)
      .get();
    const friends = friendsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      user: {
        uid: session.uid,
        email: session.email,
        displayName: userData?.displayName || session.name,
      },
      scans: userData?.scans || [],
      badges: userData?.badges || [],
      streak: userData?.streak || null,
      journalEntries,
      friends,
    });
  } catch {
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/profile — Delete all user data from Firestore
 */
export async function DELETE(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const db = getDb();

    // Delete user document
    await db.collection("users").doc(session.uid).delete();

    // Delete journal entries
    const journalSnap = await db
      .collection("journalEntries")
      .where("userId", "==", session.uid)
      .get();
    const batch1 = db.batch();
    journalSnap.docs.forEach((doc) => batch1.delete(doc.ref));
    if (journalSnap.docs.length > 0) await batch1.commit();

    // Delete friendships
    const friendsSnap = await db
      .collection("friendships")
      .where("userIds", "array-contains", session.uid)
      .get();
    const batch2 = db.batch();
    friendsSnap.docs.forEach((doc) => batch2.delete(doc.ref));
    if (friendsSnap.docs.length > 0) await batch2.commit();

    // Delete Firebase Auth user
    try {
      await getAdminAuth().deleteUser(session.uid);
    } catch {
      // User might have already been deleted client-side
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
