import { readFile } from "fs/promises";
import path from "path";
import type { Business } from "./types";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export type { Business } from "./types";
export { getBusinessTypeEmoji } from "./types";

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
  if (isFirestoreAvailable()) {
    try {
      return await getBusinessesFromFirestore();
    } catch (e) {
      console.warn("Firestore read failed for businesses, falling back to JSON:", e);
    }
  }

  return await getBusinessesFromFile();
}

export async function getBusinessById(id: string): Promise<Business | undefined> {
  const businesses = await getBusinesses();
  return businesses.find((b) => b.id === id);
}

export async function getBusinessesForMarker(markerId: string): Promise<Business[]> {
  const businesses = await getBusinesses();
  return businesses.filter((b) => b.markerIds.includes(markerId));
}
