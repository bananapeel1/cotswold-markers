import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { reportId, action, adminNote } = body;

    if (!reportId || !action) {
      return Response.json({ error: "reportId and action required" }, { status: 400 });
    }

    const validActions = ["acknowledge", "resolve"];
    if (!validActions.includes(action)) {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = getDb();
    const reportRef = db.collection("markerReports").doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (action === "acknowledge") {
      updates.status = "acknowledged";
      if (adminNote) updates.adminNote = adminNote;
    } else if (action === "resolve") {
      updates.status = "resolved";
      updates.resolvedAt = new Date().toISOString();
      if (adminNote) updates.adminNote = adminNote;
    }

    await reportRef.update(updates);

    return Response.json({ success: true, action });
  } catch (e) {
    console.error("Report moderation failed:", e);
    return Response.json({ error: "Failed to moderate" }, { status: 500 });
  }
}
