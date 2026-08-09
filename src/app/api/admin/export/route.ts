import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Collections included in the downloadable backup. scanCounts and user data
// are deliberately excluded — this is a content backup, not a database dump.
const CONTENT_COLLECTIONS = [
  "markers",
  "stories",
  "pois",
  "businesses",
  "routes",
  "accessibleSections",
  "blogPosts",
  "siteSettings",
  "siteContent",
  "gameConfig",
] as const;

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreAvailable()) {
    return NextResponse.json(
      { error: "Content database is unavailable — please try again in a moment." },
      { status: 503 }
    );
  }

  try {
    const db = getDb();
    const backup: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
    };

    for (const name of CONTENT_COLLECTIONS) {
      const snapshot = await db.collection(name).get();
      backup[name] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    // Admin list: emails only, so the backup stays shareable
    const admins = await db.collection("allowedAdmins").get();
    backup.allowedAdmins = admins.docs.map((doc) => doc.id);

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="trailtap-backup-${date}.json"`,
      },
    });
  } catch (e) {
    console.error("Export failed:", e);
    return NextResponse.json(
      { error: "Export failed — please try again." },
      { status: 500 }
    );
  }
}
