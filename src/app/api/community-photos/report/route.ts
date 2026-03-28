import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifySession } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

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
    const { photoId, reason } = body;

    if (!photoId || !reason) {
      return Response.json({ error: "photoId and reason required" }, { status: 400 });
    }

    const validReasons = ["inappropriate", "spam", "offensive", "other"];
    if (!validReasons.includes(reason)) {
      return Response.json({ error: "Invalid reason" }, { status: 400 });
    }

    const db = getDb();
    const photoRef = db.collection("communityPhotos").doc(photoId);
    const photoDoc = await photoRef.get();

    if (!photoDoc.exists) {
      return Response.json({ error: "Photo not found" }, { status: 404 });
    }

    const data = photoDoc.data()!;
    const reportedBy = (data.reportedBy as string[]) || [];

    if (reportedBy.includes(session.uid)) {
      return Response.json({ error: "Already reported" }, { status: 409 });
    }

    // Add report
    await db.collection("photoReports").add({
      photoId,
      reporterId: session.uid,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Update photo doc
    const newCount = (data.reportCount || 0) + 1;
    const updates: Record<string, unknown> = {
      reportCount: newCount,
      reportedBy: FieldValue.arrayUnion(session.uid),
    };

    // Auto-flag at 3 reports
    if (newCount >= 3 && data.moderationStatus === "published") {
      updates.moderationStatus = "flagged";
      updates.moderationReason = `Auto-flagged: ${newCount} user reports`;
    }

    await photoRef.update(updates);

    return Response.json({ success: true });
  } catch (e) {
    console.error("Photo report failed:", e);
    return Response.json({ error: "Failed to report" }, { status: 500 });
  }
}
