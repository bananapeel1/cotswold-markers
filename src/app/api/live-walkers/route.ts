import { NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Cache to avoid hammering Firestore
let cachedCount = 0;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function GET() {
  const now = Date.now();

  if (now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json({ count: cachedCount });
  }

  if (!isFirestoreAvailable()) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const db = getDb();
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    // Read all users and manually filter to avoid Firestore index requirement
    const snapshot = await db.collection("users").get();

    let activeCount = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();

      // Check lastScanAt field first (set by scan endpoint)
      if (data.lastScanAt) {
        const lastScanTime = new Date(data.lastScanAt).getTime();
        if (lastScanTime > twoHoursAgo) {
          activeCount++;
          return;
        }
      }

      // Fall back to checking scans array (matches community route approach)
      const scans = data.scans;
      if (Array.isArray(scans) && scans.length > 0) {
        const lastScan = scans[scans.length - 1];
        if (lastScan?.timestamp && new Date(lastScan.timestamp).getTime() > twoHoursAgo) {
          activeCount++;
        }
      }
    });

    cachedCount = activeCount;
    cacheTimestamp = now;

    return NextResponse.json({ count: cachedCount });
  } catch (e) {
    console.warn("Live walkers count failed:", e);
    return NextResponse.json({ count: 0 });
  }
}
