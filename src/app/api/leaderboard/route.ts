import { NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export const dynamic = "force-dynamic";

interface LeaderboardEntry {
  rank: number;
  name: string;
  scanCount: number;
  badgeCount: number;
  isComplete: boolean;
  isCurrentUser?: boolean;
}

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");

  if (!isFirestoreAvailable()) {
    return NextResponse.json({ leaderboard: [], userRank: null });
  }

  try {
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

    // Find current user's rank
    let userRank: number | null = null;
    if (userId) {
      const userEntry = entries.find((e) => e.id === userId);
      if (userEntry) {
        userEntry.isCurrentUser = true;
        userRank = userEntry.rank;
      }
    }

    // Return top 20 (include current user if outside top 20)
    const top20 = entries.slice(0, 20).map(({ id, ...rest }) => rest);

    if (userId && userRank && userRank > 20) {
      const userEntry = entries.find((e) => e.id === userId);
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
