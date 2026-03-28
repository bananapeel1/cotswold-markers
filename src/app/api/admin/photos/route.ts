import { NextRequest } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!isFirestoreAvailable()) {
    return Response.json({ photos: [] });
  }

  try {
    const db = getDb();
    const snapshot = await db
      .collection("communityPhotos")
      .orderBy("timestamp", "desc")
      .limit(200)
      .get();

    const photos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return Response.json({ photos });
  } catch (e) {
    console.error("Admin photos GET failed:", e);
    // Fallback without orderBy
    try {
      const db = getDb();
      const snapshot = await db.collection("communityPhotos").limit(200).get();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const photos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
      photos.sort((a: { timestamp: string }, b: { timestamp: string }) =>
        (b.timestamp || "").localeCompare(a.timestamp || "")
      );
      return Response.json({ photos });
    } catch {
      return Response.json({ photos: [] });
    }
  }
}
