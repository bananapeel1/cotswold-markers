import { NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { getMarkers } from "@/data/markers";
import { estimateWalkingTime } from "@/lib/xp";
import type { ScanEntry } from "@/lib/badges";

export const dynamic = "force-dynamic";

interface SegmentLeaderboardEntry {
  name: string;
  actualMinutes: number;
  estimatedMinutes: number;
  accuracy: number;
  timestamp: string;
}

interface SegmentInfo {
  fromMarkerId: string;
  fromMarkerName: string;
  toMarkerId: string;
  toMarkerName: string;
  distanceMiles: number;
  estimatedMinutes: number;
  elevationChange: number;
  leaderboard: SegmentLeaderboardEntry[];
}

// Cache segment leaderboard data
let cachedSegments: SegmentInfo[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 300_000; // 5 minutes

export async function GET() {
  if (!isFirestoreAvailable()) {
    return NextResponse.json({ segments: [] });
  }

  const now = Date.now();
  if (cachedSegments && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json({ segments: cachedSegments });
  }

  try {
    const allMarkers = await getMarkers();
    const db = getDb();
    const usersSnapshot = await db.collection("users").get();

    // Build all marker pairs (consecutive markers)
    const segments: SegmentInfo[] = [];
    for (let i = 0; i < allMarkers.length - 1; i++) {
      const from = allMarkers[i];
      const to = allMarkers[i + 1];
      const estimated = estimateWalkingTime(
        { id: from.id, trailMile: from.trailMile, elevation_m: from.elevation_m },
        { id: to.id, trailMile: to.trailMile, elevation_m: to.elevation_m }
      );
      segments.push({
        fromMarkerId: from.id,
        fromMarkerName: from.name,
        toMarkerId: to.id,
        toMarkerName: to.name,
        distanceMiles: Math.round((to.trailMile - from.trailMile) * 10) / 10,
        estimatedMinutes: estimated,
        elevationChange: to.elevation_m - from.elevation_m,
        leaderboard: [],
      });
    }

    // Build marker index for quick lookup
    const markerIndex = new Map<string, number>();
    allMarkers.forEach((m, i) => markerIndex.set(m.id, i));

    // Process each user's scans to find segment times
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const scans: ScanEntry[] = data.scans || [];
      if (scans.length < 2) return;

      let userName = "Anonymous Walker";
      if (data.displayName) {
        const parts = data.displayName.trim().split(" ");
        userName = parts[0] + (parts.length > 1 ? " " + parts[1][0] + "." : "");
      }

      // Sort scans chronologically
      const sorted = [...scans].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Find consecutive marker pairs in scan history
      for (let i = 1; i < sorted.length; i++) {
        const prevIdx = markerIndex.get(sorted[i - 1].markerId);
        const currIdx = markerIndex.get(sorted[i].markerId);
        if (prevIdx === undefined || currIdx === undefined) continue;
        if (Math.abs(currIdx - prevIdx) !== 1) continue;

        // Determine segment direction (always use lower index → higher index)
        const segIdx = Math.min(prevIdx, currIdx);
        const segment = segments[segIdx];
        if (!segment) continue;

        const actualMinutes = Math.round(
          (new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime()) / 60000
        );

        // Skip unrealistic times
        if (actualMinutes < 5 || actualMinutes > 480) continue;
        // Skip suspiciously fast times (less than 50% of estimate)
        if (actualMinutes < segment.estimatedMinutes * 0.5) continue;

        const deviation = Math.abs(actualMinutes - segment.estimatedMinutes) / segment.estimatedMinutes;
        const accuracy = Math.round((1 - deviation) * 100);

        segment.leaderboard.push({
          name: userName,
          actualMinutes,
          estimatedMinutes: segment.estimatedMinutes,
          accuracy,
          timestamp: sorted[i].timestamp,
        });
      }
    });

    // Sort each segment's leaderboard by accuracy (closest to estimate wins)
    for (const segment of segments) {
      segment.leaderboard.sort((a, b) => b.accuracy - a.accuracy);
      segment.leaderboard = segment.leaderboard.slice(0, 10); // Top 10
    }

    cachedSegments = segments;
    cacheTimestamp = now;

    return NextResponse.json({ segments });
  } catch (e) {
    console.warn("Segment leaderboard failed:", e);
    return NextResponse.json({ segments: [] });
  }
}
