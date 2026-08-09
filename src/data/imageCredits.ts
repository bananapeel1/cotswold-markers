// Wikimedia Commons attribution for marker hero images — a legal requirement
// of the CC licences those photos carry. Server-only (reads from disk); pass
// the credit into client components as a prop.

import { readFile } from "fs/promises";
import path from "path";

export interface ImageCredit {
  shortCode: string;
  filename: string;
  photographer: string;
  license: string;
  source: string;
  wikimediaTitle: string;
  description: string;
}

let cache: Map<string, ImageCredit> | null = null;

async function loadCredits(): Promise<Map<string, ImageCredit>> {
  if (cache) return cache;
  try {
    const filePath = path.join(process.cwd(), "public/data/image-credits.json");
    const records = JSON.parse(await readFile(filePath, "utf-8")) as ImageCredit[];
    const map = new Map(records.map((r) => [r.shortCode.toUpperCase(), r]));
    cache = map;
    return map;
  } catch (e) {
    // Don't cache a failed read — a transient error shouldn't hide credits
    // for the lifetime of the process.
    console.warn("Failed to read image credits:", e);
    return new Map();
  }
}

/** Attribution record for a marker's image, or null when none exists. */
export async function getImageCredit(
  shortCode: string
): Promise<ImageCredit | null> {
  if (!shortCode) return null;
  const credits = await loadCredits();
  return credits.get(shortCode.toUpperCase()) ?? null;
}
