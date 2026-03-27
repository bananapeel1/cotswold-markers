/**
 * TrailTap XP / Points System
 *
 * Every scan earns base XP plus contextual bonuses.
 * XP drives the leaderboard and unlocks rank titles.
 */

import type { ScanEntry } from "./badges";

// ── Point Values ──────────────────────────────────────────────
export const XP_VALUES = {
  // Base actions
  SCAN_NEW_MARKER: 100,

  // Condition bonuses (stackable)
  BONUS_RAIN: 25,
  BONUS_EARLY_BIRD: 50, // before 7 am
  BONUS_NIGHT_OWL: 30, // after 8 pm
  BONUS_WEEKEND: 15,

  // Streak bonuses (per day in active streak)
  BONUS_STREAK_PER_DAY: 10, // +10 per consecutive day

  // Achievement bonuses
  BONUS_SEGMENT_COMPLETE: 500, // all markers in a segment in one day
  BONUS_SPEED_DEMON: 200, // 3+ markers in one day
  BONUS_TRAILBLAZER: 75, // first scan of the day at this marker (nobody else today)

  // Pace accuracy bonus (segment challenges)
  BONUS_PACE_PERFECT: 150, // within 5% of estimated time
  BONUS_PACE_GOOD: 100, // within 15%
  BONUS_PACE_DECENT: 50, // within 25%
} as const;

// ── Rank System ───────────────────────────────────────────────
export interface Rank {
  title: string;
  icon: string;
  minXP: number;
  colour: string; // Tailwind text colour class
}

export const RANKS: Rank[] = [
  { title: "Trail Newcomer", icon: "person", minXP: 0, colour: "text-secondary" },
  { title: "Path Finder", icon: "explore", minXP: 200, colour: "text-green-600" },
  { title: "Ridge Walker", icon: "hiking", minXP: 500, colour: "text-blue-600" },
  { title: "Summit Seeker", icon: "landscape", minXP: 1000, colour: "text-purple-600" },
  { title: "Trail Master", icon: "military_tech", minXP: 2500, colour: "text-amber-600" },
  { title: "Cotswold Legend", icon: "diamond", minXP: 5000, colour: "text-primary" },
];

export function getRank(xp: number): Rank {
  // Find the highest rank the user qualifies for
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(xp: number): Rank | null {
  for (const rank of RANKS) {
    if (xp < rank.minXP) return rank;
  }
  return null; // Already at max rank
}

// ── Estimated Walking Times ───────────────────────────────────
// Naismith's Rule: 5 km/h base + 1 min per 10m ascent
// We use miles, so convert: 3.1 mph base ≈ 19.4 min/mile flat
// + extra time for ascent/descent

interface MarkerInfo {
  id: string;
  trailMile: number;
  elevation_m: number;
}

/**
 * Calculate estimated walking time between two consecutive markers (in minutes).
 * Uses Naismith's rule with Tranter corrections for descent.
 */
export function estimateWalkingTime(from: MarkerInfo, to: MarkerInfo): number {
  const distanceMiles = Math.abs(to.trailMile - from.trailMile);
  const elevChange = to.elevation_m - from.elevation_m;

  // Base: 20 min/mile (moderate walking pace, accounting for terrain)
  let minutes = distanceMiles * 20;

  // Ascent: +1 min per 10m gained
  if (elevChange > 0) {
    minutes += elevChange / 10;
  }

  // Descent: +0.5 min per 10m lost (steep descents slow you down)
  if (elevChange < 0) {
    minutes += Math.abs(elevChange) / 20;
  }

  return Math.round(minutes);
}

/**
 * Calculate pace accuracy bonus XP.
 * Returns { xp, accuracy, label }
 */
export function calculatePaceBonus(
  estimatedMinutes: number,
  actualMinutes: number
): { xp: number; accuracy: number; label: string } {
  if (estimatedMinutes <= 0 || actualMinutes <= 0) {
    return { xp: 0, accuracy: 0, label: "invalid" };
  }

  // Don't reward suspiciously fast times (less than 50% of estimate = probably drove)
  if (actualMinutes < estimatedMinutes * 0.5) {
    return { xp: 0, accuracy: 0, label: "too fast" };
  }

  const deviation = Math.abs(actualMinutes - estimatedMinutes) / estimatedMinutes;
  const accuracy = Math.round((1 - deviation) * 100);

  if (deviation <= 0.05) {
    return { xp: XP_VALUES.BONUS_PACE_PERFECT, accuracy, label: "Perfect pace!" };
  }
  if (deviation <= 0.15) {
    return { xp: XP_VALUES.BONUS_PACE_GOOD, accuracy, label: "Great pace!" };
  }
  if (deviation <= 0.25) {
    return { xp: XP_VALUES.BONUS_PACE_DECENT, accuracy, label: "Good pace" };
  }

  return { xp: 0, accuracy, label: "Keep practising" };
}

// ── XP Calculation ────────────────────────────────────────────

export interface XPBreakdown {
  base: number;
  bonuses: { reason: string; xp: number }[];
  total: number;
}

/**
 * Calculate XP earned for a single scan.
 */
export function calculateScanXP(
  scan: ScanEntry,
  streakDays: number,
  segmentComplete?: boolean,
  speedDemon?: boolean,
  paceBonus?: number
): XPBreakdown {
  const bonuses: { reason: string; xp: number }[] = [];
  const base = XP_VALUES.SCAN_NEW_MARKER;

  const date = new Date(scan.timestamp);
  const hour = date.getHours();
  const day = date.getDay();

  // Weather bonus
  if (scan.weather?.isRaining) {
    bonuses.push({ reason: "Rain bonus", xp: XP_VALUES.BONUS_RAIN });
  }

  // Time bonuses
  if (hour < 7) {
    bonuses.push({ reason: "Early bird", xp: XP_VALUES.BONUS_EARLY_BIRD });
  }
  if (hour >= 20) {
    bonuses.push({ reason: "Night owl", xp: XP_VALUES.BONUS_NIGHT_OWL });
  }

  // Weekend bonus
  if (day === 0 || day === 6) {
    bonuses.push({ reason: "Weekend walker", xp: XP_VALUES.BONUS_WEEKEND });
  }

  // Streak bonus
  if (streakDays > 1) {
    const streakXP = Math.min(streakDays, 30) * XP_VALUES.BONUS_STREAK_PER_DAY;
    bonuses.push({ reason: `${streakDays}-day streak`, xp: streakXP });
  }

  // Segment complete bonus
  if (segmentComplete) {
    bonuses.push({ reason: "Segment complete!", xp: XP_VALUES.BONUS_SEGMENT_COMPLETE });
  }

  // Speed demon bonus (3+ in a day)
  if (speedDemon) {
    bonuses.push({ reason: "Speed demon", xp: XP_VALUES.BONUS_SPEED_DEMON });
  }

  // Pace accuracy bonus
  if (paceBonus && paceBonus > 0) {
    bonuses.push({ reason: "Pace accuracy", xp: paceBonus });
  }

  const total = base + bonuses.reduce((sum, b) => sum + b.xp, 0);
  return { base, bonuses, total };
}

/**
 * Calculate total XP from all scans (for profile display / leaderboard).
 */
export function calculateTotalXP(scans: ScanEntry[]): number {
  if (scans.length === 0) return 0;

  let totalXP = 0;

  // Sort scans chronologically
  const sorted = [...scans].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Track streak for bonus calculation
  const dates = [...new Set(sorted.map((s) => s.timestamp.slice(0, 10)))].sort();
  const streakAtDate = new Map<string, number>();
  let streak = 1;
  for (let i = 0; i < dates.length; i++) {
    if (i > 0) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      streak = diff === 1 ? streak + 1 : 1;
    }
    streakAtDate.set(dates[i], streak);
  }

  // Track scans per day for speed demon
  const scansByDate = new Map<string, number>();
  for (const scan of sorted) {
    const dateKey = scan.timestamp.slice(0, 10);
    scansByDate.set(dateKey, (scansByDate.get(dateKey) || 0) + 1);
  }

  for (const scan of sorted) {
    const dateKey = scan.timestamp.slice(0, 10);
    const dayStreak = streakAtDate.get(dateKey) || 0;
    const dayCount = scansByDate.get(dateKey) || 0;
    const isSpeedDemon = dayCount >= 3;

    const breakdown = calculateScanXP(scan, dayStreak, false, isSpeedDemon);
    totalXP += breakdown.total;
  }

  return totalXP;
}

// ── Segment Time Tracking ─────────────────────────────────────

export interface SegmentTime {
  fromMarkerId: string;
  toMarkerId: string;
  actualMinutes: number;
  estimatedMinutes: number;
  accuracy: number; // percentage
  xpEarned: number;
  timestamp: string; // when the segment was completed (second scan timestamp)
}

/**
 * Calculate segment times from chronological scans.
 * Only counts consecutive marker scans (markers that are adjacent on the trail).
 */
export function calculateSegmentTimes(
  scans: ScanEntry[],
  markers: MarkerInfo[]
): SegmentTime[] {
  if (scans.length < 2) return [];

  // Build lookup: markerId → index in trail order
  const markerIndex = new Map<string, number>();
  markers.forEach((m, i) => markerIndex.set(m.id, i));

  // Build lookup: markerId → marker info
  const markerMap = new Map<string, MarkerInfo>();
  markers.forEach((m) => markerMap.set(m.id, m));

  // Sort scans chronologically
  const sorted = [...scans].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const segmentTimes: SegmentTime[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prevScan = sorted[i - 1];
    const currScan = sorted[i];

    const prevIdx = markerIndex.get(prevScan.markerId);
    const currIdx = markerIndex.get(currScan.markerId);

    if (prevIdx === undefined || currIdx === undefined) continue;

    // Only count if markers are adjacent (next to each other on the trail)
    if (Math.abs(currIdx - prevIdx) !== 1) continue;

    const from = markerMap.get(prevScan.markerId)!;
    const to = markerMap.get(currScan.markerId)!;

    const estimatedMinutes = estimateWalkingTime(from, to);
    const actualMinutes = Math.round(
      (new Date(currScan.timestamp).getTime() - new Date(prevScan.timestamp).getTime()) / 60000
    );

    // Skip unrealistic times (less than 5 min or more than 8 hours between markers)
    if (actualMinutes < 5 || actualMinutes > 480) continue;

    const paceResult = calculatePaceBonus(estimatedMinutes, actualMinutes);

    segmentTimes.push({
      fromMarkerId: prevScan.markerId,
      toMarkerId: currScan.markerId,
      actualMinutes,
      estimatedMinutes,
      accuracy: paceResult.accuracy,
      xpEarned: paceResult.xp,
      timestamp: currScan.timestamp,
    });
  }

  return segmentTimes;
}
