/**
 * Server-only loader for the admin-editable gamification config.
 *
 * Firestore collection `gameConfig` holds two docs:
 *   - `badges`: { badges: [{id, name, description, icon, category}],
 *                 milestoneThresholds: { "getting-started": 5, ... },
 *                 completionistDays: 14 }
 *   - `xp`:     { values: {...XP_VALUES}, ranks: [...RANKS] }
 *
 * Stored values are merged over the in-code defaults per field, so a partial
 * or malformed doc can never break badge/XP awarding — anything missing or
 * invalid silently falls back to the defaults in badges.ts / xp.ts.
 *
 * Do NOT import this from client components (it pulls in firebase-admin).
 * Clients get the merged config from GET /api/game-config via useGameConfig.
 */

import {
  BADGES,
  DEFAULT_MILESTONE_THRESHOLDS,
  DEFAULT_COMPLETIONIST_DAYS,
  type Badge,
} from "./badges";
import { XP_VALUES, RANKS, type Rank, type XPValues } from "./xp";
import { getDb, isFirestoreAvailable } from "./firebase";

export interface GameConfig {
  badges: Badge[];
  milestoneThresholds: Record<string, number>;
  completionistDays: number;
  xpValues: XPValues;
  ranks: Rank[];
}

export function defaultGameConfig(): GameConfig {
  return {
    badges: BADGES.map((b) => ({ ...b })),
    milestoneThresholds: { ...DEFAULT_MILESTONE_THRESHOLDS },
    completionistDays: DEFAULT_COMPLETIONIST_DAYS,
    xpValues: { ...XP_VALUES },
    ranks: RANKS.map((r) => ({ ...r })),
  };
}

// In-memory cache — loadGameConfig runs on every scan, so we avoid two
// Firestore reads per scan. 60s TTL keeps admin edits near-live.
const CACHE_TTL_MS = 60_000;
let cached: { config: GameConfig; expiresAt: number } | null = null;

/** Drop the cache (called by PUT /api/game-config after a save). */
export function clearGameConfigCache() {
  cached = null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0;
}

/** Overlay stored badge copy (name/description/icon) onto the defaults.
 *  Category and the badge id set are fixed — the detection logic is in code. */
function mergeBadges(stored: unknown): Badge[] {
  const byId = new Map<string, Record<string, unknown>>();
  if (Array.isArray(stored)) {
    for (const entry of stored) {
      if (entry && typeof entry === "object" && isNonEmptyString((entry as Record<string, unknown>).id)) {
        byId.set((entry as Record<string, unknown>).id as string, entry as Record<string, unknown>);
      }
    }
  }
  return BADGES.map((def) => {
    const s = byId.get(def.id);
    if (!s) return { ...def };
    return {
      ...def,
      name: isNonEmptyString(s.name) ? s.name : def.name,
      description: isNonEmptyString(s.description) ? s.description : def.description,
      icon: isNonEmptyString(s.icon) ? s.icon : def.icon,
    };
  });
}

function mergeThresholds(stored: unknown): Record<string, number> {
  const merged = { ...DEFAULT_MILESTONE_THRESHOLDS };
  if (stored && typeof stored === "object") {
    for (const key of Object.keys(DEFAULT_MILESTONE_THRESHOLDS)) {
      const v = (stored as Record<string, unknown>)[key];
      if (isPositiveInt(v)) merged[key] = v;
    }
  }
  return merged;
}

function mergeXPValues(stored: unknown): XPValues {
  // Spread into a mutable record — XP_VALUES is `as const` (readonly keys)
  const merged: Record<string, number> = { ...XP_VALUES };
  if (stored && typeof stored === "object") {
    for (const key of Object.keys(XP_VALUES)) {
      const v = (stored as Record<string, unknown>)[key];
      if (isPositiveInt(v)) merged[key] = v;
    }
  }
  return merged as XPValues;
}

function mergeRanks(stored: unknown): Rank[] {
  const merged = RANKS.map((def, i) => {
    const s =
      Array.isArray(stored) && stored.length === RANKS.length
        ? (stored[i] as Record<string, unknown> | undefined)
        : undefined;
    if (!s || typeof s !== "object") return { ...def };
    return {
      ...def,
      title: isNonEmptyString(s.title) ? s.title : def.title,
      icon: isNonEmptyString(s.icon) ? s.icon : def.icon,
      colour: isNonEmptyString(s.colour) ? s.colour : def.colour,
      minXP:
        typeof s.minXP === "number" && Number.isInteger(s.minXP) && s.minXP >= 0
          ? s.minXP
          : def.minXP,
    };
  });
  // Rank lookup assumes ascending minXP — if a stored doc ever breaks the
  // ordering, keep the custom titles but restore the default thresholds.
  for (let i = 1; i < merged.length; i++) {
    if (merged[i].minXP <= merged[i - 1].minXP) {
      merged.forEach((r, j) => (r.minXP = RANKS[j].minXP));
      break;
    }
  }
  return merged;
}

/**
 * The merged gamification config: Firestore overrides over in-code defaults,
 * per field. Never throws — any failure returns the defaults.
 */
export async function loadGameConfig(): Promise<GameConfig> {
  const now = Date.now();
  if (cached && now < cached.expiresAt) return cached.config;

  const config = defaultGameConfig();

  if (isFirestoreAvailable()) {
    try {
      const db = getDb();
      const col = db.collection("gameConfig");
      const [badgesDoc, xpDoc] = await db.getAll(col.doc("badges"), col.doc("xp"));

      if (badgesDoc.exists) {
        const data = badgesDoc.data() ?? {};
        config.badges = mergeBadges(data.badges);
        config.milestoneThresholds = mergeThresholds(data.milestoneThresholds);
        if (isPositiveInt(data.completionistDays)) {
          config.completionistDays = data.completionistDays;
        }
      }

      if (xpDoc.exists) {
        const data = xpDoc.data() ?? {};
        config.xpValues = mergeXPValues(data.values);
        config.ranks = mergeRanks(data.ranks);
      }
    } catch (e) {
      console.warn("Game config load failed, using in-code defaults:", e);
    }
  }

  cached = { config, expiresAt: now + CACHE_TTL_MS };
  return config;
}
