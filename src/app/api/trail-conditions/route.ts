import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable, getAdminAuth } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const markerId = request.nextUrl.searchParams.get("markerId");
  if (!markerId) {
    return Response.json({ error: "markerId required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ conditions: [] });
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();

    // Simple query on markerId only — filter expiry client-side to avoid needing a composite index
    const snapshot = await db
      .collection("trailConditions")
      .where("markerId", "==", markerId)
      .limit(20)
      .get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
    const conditions = allDocs
      .filter((c: { expiresAt?: string }) => c.expiresAt ? c.expiresAt > now : true)
      .sort((a: { timestamp?: string }, b: { timestamp?: string }) =>
        (b.timestamp || "").localeCompare(a.timestamp || "")
      )
      .slice(0, 10);

    return Response.json({ conditions });
  } catch (e) {
    console.error("Trail conditions GET failed:", e);
    return Response.json({ conditions: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markerId, conditionType, note, idToken, photoUrl, photoStoragePath } = body;

    if (!markerId || !conditionType) {
      return Response.json({ error: "markerId and conditionType required" }, { status: 400 });
    }

    if (!idToken) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isFirestoreAvailable()) {
      return Response.json({ error: "Service unavailable" }, { status: 503 });
    }

    let decoded;
    try {
      decoded = await getAdminAuth().verifyIdToken(idToken);
    } catch (authErr) {
      console.error("Trail conditions auth failed:", authErr);
      return Response.json({ error: "Invalid authentication" }, { status: 401 });
    }

    const userId = decoded.uid;
    const userName = decoded.name || decoded.email?.split("@")[0] || "Walker";

    const db = getDb();

    // Rate limit: max 3 reports per user per day — simple query on userId only
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let todayCount = 0;
    try {
      const todayReports = await db
        .collection("trailConditions")
        .where("userId", "==", userId)
        .get();

      todayCount = todayReports.docs.filter(
        (doc) => (doc.data().timestamp || "") >= todayStart.toISOString()
      ).length;
    } catch {
      // Collection may not exist yet — that's fine
    }

    if (todayCount >= 3) {
      return Response.json({ error: "Maximum 3 reports per day" }, { status: 429 });
    }

    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const conditionDoc: Record<string, unknown> = {
      markerId,
      userId,
      userName,
      conditionType,
      note: note?.slice(0, 200) || "",
      timestamp,
      expiresAt,
    };

    if (photoUrl) {
      conditionDoc.photoUrl = photoUrl;
      conditionDoc.photoStoragePath = photoStoragePath || null;
    }

    const docRef = await db.collection("trailConditions").add(conditionDoc);

    // If photo provided, also create a community photo doc
    if (photoUrl) {
      try {
        await db.collection("communityPhotos").add({
          markerId,
          userId,
          userName,
          photoUrl,
          storagePath: photoStoragePath || photoUrl,
          source: "condition",
          sourceId: docRef.id,
          month: new Date().getMonth() + 1,
          timestamp,
          expiresAt,
          moderationStatus: "published",
          moderationReason: null,
          reportCount: 0,
          reportedBy: [],
        });
      } catch {
        // Non-critical — condition report still saved
      }
    }

    return Response.json({
      success: true,
      condition: {
        id: docRef.id,
        markerId,
        userId,
        userName,
        conditionType,
        note: note?.slice(0, 200) || "",
        photoUrl: photoUrl || undefined,
        timestamp,
        expiresAt,
      },
    });
  } catch (e) {
    console.error("Trail conditions POST failed:", e);
    return Response.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
