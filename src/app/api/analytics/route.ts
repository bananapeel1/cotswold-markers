import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) {
    return NextResponse.json({
      totalScans: 0,
      thisWeek: 0,
      topMarker: null,
      scansBySource: { direct: 0, qr: 0, nfc: 0 },
      scansByMarker: [],
      dailyScans: [],
      totalWalkers: 0,
      activeNow: 0,
      completionsThisMonth: 0,
      trailConditionsCount: 0,
    });
  }

  try {
    const db = getDb();

    // 1. Per-marker scan counts
    const countsDoc = await db.collection("scanCounts").doc("counts").get();
    const counts = countsDoc.exists ? (countsDoc.data() as Record<string, number>) : {};
    const totalScans = Object.values(counts).reduce((sum, v) => sum + v, 0);

    // Sort markers by scan count
    const scansByMarker = Object.entries(counts)
      .map(([markerId, count]) => {
        const match = markerId.match(/cw-(\d+)/);
        const code = match ? `CW${match[1].padStart(2, "0")}` : markerId;
        return { code, markerId, count };
      })
      .sort((a, b) => b.count - a.count);

    const topMarker = scansByMarker[0]?.code || null;

    // 2. User-level aggregation for source breakdown, daily scans, weekly total
    const usersSnapshot = await db.collection("users").get();
    const totalWalkers = usersSnapshot.size;

    const now = Date.now();
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const sourceCount: Record<string, number> = { direct: 0, qr: 0, nfc: 0 };
    const dailyMap: Record<string, number> = {};
    let thisWeek = 0;
    let activeNow = 0;
    let completionsThisMonth = 0;

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString("en-GB", { weekday: "short" });
      dailyMap[key] = 0;
    }

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const scans: { markerId: string; timestamp: string; source?: string }[] = data.scans || [];
      if (scans.length === 0) return;

      // Active now
      const lastScan = scans[scans.length - 1];
      if (lastScan && new Date(lastScan.timestamp).getTime() > twoHoursAgo) {
        activeNow++;
      }

      // Completions this month
      const uniqueMarkers = new Set(scans.map((s) => s.markerId));
      if (uniqueMarkers.size >= 15) {
        const hasThisMonth = scans.some((s) => new Date(s.timestamp) >= monthStart);
        if (hasThisMonth) completionsThisMonth++;
      }

      // Per-scan aggregation
      for (const scan of scans) {
        const ts = new Date(scan.timestamp).getTime();

        // Source breakdown
        const src = scan.source || "direct";
        if (src in sourceCount) sourceCount[src]++;
        else sourceCount.direct++;

        // This week count
        if (ts > weekAgo) {
          thisWeek++;

          // Daily breakdown
          const dayKey = new Date(ts).toLocaleDateString("en-GB", { weekday: "short" });
          if (dayKey in dailyMap) dailyMap[dayKey]++;
        }
      }
    });

    const dailyScans = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));

    // 3. Trail conditions count (active)
    let trailConditionsCount = 0;
    try {
      const conditionsSnapshot = await db
        .collection("trailConditions")
        .where("expiresAt", ">", new Date().toISOString())
        .get();
      trailConditionsCount = conditionsSnapshot.size;
    } catch {
      // Collection may not exist yet
    }

    return NextResponse.json({
      totalScans,
      thisWeek,
      topMarker,
      scansBySource: sourceCount,
      scansByMarker,
      dailyScans,
      totalWalkers,
      activeNow,
      completionsThisMonth,
      trailConditionsCount,
    });
  } catch (e) {
    console.warn("Analytics failed:", e);
    return NextResponse.json({
      totalScans: 0,
      thisWeek: 0,
      topMarker: null,
      scansBySource: { direct: 0, qr: 0, nfc: 0 },
      scansByMarker: [],
      dailyScans: [],
      totalWalkers: 0,
      activeNow: 0,
      completionsThisMonth: 0,
      trailConditionsCount: 0,
    });
  }
}
