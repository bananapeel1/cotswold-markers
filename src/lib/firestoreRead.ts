import { unstable_cache, revalidateTag } from "next/cache";

/**
 * Resilient Firestore reads for public pages.
 *
 * Without this, a Firestore outage or quota problem makes every request wait
 * for the gRPC client's slow retries (8-20s) before the data layer falls back
 * to the bundled JSON. Here a read is:
 *   - cached for CACHE_SECONDS (shared across instances, invalidated by tag
 *     after admin writes), so a healthy site does ~1 read per collection/min;
 *   - given a hard timeout;
 *   - guarded by a circuit breaker: after a timeout or a quota error, Firestore
 *     is skipped for BREAKER_MS and callers get the fallback immediately.
 * Failures are never cached — only successful Firestore results are.
 */

const TIMEOUT_MS = 2000;
const BREAKER_MS = 60_000;
const CACHE_SECONDS = 60;

class FirestoreTimeoutError extends Error {
  constructor() {
    super(`Firestore read timed out after ${TIMEOUT_MS}ms`);
    this.name = "FirestoreTimeoutError";
  }
}

let breakerOpenUntil = 0;

function isOutage(e: unknown): boolean {
  if (e instanceof FirestoreTimeoutError) return true;
  const err = e as { code?: unknown; message?: unknown } | null;
  // gRPC 8 = RESOURCE_EXHAUSTED (quota), 14 = UNAVAILABLE, 4 = DEADLINE_EXCEEDED
  if (err && (err.code === 8 || err.code === 14 || err.code === 4)) return true;
  return /RESOURCE_EXHAUSTED|Quota exceeded|UNAVAILABLE/i.test(
    String(err?.message ?? "")
  );
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new FirestoreTimeoutError()), TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function noteFailure(label: string, e: unknown) {
  if (isOutage(e)) breakerOpenUntil = Date.now() + BREAKER_MS;
  console.warn(`Firestore read failed for ${label}, using fallback:`, e);
}

/** Test hook: reset the circuit breaker. */
export function resetFirestoreBreaker() {
  breakerOpenUntil = 0;
}

/**
 * Cached read. `tag` is the cache tag (use the collection name) and `key`
 * distinguishes different reads under one tag (e.g. a doc id).
 */
export async function readWithFallback<T>(
  tag: string,
  key: string,
  firestoreFn: () => Promise<T>,
  fallbackFn: () => Promise<T> | T
): Promise<T> {
  if (Date.now() < breakerOpenUntil) return fallbackFn();

  try {
    const cached = unstable_cache(
      () => withTimeout(firestoreFn()),
      ["firestore", tag, key],
      { revalidate: CACHE_SECONDS, tags: [tag] }
    );
    return await cached();
  } catch (e) {
    noteFailure(`${tag}/${key}`, e);
    return fallbackFn();
  }
}

/**
 * Uncached read for live data (leaderboard, live walkers, ...): same timeout
 * and circuit breaker, but results are always fresh. Throws `FirestoreSkipped`
 * while the breaker is open so existing catch blocks degrade immediately.
 */
export class FirestoreSkipped extends Error {
  constructor() {
    super("Firestore skipped (circuit breaker open)");
    this.name = "FirestoreSkipped";
  }
}

export async function guardedRead<T>(
  label: string,
  firestoreFn: () => Promise<T>
): Promise<T> {
  if (Date.now() < breakerOpenUntil) throw new FirestoreSkipped();
  try {
    return await withTimeout(firestoreFn());
  } catch (e) {
    if (isOutage(e)) breakerOpenUntil = Date.now() + BREAKER_MS;
    console.warn(`Firestore read failed for ${label}:`, e);
    throw e;
  }
}

/**
 * Expire cached reads for a tag. Call after admin writes so edits show up
 * immediately instead of after the cache window.
 */
export function invalidateContent(...tags: string[]) {
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch (e) {
      // Outside a Next request context (scripts, tests) there is nothing to expire.
      console.warn(`Cache invalidation skipped for ${tag}:`, e);
    }
  }
}
