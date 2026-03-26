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
    const snapshot = await db
      .collection("trailConditions")
      .where("markerId", "==", markerId)
      .where("expiresAt", ">", now)
      .orderBy("expiresAt", "desc")
      .limit(10)
      .get();

    const conditions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return Response.json({ conditions });
  } catch {
    return Response.json({ conditions: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markerId, conditionType, note, idToken } = body;

    if (!markerId || !conditionType) {
      return Response.json({ error: "markerId and conditionType required" }, { status: 400 });
    }

    if (!idToken) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isFirestoreAvailable()) {
      return Response.json({ error: "Service unavailable" }, { status: 503 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const userId = decoded.uid;
    const userName = decoded.name || decoded.email?.split("@")[0] || "Walker";

    const db = getDb();

    // Rate limit: max 3 reports per user per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayReports = await db
      .collection("trailConditions")
      .where("userId", "==", userId)
      .where("timestamp", ">=", todayStart.toISOString())
      .get();

    if (todayReports.size >= 3) {
      return Response.json({ error: "Maximum 3 reports per day" }, { status: 429 });
    }

    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const docRef = await db.collection("trailConditions").add({
      markerId,
      userId,
      userName,
      conditionType,
      note: note?.slice(0, 200) || "",
      timestamp,
      expiresAt,
    });

    return Response.json({
      success: true,
      condition: {
        id: docRef.id,
        markerId,
        userId,
        userName,
        conditionType,
        note: note?.slice(0, 200) || "",
        timestamp,
        expiresAt,
      },
    });
  } catch {
    return Response.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
