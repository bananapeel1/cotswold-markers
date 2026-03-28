import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import { getStorage } from "firebase-admin/storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { photoId, action } = body;

    if (!photoId || !action) {
      return Response.json({ error: "photoId and action required" }, { status: 400 });
    }

    const validActions = ["approve", "reject", "remove"];
    if (!validActions.includes(action)) {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = getDb();
    const photoRef = db.collection("communityPhotos").doc(photoId);
    const photoDoc = await photoRef.get();

    if (!photoDoc.exists) {
      return Response.json({ error: "Photo not found" }, { status: 404 });
    }

    if (action === "approve") {
      await photoRef.update({
        moderationStatus: "published",
        moderationReason: null,
      });
    } else {
      // reject or remove
      await photoRef.update({
        moderationStatus: "rejected",
        moderationReason: `Admin ${action}`,
      });

      // If removing, also delete from Storage
      if (action === "remove") {
        const data = photoDoc.data()!;
        if (data.storagePath) {
          try {
            const bucket = getStorage().bucket();
            await bucket.file(data.storagePath).delete();
          } catch {
            // File may already be deleted
          }
        }
      }
    }

    return Response.json({ success: true, action });
  } catch (e) {
    console.error("Photo moderation failed:", e);
    return Response.json({ error: "Failed to moderate" }, { status: 500 });
  }
}
