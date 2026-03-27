import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface LeaderboardEntry {
  rank: number;
  name: string;
  scanCount: number;
  badgeCount: number;
  isComplete: boolean;
  isCurrentUser?: boolean;
}

// Server-side cache
let cachedLeaderboard: (LeaderboardEntry & { id: string })[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 120_000; // 2 minutes

async function getLeaderboardEntries() {
  const now = Date.now();
  if (cachedLeaderboard && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedLeaderboard;
  }

  const db = getDb();
  const usersSnapshot = await db.collection("users").get();

  const entries: (LeaderboardEntry & { id: string })[] = [];

  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    const scans = data.scans || [];
    const badges = data.badges || [];
    const uniqueMarkers = new Set(scans.map((s: { markerId: string }) => s.markerId));

    // Anonymous name — first name only, or initials
    let name = "Anonymous Walker";
    if (data.displayName) {
      const parts = data.displayName.trim().split(" ");
      name = parts[0] + (parts.length > 1 ? " " + parts[1][0] + "." : "");
    }

    entries.push({
      id: doc.id,
      rank: 0,
      name,
      scanCount: uniqueMarkers.size,
      badgeCount: badges.length,
      isComplete: uniqueMarkers.size >= 15,
    });
  });

  // Sort by scan count descending, then badge count
  entries.sort((a, b) => b.scanCount - a.scanCount || b.badgeCount - a.badgeCount);

  // Assign ranks
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  cachedLeaderboard = entries;
  cacheTimestamp = now;
  return entries;
}

export async function GET(request: NextRequest) {
  if (!isFirestoreAvailable()) {
    return NextResponse.json({ leaderboard: [], userRank: null });
  }

  // Only allow userId lookup for authenticated users (prevents enumeration)
  let authenticatedUid: string | null = null;
  const session = await verifySession(request);
  if (session) {
    authenticatedUid = session.uid;
  }

  try {
    const entries = await getLeaderboardEntries();

    // Find current user's rank (only if authenticated)
    let userRank: number | null = null;

    if (authenticatedUid) {
      const userEntry = entries.find((e) => e.id === authenticatedUid);
      if (userEntry) {
        userEntry.isCurrentUser = true;
        userRank = userEntry.rank;
      }
    }

    // Return top 20 (strip internal IDs)
    const top20 = entries.slice(0, 20).map(({ id, ...rest }) => rest);

    if (authenticatedUid && userRank && userRank > 20) {
      const userEntry = entries.find((e) => e.id === authenticatedUid);
      if (userEntry) {
        const { id, ...rest } = userEntry;
        void id;
        top20.push(rest);
      }
    }

    return NextResponse.json({
      leaderboard: top20,
      userRank,
      totalWalkers: entries.length,
    });
  } catch (e) {
    console.warn("Leaderboard failed:", e);
    return NextResponse.json({ leaderboard: [], userRank: null });
  }
}
