import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ reports: [] });
  }

  try {
    const db = getDb();
    const snapshot = await db
      .collection("markerReports")
      .limit(200)
      .get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reports = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .sort((a: { timestamp: string }, b: { timestamp: string }) =>
        (b.timestamp || "").localeCompare(a.timestamp || "")
      );

    return Response.json({ reports });
  } catch (e) {
    console.error("Admin reports GET failed:", e);
    return Response.json({ reports: [] });
  }
}
