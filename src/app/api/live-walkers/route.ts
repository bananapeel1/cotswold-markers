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
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

    // Query users who have a recent lastScanAt timestamp
    const snapshot = await db
      .collection("users")
      .where("lastScanAt", ">=", twoHoursAgo)
      .get();

    cachedCount = snapshot.size;
    cacheTimestamp = now;

    return NextResponse.json({ count: cachedCount });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
