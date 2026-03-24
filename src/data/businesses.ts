import { readFile } from "fs/promises";
import path from "path";
import type { Business } from "./types";

export type { Business } from "./types";
export { getBusinessTypeEmoji } from "./types";

let cachedBusinesses: Business[] | null = null;

export async function getBusinesses(): Promise<Business[]> {
  if (cachedBusinesses) return cachedBusinesses;
  const filePath = path.join(process.cwd(), "public/data/businesses.json");
  const data = await readFile(filePath, "utf-8");
  cachedBusinesses = JSON.parse(data) as Business[];
  return cachedBusinesses;
}

export async function getBusinessById(id: string): Promise<Business | undefined> {
  const businesses = await getBusinesses();
  return businesses.find((b) => b.id === id);
}

export async function getBusinessesForMarker(markerId: string): Promise<Business[]> {
  const businesses = await getBusinesses();
  return businesses.filter((b) => b.markerIds.includes(markerId));
}
