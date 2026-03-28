import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { getBlogPosts } = await import("@/data/blog");
  const posts = await getBlogPosts();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { post } = await request.json();
  if (!post?.title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const slug = post.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");

  const id = `blog-${slug}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const newPost = {
    id,
    title: post.title,
    slug: post.slug || slug,
    excerpt: post.excerpt || "",
    body: post.body || "",
    coverImage: post.coverImage || null,
    category: post.category || "news",
    author: post.author || "TrailTap",
    publishedAt: now,
    updatedAt: now,
    isPublished: post.isPublished ?? true,
  };

  if (!isFirestoreAvailable()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    await getDb().collection("blogPosts").doc(id).set(newPost);
    return NextResponse.json({ success: true, post: newPost });
  } catch (e) {
    console.error("Blog POST failed:", e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { post } = await request.json();
  if (!post?.id) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const db = getDb();
    const docRef = db.collection("blogPosts").doc(post.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const updated = { ...doc.data(), ...post, updatedAt: new Date().toISOString() };
    await docRef.set(updated);
    return NextResponse.json({ success: true, post: updated });
  } catch (e) {
    console.error("Blog PUT failed:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const db = getDb();
    const docRef = db.collection("blogPosts").doc(id);
    if (!(await docRef.get()).exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Blog DELETE failed:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
