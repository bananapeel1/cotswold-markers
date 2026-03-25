import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { invalidateScanCountsCache } from "@/data/scanCounts";

export const dynamic = "force-dynamic";

// In-memory scan log (detailed records — kept for backward compat)
const scans: Array<{
  markerId: string;
  timestamp: string;
  source: string;
  userAgent: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markerId, source = "direct" } = body;

    if (!markerId) {
      return Response.json({ error: "markerId required" }, { status: 400 });
    }

    // Always keep in-memory log
    scans.push({
      markerId,
      timestamp: new Date().toISOString(),
      source,
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Persist count to Firestore
    if (isFirestoreAvailable()) {
      try {
        const db = getDb();
        await db
          .collection("scanCounts")
          .doc("counts")
          .set({ [markerId]: FieldValue.increment(1) }, { merge: true });
        invalidateScanCountsCache();
      } catch (e) {
        console.warn("Firestore scan count update failed:", e);
      }
    }

    return Response.json({ success: true, totalScans: scans.length });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  return Response.json({
    scans,
    total: scans.length,
  });
}
