import { NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Server-side cache to avoid scanning full users collection on every request
let cachedStats: {
  totalScans: number;
  totalWalkers: number;
  activeNow: number;
  completionsThisMonth: number;
} | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function GET() {
  // Return cached data if fresh
  const now = Date.now();
  if (cachedStats && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedStats);
  }

  if (!isFirestoreAvailable()) {
    return NextResponse.json({
      totalScans: 0,
      totalWalkers: 0,
      activeNow: 0,
      completionsThisMonth: 0,
    });
  }

  try {
    const db = getDb();

    // Total scans
    const countsDoc = await db.collection("scanCounts").doc("counts").get();
    const counts = countsDoc.exists ? (countsDoc.data() as Record<string, number>) : {};
    const totalScans = Object.values(counts).reduce((sum, v) => sum + v, 0);

    // Users collection
    const usersSnapshot = await db.collection("users").get();
    const totalWalkers = usersSnapshot.size;

    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let activeNow = 0;
    let completionsThisMonth = 0;

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const scans = data.scans || [];
      if (scans.length === 0) return;

      // Active now — last scan within 2 hours
      const lastScan = scans[scans.length - 1];
      if (lastScan && new Date(lastScan.timestamp).getTime() > twoHoursAgo) {
        activeNow++;
      }

      // Completions this month — 50 unique markers, with a scan this month
      const uniqueMarkers = new Set(scans.map((s: { markerId: string }) => s.markerId));
      if (uniqueMarkers.size >= 50) {
        const hasThisMonth = scans.some(
          (s: { timestamp: string }) => new Date(s.timestamp) >= monthStart
        );
        if (hasThisMonth) completionsThisMonth++;
      }
    });

    const stats = {
      totalScans,
      totalWalkers,
      activeNow,
      completionsThisMonth,
    };

    // Update cache
    cachedStats = stats;
    cacheTimestamp = now;

    return NextResponse.json(stats);
  } catch (e) {
    console.warn("Community stats failed:", e);
    return NextResponse.json({
      totalScans: 0,
      totalWalkers: 0,
      activeNow: 0,
      completionsThisMonth: 0,
    });
  }
}
