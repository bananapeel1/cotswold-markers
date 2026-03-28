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
    return Response.json({ entries: [] });
  }

  try {
    const db = getDb();
    const markerId = request.nextUrl.searchParams.get("markerId");

    let query = db.collection("journalEntries").where("userId", "==", session.uid);
    if (markerId) {
      query = query.where("markerId", "==", markerId);
    }

    const snapshot = await query.orderBy("timestamp", "desc").get();
    const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return Response.json({ entries });
  } catch (e) {
    console.error("Journal GET failed:", e);
    // Fallback: try without orderBy (no composite index)
    try {
      const db = getDb();
      const markerId = request.nextUrl.searchParams.get("markerId");
      let query = db.collection("journalEntries").where("userId", "==", session.uid);
      if (markerId) {
        query = query.where("markerId", "==", markerId);
      }
      const snapshot = await query.get();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
      entries.sort((a: { timestamp: string }, b: { timestamp: string }) =>
        (b.timestamp || "").localeCompare(a.timestamp || "")
      );
      return Response.json({ entries });
    } catch {
      return Response.json({ entries: [] });
    }
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
    const { markerId, note, photoUrl } = body;

    if (!markerId) {
      return Response.json({ error: "markerId required" }, { status: 400 });
    }

    if (!note && !photoUrl) {
      return Response.json({ error: "Note or photo required" }, { status: 400 });
    }

    const db = getDb();
    const timestamp = new Date().toISOString();

    const entryDoc: Record<string, unknown> = {
      userId: session.uid,
      markerId,
      note: (note || "").slice(0, 500),
      photoUrl: photoUrl || null,
      sharedToCommunity: false,
      timestamp,
    };

    const docRef = await db.collection("journalEntries").add(entryDoc);

    return Response.json({
      success: true,
      entry: {
        id: docRef.id,
        ...entryDoc,
      },
    });
  } catch (e) {
    console.error("Journal POST failed:", e);
    return Response.json({ error: "Failed to save journal entry" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, note } = body;

    if (!id) {
      return Response.json({ error: "id required" }, { status: 400 });
    }

    const db = getDb();
    const docRef = db.collection("journalEntries").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    if (doc.data()?.userId !== session.uid) {
      return Response.json({ error: "Not your entry" }, { status: 403 });
    }

    await docRef.update({ note: (note || "").slice(0, 500) });
    return Response.json({ success: true });
  } catch (e) {
    console.error("Journal PUT failed:", e);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return Response.json({ error: "id required" }, { status: 400 });
    }

    const db = getDb();
    const docRef = db.collection("journalEntries").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    if (doc.data()?.userId !== session.uid) {
      return Response.json({ error: "Not your entry" }, { status: 403 });
    }

    // If shared to community, clean up the community photo
    if (doc.data()?.sharedToCommunity) {
      try {
        const communityPhotos = await db
          .collection("communityPhotos")
          .where("sourceId", "==", id)
          .where("source", "==", "journal")
          .get();
        const batch = db.batch();
        communityPhotos.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch {
        // Non-critical
      }
    }

    await docRef.delete();
    return Response.json({ success: true });
  } catch (e) {
    console.error("Journal DELETE failed:", e);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
