import { NextRequest, NextResponse } from "next/server";
import { invalidateContent } from "@/lib/firestoreRead";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import { storySchema, formatIssues } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

export async function GET() {
  const { getStories } = await import("@/data/stories");
  const stories = await getStories();
  return NextResponse.json(stories);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { story } = await request.json();
  if (!story?.title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const id = `story-${story.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}-${Date.now().toString(36)}`;
  const newStory = {
    id,
    title: story.title,
    summary: story.summary || "",
    body: story.body || "",
    category: story.category || "local",
    imageUrl: story.imageUrl || null,
    attribution: story.attribution || null,
    markerIds: story.markerIds || [],
    ...(story.audioUrl ? { audioUrl: story.audioUrl } : {}),
    ...(story.isHidden !== undefined ? { isHidden: story.isHidden } : {}),
    ...(story.trailSecret ? { trailSecret: story.trailSecret } : {}),
  };

  const parsed = storySchema.safeParse(newStory);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatIssues(parsed.error) },
      { status: 400 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    await getDb().collection("stories").doc(id).set(newStory);
    invalidateContent("stories");
    return NextResponse.json({ success: true, story: newStory });
  } catch (e) {
    console.error("Story create failed:", e);
    return dbUnavailable();
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { story } = await request.json();
  if (!story?.id) {
    return NextResponse.json({ error: "Story ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("stories").doc(story.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }
    const updated = { ...doc.data(), ...story };

    const parsed = storySchema.safeParse(updated);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: formatIssues(parsed.error) },
        { status: 400 }
      );
    }

    await docRef.set(updated);
    invalidateContent("stories");
    return NextResponse.json({ success: true, story: updated });
  } catch (e) {
    console.error("Story update failed:", e);
    return dbUnavailable();
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Story ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("stories").doc(id);
    if (!(await docRef.get()).exists) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }
    await docRef.delete();
    invalidateContent("stories");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Story delete failed:", e);
    return dbUnavailable();
  }
}
