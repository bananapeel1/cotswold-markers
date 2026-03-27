import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable, getAdminAuth, verifyAppCheckToken } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { checkBadges, calculateStreak, type ScanEntry } from "@/lib/badges";
import { calculateScanXP, calculateSegmentTimes } from "@/lib/xp";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiter (per IP, 10 scans per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// Periodic cleanup of rate limit map to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return Response.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Verify App Check token
    const appCheckToken = request.headers.get("X-Firebase-AppCheck");
    const isValidAppCheck = await verifyAppCheckToken(appCheckToken);
    if (!isValidAppCheck) {
      return Response.json(
        { error: "App Check verification failed" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { markerId, source = "direct", weather, idToken } = body;

    if (!markerId || typeof markerId !== "string") {
      return Response.json({ error: "markerId required" }, { status: 400 });
    }

    // Validate markerId format (prevent injection)
    if (!/^[a-z0-9-]+$/.test(markerId)) {
      return Response.json({ error: "Invalid markerId format" }, { status: 400 });
    }

    // Validate source
    const validSources = ["direct", "qr", "nfc"];
    const sanitizedSource = validSources.includes(source) ? source : "direct";

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
            source: sanitizedSource,
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

              // Calculate XP for this scan
              const dateKey = timestamp.slice(0, 10);
              const scansToday = updatedScans.filter(
                (s) => s.timestamp.slice(0, 10) === dateKey
              ).length;
              const xpBreakdown = calculateScanXP(
                scanEntry,
                streak.current,
                false, // segment complete checked below
                scansToday >= 3
              );

              // Calculate segment times (load markers for this)
              let segmentTimes = data.segmentTimes || [];
              try {
                const markersModule = await import("@/data/markers");
                const allMarkers = await markersModule.getMarkers();
                const markerInfos = allMarkers.map((m) => ({
                  id: m.id,
                  trailMile: m.trailMile,
                  elevation_m: m.elevation_m,
                }));
                segmentTimes = calculateSegmentTimes(updatedScans, markerInfos);
              } catch { /* markers not available, skip segment times */ }

              // Calculate total XP from all scans
              const prevXP: number = data.xp || 0;
              const newXP = prevXP + xpBreakdown.total;

              // Sync display name from Firebase Auth if not yet set
              const updateData: Record<string, unknown> = {
                scans: updatedScans,
                badges,
                streak,
                xp: newXP,
                segmentTimes,
                lastXPBreakdown: xpBreakdown,
              };
              if (!data.displayName && decoded.name) {
                updateData.displayName = decoded.name;
              }

              await userRef.update(updateData);
            }
          } else {
            // First scan — create user document
            const scans = [scanEntry];
            const badges = checkBadges(scans);
            const streak = calculateStreak(scans);
            newBadges.push(...badges);

            // Calculate XP for first scan
            const xpBreakdown = calculateScanXP(scanEntry, 0, false, false);

            await userRef.set({
              email: decoded.email || "",
              displayName: decoded.name || "",
              scans,
              badges,
              streak,
              xp: xpBreakdown.total,
              segmentTimes: [],
              lastXPBreakdown: xpBreakdown,
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
