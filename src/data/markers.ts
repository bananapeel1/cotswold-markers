import { readFile } from "fs/promises";
import path from "path";
import type { Marker } from "./types";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export type { Marker, FacilityType, EmergencyInfo } from "./types";
export { getFacilityEmoji, getFacilityLabel } from "./types";

let cachedMarkers: Marker[] | null = null;

async function getMarkersFromFirestore(): Promise<Marker[]> {
  const db = getDb();
  const snapshot = await db.collection("markers").get();
  return snapshot.docs.map((doc) => doc.data() as Marker);
}

async function getMarkersFromFile(): Promise<Marker[]> {
  const filePath = path.join(process.cwd(), "public/data/markers.json");
  const data = await readFile(filePath, "utf-8");
  return JSON.parse(data) as Marker[];
}

export async function getMarkers(): Promise<Marker[]> {
  if (cachedMarkers) return cachedMarkers;

  if (isFirestoreAvailable()) {
    try {
      cachedMarkers = await getMarkersFromFirestore();
      return cachedMarkers;
    } catch (e) {
      console.warn("Firestore read failed for markers, falling back to JSON:", e);
    }
  }

  cachedMarkers = await getMarkersFromFile();
  return cachedMarkers;
}

/** Clear the in-memory cache (call after writes) */
export function invalidateMarkersCache() {
  cachedMarkers = null;
}

export async function getMarkerById(
  idOrShortCode: string
): Promise<Marker | undefined> {
  const markers = await getMarkers();
  const normalized = idOrShortCode.toUpperCase();
  return markers.find(
    (m) =>
      m.id === idOrShortCode ||
      m.shortCode === normalized ||
      m.shortCode.toLowerCase() === idOrShortCode.toLowerCase()
  );
}

export async function getMarkerByShortCode(
  shortCode: string
): Promise<Marker | undefined> {
  const markers = await getMarkers();
  return markers.find(
    (m) => m.shortCode.toLowerCase() === shortCode.toLowerCase()
  );
}
