import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable, getAdminAuth } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const markerId = request.nextUrl.searchParams.get("markerId");
  if (!markerId) {
    return Response.json({ error: "markerId required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ hints: [] });
  }

  try {
    const db = getDb();
    const snapshot = await db
      .collection("markerHints")
      .where("markerId", "==", markerId)
      .limit(10)
      .get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hints = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .sort((a: { timestamp: string }, b: { timestamp: string }) =>
        (b.timestamp || "").localeCompare(a.timestamp || "")
      );

    return Response.json({ hints });
  } catch (e) {
    console.error("Marker hints GET failed:", e);
    return Response.json({ hints: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markerId, hint, idToken } = body;

    if (!markerId || !hint?.trim()) {
      return Response.json({ error: "markerId and hint required" }, { status: 400 });
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
    } catch {
      return Response.json({ error: "Invalid authentication" }, { status: 401 });
    }

    const userId = decoded.uid;
    const userName = decoded.name || decoded.email?.split("@")[0] || "Walker";
    const db = getDb();

    // Rate limit: 1 hint per user per marker
    try {
      const existing = await db
        .collection("markerHints")
        .where("markerId", "==", markerId)
        .where("userId", "==", userId)
        .get();

      if (!existing.empty) {
        return Response.json({ error: "You already left a tip for this marker" }, { status: 409 });
      }
    } catch {
      // Collection may not exist yet
    }

    const timestamp = new Date().toISOString();

    const hintDoc = {
      markerId,
      userId,
      userName,
      hint: hint.trim().slice(0, 150),
      timestamp,
    };

    const docRef = await db.collection("markerHints").add(hintDoc);

    return Response.json({
      success: true,
      hint: { id: docRef.id, ...hintDoc },
    });
  } catch (e) {
    console.error("Marker hints POST failed:", e);
    return Response.json({ error: "Failed to save hint" }, { status: 500 });
  }
}
