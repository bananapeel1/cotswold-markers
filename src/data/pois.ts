import { readFile } from "fs/promises";
import path from "path";
import type { POI } from "./types";

export type { POI } from "./types";

let cachedPOIs: POI[] | null = null;

export async function getPOIs(): Promise<POI[]> {
  if (cachedPOIs) return cachedPOIs;
  const filePath = path.join(process.cwd(), "public/data/pois.json");
  const data = await readFile(filePath, "utf-8");
  cachedPOIs = JSON.parse(data) as POI[];
  return cachedPOIs;
}

export async function getPOIsForMarker(markerId: string): Promise<POI[]> {
  const pois = await getPOIs();
  return pois.filter((p) => p.nearestMarkerIds.includes(markerId));
}
