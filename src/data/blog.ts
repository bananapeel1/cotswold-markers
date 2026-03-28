import type { BlogPost } from "./types";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export async function getBlogPosts(includeUnpublished = false): Promise<BlogPost[]> {
  if (!isFirestoreAvailable()) return [];

  try {
    const db = getDb();
    const snapshot = await db.collection("blogPosts").get();
    const posts = snapshot.docs.map((doc) => doc.data() as BlogPost);

    const filtered = includeUnpublished
      ? posts
      : posts.filter((p) => p.isPublished);

    return filtered.sort((a, b) =>
      (b.publishedAt || "").localeCompare(a.publishedAt || "")
    );
  } catch (e) {
    console.warn("Blog posts fetch failed:", e);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug);
}
