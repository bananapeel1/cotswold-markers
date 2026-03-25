import { readFile } from "fs/promises";
import path from "path";
import type { POI } from "./types";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export type { POI } from "./types";

let cachedPOIs: POI[] | null = null;

async function getPOIsFromFirestore(): Promise<POI[]> {
  const db = getDb();
  const snapshot = await db.collection("pois").get();
  return snapshot.docs.map((doc) => doc.data() as POI);
}

async function getPOIsFromFile(): Promise<POI[]> {
  const filePath = path.join(process.cwd(), "public/data/pois.json");
  const data = await readFile(filePath, "utf-8");
  return JSON.parse(data) as POI[];
}

export async function getPOIs(): Promise<POI[]> {
  if (cachedPOIs) return cachedPOIs;

  if (isFirestoreAvailable()) {
    try {
      cachedPOIs = await getPOIsFromFirestore();
      return cachedPOIs;
    } catch (e) {
      console.warn("Firestore read failed for POIs, falling back to JSON:", e);
    }
  }

  cachedPOIs = await getPOIsFromFile();
  return cachedPOIs;
}

export async function getPOIsForMarker(markerId: string): Promise<POI[]> {
  const pois = await getPOIs();
  return pois.filter((p) => p.nearestMarkerIds.includes(markerId));
}
