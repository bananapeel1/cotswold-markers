import { readFile } from "fs/promises";
import path from "path";
import type { Story } from "./types";

export type { Story } from "./types";
export { getCategoryEmoji } from "./types";

let cachedStories: Story[] | null = null;

export async function getStories(): Promise<Story[]> {
  if (cachedStories) return cachedStories;
  const filePath = path.join(process.cwd(), "public/data/stories.json");
  const data = await readFile(filePath, "utf-8");
  cachedStories = JSON.parse(data) as Story[];
  return cachedStories;
}

export async function getStoryById(id: string): Promise<Story | undefined> {
  const stories = await getStories();
  return stories.find((s) => s.id === id);
}

export async function getStoriesForMarker(markerId: string): Promise<Story[]> {
  const stories = await getStories();
  return stories.filter((s) => s.markerIds.includes(markerId));
}
