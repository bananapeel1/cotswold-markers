import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

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
    const { photoId, photoUrl, userName, markerName, markerId, caption } = body;

    if (!photoId || !photoUrl || !userName || !markerId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date();
    const month = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

    await db.collection("siteSettings").doc("global").set(
      {
        featuredPhoto: {
          photoId,
          photoUrl,
          userName,
          markerName: markerName || markerId,
          markerId,
          month,
          caption: caption || `A beautiful capture from the Cotswold Way by ${userName}.`,
        },
      },
      { merge: true }
    );

    return Response.json({ success: true, month });
  } catch (e) {
    console.error("Featured photo update failed:", e);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}
