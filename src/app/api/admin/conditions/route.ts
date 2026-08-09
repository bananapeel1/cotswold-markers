import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import { getStorage } from "firebase-admin/storage";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";
const BUCKET_NAME = "thecotswoldsway-2c218.firebasestorage.app";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const snapshot = await getDb().collection("trailConditions").limit(500).get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .sort((a: { timestamp?: string }, b: { timestamp?: string }) =>
        (b.timestamp || "").localeCompare(a.timestamp || "")
      );

    return NextResponse.json({ conditions });
  } catch (e) {
    console.error("Admin conditions GET failed:", e);
    return dbUnavailable();
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Condition ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("trailConditions").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Condition not found" }, { status: 404 });
    }

    const data = doc.data()!;

    // Remove the uploaded photo from Storage, if any
    if (data.photoStoragePath) {
      try {
        await getStorage()
          .bucket(BUCKET_NAME)
          .file(data.photoStoragePath)
          .delete({ ignoreNotFound: true });
      } catch {
        // File may already be deleted
      }
    }

    // Condition photos are mirrored into communityPhotos (source: "condition",
    // sourceId: <condition doc id>) — remove those docs too so the public
    // gallery doesn't reference a deleted Storage object.
    if (data.photoUrl) {
      try {
        const mirrored = await db
          .collection("communityPhotos")
          .where("sourceId", "==", id)
          .get();
        await Promise.all(mirrored.docs.map((photoDoc) => photoDoc.ref.delete()));
      } catch {
        // Non-critical — condition deletion still proceeds
      }
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Admin conditions DELETE failed:", e);
    return dbUnavailable();
  }
}
