import { readFile } from "fs/promises";
import path from "path";
import type { Story } from "./types";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export type { Story } from "./types";
export { getCategoryEmoji } from "./types";

async function getStoriesFromFirestore(): Promise<Story[]> {
  const db = getDb();
  const snapshot = await db.collection("stories").get();
  return snapshot.docs.map((doc) => doc.data() as Story);
}

async function getStoriesFromFile(): Promise<Story[]> {
  const filePath = path.join(process.cwd(), "public/data/stories.json");
  const data = await readFile(filePath, "utf-8");
  return JSON.parse(data) as Story[];
}

export async function getStories(): Promise<Story[]> {
  if (isFirestoreAvailable()) {
    try {
      return await getStoriesFromFirestore();
    } catch (e) {
      console.warn("Firestore read failed for stories, falling back to JSON:", e);
    }
  }

  return await getStoriesFromFile();
}

export async function getStoryById(id: string): Promise<Story | undefined> {
  const stories = await getStories();
  return stories.find((s) => s.id === id);
}

export async function getStoriesForMarker(markerId: string): Promise<Story[]> {
  const stories = await getStories();
  return stories.filter((s) => s.markerIds.includes(markerId));
}
