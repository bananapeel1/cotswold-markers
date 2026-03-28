import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const SEASON_MONTHS: Record<string, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  for (const [season, months] of Object.entries(SEASON_MONTHS)) {
    if (months.includes(month)) return season;
  }
  return "spring";
}

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get("season") || getCurrentSeason();
  const months = SEASON_MONTHS[season];

  if (!months) {
    return Response.json({ error: "Invalid season" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ season, coveredMarkers: [], total: 0 });
  }

  try {
    const db = getDb();
    const snapshot = await db
      .collection("communityPhotos")
      .where("moderationStatus", "==", "published")
      .get();

    const now = new Date().toISOString();
    const coveredMarkers = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.expiresAt && data.expiresAt < now) return;
      if (months.includes(data.month)) {
        coveredMarkers.add(data.markerId);
      }
    });

    return Response.json({
      season,
      coveredMarkers: [...coveredMarkers],
      total: coveredMarkers.size,
    });
  } catch (e) {
    console.error("Seasonal photos GET failed:", e);
    return Response.json({ season, coveredMarkers: [], total: 0 });
  }
}
