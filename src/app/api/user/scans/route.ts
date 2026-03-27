import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable, getAdminAuth } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const userId = decoded.uid;

    if (!isFirestoreAvailable()) {
      return NextResponse.json({ scans: [], badges: [], streak: { current: 0, best: 0, lastScanDate: null } });
    }

    const db = getDb();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({
        scans: [],
        badges: [],
        streak: { current: 0, best: 0, lastScanDate: null },
      });
    }

    const data = userDoc.data()!;
    return NextResponse.json({
      scans: data.scans || [],
      badges: data.badges || [],
      streak: data.streak || { current: 0, best: 0, lastScanDate: null },
      xp: data.xp || 0,
      segmentTimes: data.segmentTimes || [],
    });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
