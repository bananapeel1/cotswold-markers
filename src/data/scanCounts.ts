import { readFile } from "fs/promises";
import path from "path";
import type { ScanCounts } from "./types";

let cached: ScanCounts | null = null;

export async function getScanCounts(): Promise<ScanCounts> {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "public/data/scan-counts.json");
  const data = await readFile(filePath, "utf-8");
  cached = JSON.parse(data) as ScanCounts;
  return cached;
}

export async function getScanCountForMarker(markerId: string): Promise<number> {
  const counts = await getScanCounts();
  return counts[markerId] || 0;
}
