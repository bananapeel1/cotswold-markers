import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ friends: [] });
  }

  try {
    const db = getDb();
    const uid = session.uid;

    // Query both directions
    const [asInviter, asInvitee] = await Promise.all([
      db.collection("friendships").where("inviterUid", "==", uid).get(),
      db.collection("friendships").where("inviteeUid", "==", uid).get(),
    ]);

    const friendUids: { uid: string; name: string; friendshipId: string }[] = [];

    asInviter.docs.forEach((doc) => {
      const data = doc.data();
      friendUids.push({ uid: data.inviteeUid, name: data.inviteeName, friendshipId: doc.id });
    });
    asInvitee.docs.forEach((doc) => {
      const data = doc.data();
      friendUids.push({ uid: data.inviterUid, name: data.inviterName, friendshipId: doc.id });
    });

    // Get each friend's progress
    const friends = await Promise.all(
      friendUids.map(async (f) => {
        try {
          const userDoc = await db.collection("users").doc(f.uid).get();
          const userData = userDoc.exists ? userDoc.data() : null;
          const scans = userData?.scans || [];
          const uniqueMarkers = new Set(scans.map((s: { markerId: string }) => s.markerId)).size;
          return {
            uid: f.uid,
            name: f.name,
            scanCount: uniqueMarkers,
            badgeCount: (userData?.badges || []).length,
            isComplete: uniqueMarkers >= 15,
          };
        } catch {
          return {
            uid: f.uid,
            name: f.name,
            scanCount: 0,
            badgeCount: 0,
            isComplete: false,
          };
        }
      })
    );

    return Response.json({ friends });
  } catch {
    return Response.json({ friends: [] });
  }
}

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { friendUid } = body;

    if (!friendUid || friendUid === session.uid) {
      return Response.json({ error: "Invalid friend" }, { status: 400 });
    }

    const db = getDb();

    // Check if friendship already exists
    const existing = await db
      .collection("friendships")
      .where("inviterUid", "==", friendUid)
      .where("inviteeUid", "==", session.uid)
      .get();

    const existing2 = await db
      .collection("friendships")
      .where("inviterUid", "==", session.uid)
      .where("inviteeUid", "==", friendUid)
      .get();

    if (!existing.empty || !existing2.empty) {
      return Response.json({ success: true, message: "Already friends" });
    }

    // Get friend's display name
    const friendDoc = await db.collection("users").doc(friendUid).get();
    const friendName = friendDoc.exists
      ? friendDoc.data()?.displayName || friendDoc.data()?.email?.split("@")[0] || "Walker"
      : "Walker";

    const inviterName = session.name || session.email?.split("@")[0] || "Walker";

    await db.collection("friendships").add({
      inviterUid: friendUid,
      inviteeUid: session.uid,
      inviterName,
      inviteeName: friendName,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to add friend" }, { status: 500 });
  }
}
