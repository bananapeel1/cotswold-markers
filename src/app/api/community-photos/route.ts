import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const markerId = request.nextUrl.searchParams.get("markerId");
  if (!markerId) {
    return Response.json({ error: "markerId required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ photos: [] });
  }

  try {
    const db = getDb();
    const snapshot = await db
      .collection("communityPhotos")
      .where("markerId", "==", markerId)
      .where("moderationStatus", "==", "published")
      .limit(50)
      .get();

    const now = new Date().toISOString();
    const photos = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p: Record<string, unknown>) =>
        !p.expiresAt || (p.expiresAt as string) > now
      )
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((b.timestamp as string) || "").localeCompare((a.timestamp as string) || "")
      );

    return Response.json({ photos });
  } catch (e) {
    console.error("Community photos GET failed:", e);
    return Response.json({ photos: [] });
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
    const { markerId, photoUrl, storagePath, source, sourceId } = body;

    if (!markerId || !photoUrl || !storagePath || !source || !sourceId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();

    // Rate limit: 10 community photos per user per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
      const todayPhotos = await db
        .collection("communityPhotos")
        .where("userId", "==", session.uid)
        .get();

      const todayCount = todayPhotos.docs.filter(
        (doc) => (doc.data().timestamp || "") >= todayStart.toISOString()
      ).length;

      if (todayCount >= 10) {
        return Response.json({ error: "Maximum 10 community photos per day" }, { status: 429 });
      }
    } catch {
      // Collection may not exist yet
    }

    const timestamp = new Date().toISOString();
    const month = new Date().getMonth() + 1; // 1-12
    const expiresAt = source === "condition"
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const photoDoc = {
      markerId,
      userId: session.uid,
      userName: session.name || session.email?.split("@")[0] || "Walker",
      photoUrl,
      storagePath,
      source,
      sourceId,
      month,
      timestamp,
      expiresAt,
      moderationStatus: "published",
      moderationReason: null,
      reportCount: 0,
      reportedBy: [],
    };

    const docRef = await db.collection("communityPhotos").add(photoDoc);

    // Fire moderation check (non-blocking)
    try {
      const baseUrl = request.nextUrl.origin;
      fetch(`${baseUrl}/api/community-photos/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: docRef.id, photoUrl }),
      }).catch(() => {});
    } catch {
      // Non-blocking — moderation check is best-effort
    }

    return Response.json({
      success: true,
      photo: { id: docRef.id, ...photoDoc },
    });
  } catch (e) {
    console.error("Community photos POST failed:", e);
    return Response.json({ error: "Failed to save photo" }, { status: 500 });
  }
}
