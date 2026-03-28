import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export const dynamic = "force-dynamic";

/**
 * AI moderation check using Google Cloud Vision SafeSearch.
 * Called internally (non-blocking) after a community photo is published.
 * Falls back to no-op if Vision API key is not configured.
 */
export async function POST(request: NextRequest) {
  if (!isFirestoreAvailable()) {
    return Response.json({ skipped: true });
  }

  try {
    const body = await request.json();
    const { photoId, photoUrl } = body;

    if (!photoId || !photoUrl) {
      return Response.json({ error: "photoId and photoUrl required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      // Vision API not configured — skip moderation
      return Response.json({ skipped: true, reason: "No API key configured" });
    }

    // Call Google Cloud Vision SafeSearch
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: photoUrl } },
              features: [{ type: "SAFE_SEARCH_DETECTION" }],
            },
          ],
        }),
      }
    );

    if (!visionRes.ok) {
      console.error("Vision API error:", await visionRes.text());
      return Response.json({ skipped: true, reason: "Vision API call failed" });
    }

    const visionData = await visionRes.json();
    const safeSearch = visionData.responses?.[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      return Response.json({ skipped: true, reason: "No SafeSearch result" });
    }

    const flagLevels = ["LIKELY", "VERY_LIKELY"];
    const flaggedCategories: string[] = [];

    if (flagLevels.includes(safeSearch.adult)) flaggedCategories.push("adult");
    if (flagLevels.includes(safeSearch.violence)) flaggedCategories.push("violence");
    if (flagLevels.includes(safeSearch.racy)) flaggedCategories.push("racy");

    if (flaggedCategories.length > 0) {
      const db = getDb();
      await db.collection("communityPhotos").doc(photoId).update({
        moderationStatus: "flagged",
        moderationReason: `SafeSearch: ${flaggedCategories.join(", ")}`,
      });

      return Response.json({ flagged: true, categories: flaggedCategories });
    }

    return Response.json({ flagged: false });
  } catch (e) {
    console.error("Photo moderation check failed:", e);
    return Response.json({ skipped: true, reason: "Check failed" });
  }
}
