import { readFile } from "fs/promises";
import path from "path";
import type { Business } from "./types";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export type { Business } from "./types";
export { getBusinessTypeEmoji } from "./types";

let cachedBusinesses: Business[] | null = null;

async function getBusinessesFromFirestore(): Promise<Business[]> {
  const db = getDb();
  const snapshot = await db.collection("businesses").get();
  return snapshot.docs.map((doc) => doc.data() as Business);
}

async function getBusinessesFromFile(): Promise<Business[]> {
  const filePath = path.join(process.cwd(), "public/data/businesses.json");
  const data = await readFile(filePath, "utf-8");
  return JSON.parse(data) as Business[];
}

export async function getBusinesses(): Promise<Business[]> {
  if (cachedBusinesses) return cachedBusinesses;

  if (isFirestoreAvailable()) {
    try {
      cachedBusinesses = await getBusinessesFromFirestore();
      return cachedBusinesses;
    } catch (e) {
      console.warn("Firestore read failed for businesses, falling back to JSON:", e);
    }
  }

  cachedBusinesses = await getBusinessesFromFile();
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
