import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import { BADGES, type Badge } from "@/lib/badges";
import { XP_VALUES, RANKS, type Rank } from "@/lib/xp";
import {
  loadGameConfig,
  clearGameConfigCache,
  type GameConfig,
} from "@/lib/gameConfig";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

// Milestone badge ids in ascending order — thresholds must strictly increase
// along this sequence.
const MILESTONE_IDS = [
  "getting-started",
  "trail-regular",
  "half-way-hero",
  "almost-there",
] as const;

const BADGE_IDS = new Set(BADGES.map((b) => b.id));
const XP_KEYS = new Set(Object.keys(XP_VALUES));

/**
 * GET is public — walkers need badge names, descriptions and rank titles for
 * their profile and scan screens (via useGameConfig).
 */
export async function GET() {
  return NextResponse.json(await loadGameConfig());
}

interface PutBody {
  badges?: {
    badges?: unknown;
    milestoneThresholds?: unknown;
    completionistDays?: unknown;
  };
  xp?: {
    values?: unknown;
    ranks?: unknown;
  };
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Validate the badges section; returns the sanitized doc or null. */
function validateBadgesSection(
  section: NonNullable<PutBody["badges"]>,
  current: GameConfig,
  issues: string[]
): { badges: Badge[]; milestoneThresholds: Record<string, number>; completionistDays: number } {
  // Badge copy — ids are fixed: this edits how the 22 badges are named and
  // described, it cannot create or delete badges.
  let badges = current.badges;
  if (section.badges !== undefined) {
    if (!Array.isArray(section.badges)) {
      issues.push("badges: must be an array");
    } else {
      const seen = new Set<string>();
      const sanitized: Badge[] = [];
      for (const entry of section.badges as Record<string, unknown>[]) {
        const id = entry?.id;
        if (!isNonEmptyString(id) || !BADGE_IDS.has(id)) {
          issues.push(`badges: unknown badge id "${String(id)}" — badge ids are fixed`);
          continue;
        }
        if (seen.has(id)) {
          issues.push(`badges: duplicate badge id "${id}"`);
          continue;
        }
        seen.add(id);
        if (!isNonEmptyString(entry.name)) issues.push(`badges.${id}: name is required`);
        if (!isNonEmptyString(entry.description)) issues.push(`badges.${id}: description is required`);
        if (!isNonEmptyString(entry.icon)) issues.push(`badges.${id}: icon is required (Material Symbols name)`);
        const def = BADGES.find((b) => b.id === id)!;
        sanitized.push({
          id,
          name: isNonEmptyString(entry.name) ? entry.name.trim() : def.name,
          description: isNonEmptyString(entry.description) ? entry.description.trim() : def.description,
          icon: isNonEmptyString(entry.icon) ? entry.icon.trim() : def.icon,
          category: def.category, // category drives the detection grouping — fixed
        });
      }
      if (seen.size !== BADGE_IDS.size) {
        const missing = [...BADGE_IDS].filter((id) => !seen.has(id));
        issues.push(`badges: must include all ${BADGE_IDS.size} badge ids (missing: ${missing.join(", ")})`);
      } else {
        badges = sanitized;
      }
    }
  }

  // Milestone thresholds — only the four milestone ids, positive integers,
  // strictly increasing getting-started < trail-regular < half-way-hero < almost-there.
  const milestoneThresholds = { ...current.milestoneThresholds };
  if (section.milestoneThresholds !== undefined) {
    if (
      typeof section.milestoneThresholds !== "object" ||
      section.milestoneThresholds === null ||
      Array.isArray(section.milestoneThresholds)
    ) {
      issues.push("milestoneThresholds: must be an object");
    } else {
      for (const [key, value] of Object.entries(section.milestoneThresholds)) {
        if (!(MILESTONE_IDS as readonly string[]).includes(key)) {
          issues.push(`milestoneThresholds: "${key}" is not a milestone badge`);
          continue;
        }
        if (!isPositiveInt(value)) {
          issues.push(`milestoneThresholds.${key}: must be a positive whole number`);
          continue;
        }
        milestoneThresholds[key] = value;
      }
      for (let i = 1; i < MILESTONE_IDS.length; i++) {
        const prev = MILESTONE_IDS[i - 1];
        const curr = MILESTONE_IDS[i];
        if (milestoneThresholds[curr] <= milestoneThresholds[prev]) {
          issues.push(
            `milestoneThresholds: ${curr} (${milestoneThresholds[curr]}) must be greater than ${prev} (${milestoneThresholds[prev]})`
          );
        }
      }
    }
  }

  // Completionist window
  let completionistDays = current.completionistDays;
  if (section.completionistDays !== undefined) {
    if (!isPositiveInt(section.completionistDays)) {
      issues.push("completionistDays: must be a positive whole number");
    } else {
      completionistDays = section.completionistDays;
    }
  }

  return { badges, milestoneThresholds, completionistDays };
}

/** Validate the xp section; returns the sanitized doc. */
function validateXpSection(
  section: NonNullable<PutBody["xp"]>,
  current: GameConfig,
  issues: string[]
): { values: Record<string, number>; ranks: Rank[] } {
  // XP values — keys are fixed to the in-code table, positive integers only.
  const values: Record<string, number> = { ...current.xpValues };
  if (section.values !== undefined) {
    if (
      typeof section.values !== "object" ||
      section.values === null ||
      Array.isArray(section.values)
    ) {
      issues.push("xp.values: must be an object");
    } else {
      for (const [key, value] of Object.entries(section.values)) {
        if (!XP_KEYS.has(key)) {
          issues.push(`xp.values: "${key}" is not an XP value`);
          continue;
        }
        if (!isPositiveInt(value)) {
          issues.push(`xp.values.${key}: must be a positive whole number`);
          continue;
        }
        values[key] = value;
      }
    }
  }

  // Ranks — same number of ranks as in code, titles editable, minXP strictly
  // increasing. Icon/colour are optional; defaults are kept when omitted.
  let ranks = current.ranks;
  if (section.ranks !== undefined) {
    if (!Array.isArray(section.ranks)) {
      issues.push("xp.ranks: must be an array");
    } else if (section.ranks.length !== RANKS.length) {
      issues.push(
        `xp.ranks: must contain exactly ${RANKS.length} ranks (ranks cannot be added or removed)`
      );
    } else {
      const sanitized: Rank[] = (section.ranks as Record<string, unknown>[]).map(
        (entry, i) => {
          const def = RANKS[i];
          if (!isNonEmptyString(entry?.title)) {
            issues.push(`xp.ranks[${i}]: title is required`);
          }
          const minXP = entry?.minXP;
          if (typeof minXP !== "number" || !Number.isInteger(minXP) || minXP < 0) {
            issues.push(`xp.ranks[${i}]: minXP must be a whole number of 0 or more`);
          }
          return {
            title: isNonEmptyString(entry?.title) ? (entry.title as string).trim() : def.title,
            icon: isNonEmptyString(entry?.icon) ? (entry.icon as string).trim() : def.icon,
            colour: isNonEmptyString(entry?.colour) ? (entry.colour as string).trim() : def.colour,
            minXP: typeof minXP === "number" && Number.isInteger(minXP) && minXP >= 0 ? minXP : def.minXP,
          };
        }
      );
      for (let i = 1; i < sanitized.length; i++) {
        if (sanitized[i].minXP <= sanitized[i - 1].minXP) {
          issues.push(
            `xp.ranks: minXP must strictly increase — "${sanitized[i].title}" (${sanitized[i].minXP}) is not above "${sanitized[i - 1].title}" (${sanitized[i - 1].minXP})`
          );
        }
      }
      ranks = sanitized;
    }
  }

  return { values, ranks };
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.badges && !body?.xp) {
    return NextResponse.json(
      { error: "Nothing to save — provide badges and/or xp" },
      { status: 400 }
    );
  }

  // Merge over the current stored config so a partial PUT (e.g. badges only)
  // never clobbers the other doc's overrides.
  clearGameConfigCache();
  const current = await loadGameConfig();

  const issues: string[] = [];
  const badgesDoc = body.badges
    ? validateBadgesSection(body.badges, current, issues)
    : null;
  const xpDoc = body.xp ? validateXpSection(body.xp, current, issues) : null;

  if (issues.length > 0) {
    return NextResponse.json(
      { error: "Validation failed", issues },
      { status: 400 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const col = db.collection("gameConfig");
    if (badgesDoc) await col.doc("badges").set(badgesDoc);
    if (xpDoc) await col.doc("xp").set(xpDoc);
    clearGameConfigCache();
    return NextResponse.json({ success: true, config: await loadGameConfig() });
  } catch (e) {
    console.error("Game config save failed:", e);
    return dbUnavailable();
  }
}
