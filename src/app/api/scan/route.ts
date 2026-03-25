import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable, getAdminAuth } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { checkBadges, calculateStreak, type ScanEntry } from "@/lib/badges";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markerId, source = "direct", weather, idToken } = body;

    if (!markerId) {
      return Response.json({ error: "markerId required" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const newBadges: string[] = [];

    // Always increment global scan count
    if (isFirestoreAvailable()) {
      const db = getDb();

      try {
        await db
          .collection("scanCounts")
          .doc("counts")
          .set({ [markerId]: FieldValue.increment(1) }, { merge: true });
      } catch (e) {
        console.warn("Global scan count update failed:", e);
      }

      // User-specific tracking
      if (idToken) {
        try {
          const decoded = await getAdminAuth().verifyIdToken(idToken);
          const userId = decoded.uid;
          const userRef = db.collection("users").doc(userId);
          const userDoc = await userRef.get();

          const scanEntry: ScanEntry = {
            markerId,
            timestamp,
            weather: weather || undefined,
            source,
          };

          if (userDoc.exists) {
            const data = userDoc.data()!;
            const existingScans: ScanEntry[] = data.scans || [];

            // Only add if this marker hasn't been scanned by this user
            const alreadyScanned = existingScans.some(
              (s) => s.markerId === markerId
            );

            if (!alreadyScanned) {
              const updatedScans = [...existingScans, scanEntry];
              const badges = checkBadges(updatedScans);
              const streak = calculateStreak(updatedScans);

              // Find newly earned badges
              const prevBadges: string[] = data.badges || [];
              for (const b of badges) {
                if (!prevBadges.includes(b)) newBadges.push(b);
              }

              await userRef.update({
                scans: updatedScans,
                badges,
                streak,
              });
            }
          } else {
            // First scan — create user document
            const scans = [scanEntry];
            const badges = checkBadges(scans);
            const streak = calculateStreak(scans);
            newBadges.push(...badges);

            await userRef.set({
              email: decoded.email || "",
              displayName: decoded.name || "",
              scans,
              badges,
              streak,
              createdAt: timestamp,
            });
          }
        } catch (e) {
          console.warn("User scan tracking failed:", e);
        }
      }
    }

    return Response.json({ success: true, newBadges });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  if (!isFirestoreAvailable()) {
    return Response.json({ scans: [], total: 0 });
  }

  try {
    const db = getDb();
    const doc = await db.collection("scanCounts").doc("counts").get();
    const counts = doc.exists ? doc.data() : {};
    return Response.json({ counts, total: Object.values(counts || {}).reduce((a: number, b) => a + (b as number), 0) });
  } catch {
    return Response.json({ scans: [], total: 0 });
  }
}
