"use client";

/**
 * Client hook for the admin-editable gamification config (badge copy/icons,
 * rank names, XP values). Fetches GET /api/game-config once per page load —
 * the promise is cached at module level so every component using the hook
 * shares a single request. In-code defaults render until the fetch resolves
 * (and stay if it fails), so nothing gamified ever renders blank.
 */

import { useCallback, useEffect, useState } from "react";
import {
  BADGES,
  DEFAULT_MILESTONE_THRESHOLDS,
  DEFAULT_COMPLETIONIST_DAYS,
  type Badge,
} from "@/lib/badges";
import { RANKS, XP_VALUES, type Rank, type XPValues } from "@/lib/xp";

interface ClientGameConfig {
  badges: Badge[];
  ranks: Rank[];
  xpValues: XPValues;
  milestoneThresholds: Record<string, number>;
  completionistDays: number;
}

function defaults(): ClientGameConfig {
  return {
    badges: BADGES,
    ranks: RANKS,
    xpValues: { ...XP_VALUES },
    milestoneThresholds: { ...DEFAULT_MILESTONE_THRESHOLDS },
    completionistDays: DEFAULT_COMPLETIONIST_DAYS,
  };
}

// Module-level promise cache — one fetch per page load.
let configPromise: Promise<ClientGameConfig> | null = null;

function fetchGameConfig(): Promise<ClientGameConfig> {
  if (!configPromise) {
    configPromise = fetch("/api/game-config")
      .then((res) => {
        if (!res.ok) throw new Error(`game-config ${res.status}`);
        return res.json();
      })
      .then((data) => ({
        badges: Array.isArray(data?.badges) && data.badges.length > 0 ? data.badges : BADGES,
        ranks: Array.isArray(data?.ranks) && data.ranks.length > 0 ? data.ranks : RANKS,
        xpValues:
          data?.xpValues && typeof data.xpValues === "object"
            ? { ...XP_VALUES, ...data.xpValues }
            : { ...XP_VALUES },
        milestoneThresholds:
          data?.milestoneThresholds && typeof data.milestoneThresholds === "object"
            ? { ...DEFAULT_MILESTONE_THRESHOLDS, ...data.milestoneThresholds }
            : { ...DEFAULT_MILESTONE_THRESHOLDS },
        completionistDays:
          Number.isFinite(data?.completionistDays) && data.completionistDays > 0
            ? data.completionistDays
            : DEFAULT_COMPLETIONIST_DAYS,
      }))
      .catch(() => {
        configPromise = null; // allow a retry on the next mount
        return defaults();
      });
  }
  return configPromise;
}

export function useGameConfig(): ClientGameConfig & {
  getBadgeById: (id: string) => Badge | undefined;
} {
  const [config, setConfig] = useState<ClientGameConfig>(defaults);

  useEffect(() => {
    let alive = true;
    fetchGameConfig().then((c) => {
      if (alive) setConfig(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  const getBadgeById = useCallback(
    (id: string) => config.badges.find((b) => b.id === id),
    [config.badges]
  );

  return { ...config, getBadgeById };
}
