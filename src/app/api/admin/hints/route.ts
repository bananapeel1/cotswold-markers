import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const snapshot = await getDb().collection("markerHints").limit(500).get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hints = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .sort((a: { timestamp?: string }, b: { timestamp?: string }) =>
        (b.timestamp || "").localeCompare(a.timestamp || "")
      );

    return NextResponse.json({ hints });
  } catch (e) {
    console.error("Admin hints GET failed:", e);
    return dbUnavailable();
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Hint ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const docRef = getDb().collection("markerHints").doc(id);
    if (!(await docRef.get()).exists) {
      return NextResponse.json({ error: "Hint not found" }, { status: 404 });
    }
    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Admin hints DELETE failed:", e);
    return dbUnavailable();
  }
}
