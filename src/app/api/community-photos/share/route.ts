import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifySession } from "@/lib/auth";
import { checkBadges, type ScanEntry, type PhotoStats } from "@/lib/badges";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { journalEntryId, share } = body;

    if (!journalEntryId || typeof share !== "boolean") {
      return Response.json({ error: "journalEntryId and share required" }, { status: 400 });
    }

    const db = getDb();
    const entryRef = db.collection("journalEntries").doc(journalEntryId);
    const entryDoc = await entryRef.get();

    if (!entryDoc.exists) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    const entry = entryDoc.data()!;
    if (entry.userId !== session.uid) {
      return Response.json({ error: "Not your entry" }, { status: 403 });
    }

    if (share && !entry.photoUrl) {
      return Response.json({ error: "Entry has no photo to share" }, { status: 400 });
    }

    if (share) {
      // Create community photo doc
      const timestamp = new Date().toISOString();
      const month = new Date(entry.timestamp || timestamp).getMonth() + 1;

      // Extract storage path from Firebase download URL
      const storagePath = extractStoragePath(entry.photoUrl) || entry.photoUrl;

      const photoDoc = {
        markerId: entry.markerId,
        userId: session.uid,
        userName: session.name || session.email?.split("@")[0] || "Walker",
        photoUrl: entry.photoUrl,
        storagePath,
        source: "journal" as const,
        sourceId: journalEntryId,
        month,
        timestamp: entry.timestamp || timestamp,
        expiresAt: null,
        moderationStatus: "published",
        moderationReason: null,
        reportCount: 0,
        reportedBy: [],
      };

      await db.collection("communityPhotos").add(photoDoc);
      await entryRef.update({ sharedToCommunity: true });

      // Fire moderation check (non-blocking)
      try {
        const baseUrl = request.nextUrl.origin;
        fetch(`${baseUrl}/api/community-photos/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: journalEntryId, photoUrl: entry.photoUrl }),
        }).catch(() => {});
      } catch {
        // Best-effort
      }
    } else {
      // Remove community photo doc for this journal entry
      const existing = await db
        .collection("communityPhotos")
        .where("sourceId", "==", journalEntryId)
        .where("source", "==", "journal")
        .get();

      const batch = db.batch();
      existing.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      await entryRef.update({ sharedToCommunity: false });
    }

    // Re-check badges for photo achievements
    if (share) {
      try {
        const userRef = db.collection("users").doc(session.uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          const scans: ScanEntry[] = userData.scans || [];
          const photoStats = await getPhotoStats(db, session.uid);
          const badges = checkBadges(scans, photoStats);
          await userRef.update({ badges });
        }
      } catch {
        // Non-critical
      }
    }

    return Response.json({ success: true, shared: share });
  } catch (e) {
    console.error("Community photo share failed:", e);
    return Response.json({ error: "Failed to update sharing" }, { status: 500 });
  }
}

function extractStoragePath(downloadUrl: string): string | null {
  try {
    const match = downloadUrl.match(/\/o\/(.+?)\?/);
    if (match) return decodeURIComponent(match[1]);
    return null;
  } catch {
    return null;
  }
}

const SEASON_MONTHS: Record<string, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

function getSeasonFromMonth(month: number): string {
  for (const [season, months] of Object.entries(SEASON_MONTHS)) {
    if (months.includes(month)) return season;
  }
  return "unknown";
}

async function getPhotoStats(db: FirebaseFirestore.Firestore, userId: string): Promise<PhotoStats> {
  try {
    const snapshot = await db
      .collection("communityPhotos")
      .where("userId", "==", userId)
      .where("moderationStatus", "==", "published")
      .get();

    const markers = new Set<string>();
    const seasons = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      markers.add(data.markerId);
      seasons.add(getSeasonFromMonth(data.month));
    });

    return {
      totalPhotos: snapshot.size,
      uniqueMarkers: markers.size,
      uniqueSeasons: seasons.size,
    };
  } catch {
    return { totalPhotos: 0, uniqueMarkers: 0, uniqueSeasons: 0 };
  }
}
