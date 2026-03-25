import { readFile } from "fs/promises";
import path from "path";
import type { ScanCounts } from "./types";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

let cached: ScanCounts | null = null;

async function getScanCountsFromFirestore(): Promise<ScanCounts> {
  const db = getDb();
  const doc = await db.collection("scanCounts").doc("counts").get();
  if (!doc.exists) return {};
  return doc.data() as ScanCounts;
}

async function getScanCountsFromFile(): Promise<ScanCounts> {
  const filePath = path.join(process.cwd(), "public/data/scan-counts.json");
  const data = await readFile(filePath, "utf-8");
  return JSON.parse(data) as ScanCounts;
}

export async function getScanCounts(): Promise<ScanCounts> {
  if (cached) return cached;

  if (isFirestoreAvailable()) {
    try {
      cached = await getScanCountsFromFirestore();
      return cached;
    } catch (e) {
      console.warn("Firestore read failed for scan counts, falling back to JSON:", e);
    }
  }

  cached = await getScanCountsFromFile();
  return cached;
}

/** Clear the in-memory cache (call after writes) */
export function invalidateScanCountsCache() {
  cached = null;
}

export async function getScanCountForMarker(markerId: string): Promise<number> {
  const counts = await getScanCounts();
  return counts[markerId] || 0;
}
