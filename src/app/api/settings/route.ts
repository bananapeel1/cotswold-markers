import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export interface SiteSettings {
  appName: string;
  tagline: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImageUrl: string;
  trailName: string;
  trailLength: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
  rewardsLive?: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  appName: "TrailTap",
  tagline: "Tap the trail. Discover what's next.",
  heroSubtitle: "The Modern Pathfinder",
  heroDescription:
    "TrailTap connects you to local stories, hidden gems, and trail companions — one scan at a time.",
  heroImageUrl:
    "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200",
  trailName: "Cotswold Way",
  trailLength: "102",
  socialLinks: {},
  rewardsLive: false,
};

export async function GET() {
  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const doc = await db.collection("siteSettings").doc("global").get();
      if (doc.exists) {
        return NextResponse.json({ ...DEFAULT_SETTINGS, ...doc.data() });
      }
    } catch (e) {
      console.warn("Firestore read failed for settings:", e);
    }
  }

  return NextResponse.json(DEFAULT_SETTINGS);
}

export async function PUT(request: NextRequest) {
  if (!(await verifySession(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const settings: Partial<SiteSettings> = body.settings ?? body;

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const docRef = db.collection("siteSettings").doc("global");
      const existing = await docRef.get();
      const merged = {
        ...DEFAULT_SETTINGS,
        ...(existing.exists ? existing.data() : {}),
        ...settings,
      };
      await docRef.set(merged);
      return NextResponse.json({ success: true, settings: merged });
    } catch (e) {
      console.warn("Firestore write failed for settings:", e);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Firestore not available" },
    { status: 500 }
  );
}
