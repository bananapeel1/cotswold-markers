/**
 * Fixed-window, in-memory rate limiter keyed by client IP. Each server
 * instance keeps its own counts, so this blunts bursts rather than enforcing
 * a global cap; App Check does the heavier lifting against bots.
 */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    isLimited(key: string, now = Date.now()): boolean {
      // Prune expired entries now and then so the map can't grow unbounded
      if (hits.size > 1000) {
        for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
      }

      const entry = hits.get(key);
      if (!entry || now > entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return false;
      }

      entry.count++;
      return entry.count > max;
    },
  };
}

/** Best-effort client IP from Vercel's forwarding headers. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
