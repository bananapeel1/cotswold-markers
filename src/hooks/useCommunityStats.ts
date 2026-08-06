"use client";

import { useEffect, useState } from "react";

export interface CommunityStats {
  totalScans: number;
  totalWalkers: number;
  activeNow: number;
  completionsThisMonth: number;
}

const POLL_MS = 60_000;

// Single shared fetch + subscriber list so every component on the page renders
// the same numbers from the same response (no two figures disagreeing).
let current: CommunityStats | null = null;
let inFlight: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<(s: CommunityStats) => void>();

function refresh() {
  if (inFlight) return inFlight;
  inFlight = fetch("/api/community")
    .then((r) => r.json())
    .then((data: CommunityStats) => {
      current = data;
      subscribers.forEach((fn) => fn(data));
    })
    .catch(() => {})
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function useCommunityStats(): CommunityStats | null {
  const [stats, setStats] = useState<CommunityStats | null>(current);

  useEffect(() => {
    subscribers.add(setStats);
    if (current) setStats(current);
    refresh();
    if (!timer) timer = setInterval(refresh, POLL_MS);

    return () => {
      subscribers.delete(setStats);
      if (subscribers.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return stats;
}
