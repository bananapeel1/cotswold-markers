import { getDb } from "./firebase";

const DEFAULT_COMPLETION_THRESHOLD = 50;

let cached: { value: number; at: number } | null = null;
const TTL_MS = 60_000;

/**
 * How many unique markers count as "completing the trail". Owner-tunable via
 * siteSettings.completionThreshold (defaults to all 50 markers). Used by both
 * the admin analytics and the public community stats so the two can't drift.
 */
export async function getCompletionThreshold(): Promise<number> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  let value = DEFAULT_COMPLETION_THRESHOLD;
  try {
    const doc = await getDb().collection("siteSettings").doc("global").get();
    const raw = doc.exists ? Number(doc.data()?.completionThreshold) : NaN;
    if (Number.isFinite(raw) && raw > 0) value = Math.floor(raw);
  } catch {
    // fall through to default
  }
  cached = { value, at: Date.now() };
  return value;
}
