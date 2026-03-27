import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const JSON_PATH = path.join(process.cwd(), "public/data/stories.json");

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
  };

  if (isFirestoreAvailable()) {
    try {
      await getDb().collection("stories").doc(id).set(newStory);
      return NextResponse.json({ success: true, story: newStory });
    } catch (e) {
      console.warn("Firestore write failed, falling back to JSON:", e);
    }
  }

  const data = JSON.parse(await readFile(JSON_PATH, "utf-8"));
  data.push(newStory);
  await writeFile(JSON_PATH, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true, story: newStory });
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { story } = await request.json();
  if (!story?.id) {
    return NextResponse.json({ error: "Story ID required" }, { status: 400 });
  }

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const docRef = db.collection("stories").doc(story.id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }
      const updated = { ...doc.data(), ...story };
      await docRef.set(updated);
      return NextResponse.json({ success: true, story: updated });
    } catch (e) {
      console.warn("Firestore write failed, falling back to JSON:", e);
    }
  }

  const data = JSON.parse(await readFile(JSON_PATH, "utf-8"));
  const index = data.findIndex((s: { id: string }) => s.id === story.id);
  if (index === -1) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  data[index] = { ...data[index], ...story };
  await writeFile(JSON_PATH, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true, story: data[index] });
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Story ID required" }, { status: 400 });
  }

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const docRef = db.collection("stories").doc(id);
      if (!(await docRef.get()).exists) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }
      await docRef.delete();
      return NextResponse.json({ success: true });
    } catch (e) {
      console.warn("Firestore delete failed, falling back to JSON:", e);
    }
  }

  const data = JSON.parse(await readFile(JSON_PATH, "utf-8"));
  const filtered = data.filter((s: { id: string }) => s.id !== id);
  if (filtered.length === data.length) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  await writeFile(JSON_PATH, JSON.stringify(filtered, null, 2));
  return NextResponse.json({ success: true });
}
