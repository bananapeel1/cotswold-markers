import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable, getAdminAuth } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const markerId = request.nextUrl.searchParams.get("markerId");
  if (!markerId) {
    return Response.json({ error: "markerId required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ reports: [] });
  }

  try {
    const db = getDb();
    const snapshot = await db
      .collection("markerReports")
      .where("markerId", "==", markerId)
      .limit(20)
      .get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reports = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .filter((r: { status: string }) => r.status !== "resolved")
      .sort((a: { timestamp: string }, b: { timestamp: string }) =>
        (b.timestamp || "").localeCompare(a.timestamp || "")
      )
      .slice(0, 10);

    return Response.json({ reports });
  } catch (e) {
    console.error("Marker reports GET failed:", e);
    return Response.json({ reports: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markerId, issueType, note, idToken, photoUrl, photoStoragePath } = body;

    if (!markerId || !issueType) {
      return Response.json({ error: "markerId and issueType required" }, { status: 400 });
    }

    if (!idToken) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const validTypes = ["missing", "damaged", "obscured", "wrong-location", "other"];
    if (!validTypes.includes(issueType)) {
      return Response.json({ error: "Invalid issue type" }, { status: 400 });
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

    // Rate limit: 3 reports per user per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
      const todayReports = await db
        .collection("markerReports")
        .where("userId", "==", userId)
        .get();

      const todayCount = todayReports.docs.filter(
        (doc) => (doc.data().timestamp || "") >= todayStart.toISOString()
      ).length;

      if (todayCount >= 3) {
        return Response.json({ error: "Maximum 3 reports per day" }, { status: 429 });
      }
    } catch {
      // Collection may not exist yet
    }

    const timestamp = new Date().toISOString();

    const reportDoc: Record<string, unknown> = {
      markerId,
      userId,
      userName,
      issueType,
      note: (note || "").slice(0, 200),
      status: "open",
      timestamp,
    };

    if (photoUrl) {
      reportDoc.photoUrl = photoUrl;
      reportDoc.photoStoragePath = photoStoragePath || null;
    }

    const docRef = await db.collection("markerReports").add(reportDoc);

    return Response.json({
      success: true,
      report: {
        id: docRef.id,
        ...reportDoc,
      },
    });
  } catch (e) {
    console.error("Marker reports POST failed:", e);
    return Response.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    const idToken = request.nextUrl.searchParams.get("idToken");

    if (!id || !idToken) {
      return Response.json({ error: "id and idToken required" }, { status: 400 });
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

    const db = getDb();
    const docRef = db.collection("markerReports").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }

    if (doc.data()?.userId !== decoded.uid) {
      return Response.json({ error: "Not your report" }, { status: 403 });
    }

    await docRef.delete();
    return Response.json({ success: true });
  } catch (e) {
    console.error("Marker reports DELETE failed:", e);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
