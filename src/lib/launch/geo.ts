/**
 * Geometry for the launch site's maps, from the real route and heights in
 * src/data/launch/geo.json. Pure functions, shared by the server (which draws
 * the SVGs) and the browser (which moves the walker along the strip).
 */

import geo from "@/data/launch/geo.json";
import { FIRST_STRETCH_KM, QUESTIONS, WHOLE_WAY_KM } from "@/content/launch";

export interface Place {
  name: string;
  km: number;
  kind: "settlement" | "feature";
  ele: number;
  near: { food: number; shop: number; water: number; loo: number; stay: number };
}

/** [lng, lat, km] every few hundred metres from Chipping Campden to Bath. */
export const KEY = geo.key as [number, number, number][];
/** Sideways offset of the first stretch, one value per 100 m, rotated so it runs straight down. */
export const STRIP = geo.strip as number[];
/** [km, metres] along the first stretch and the whole Way. */
export const ELEV = geo.elev as [number, number][];
export const ELEV_FULL = geo.elevFull as [number, number][];
export const PLACES = geo.places as Place[];

export const mi = (km: number) => km * 0.621371;

export function eleAt(km: number): number {
  let lo = 0;
  let hi = ELEV.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ELEV[m][0] < km) lo = m;
    else hi = m;
  }
  const [ak, ae] = ELEV[lo];
  const [bk, be] = ELEV[hi];
  const t = (km - ak) / Math.max(0.001, bk - ak);
  return ae + (be - ae) * Math.max(0, Math.min(1, t));
}

export const pts = (arr: number[][]) => arr.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ");
export const pathD = (arr: number[][]) =>
  arr.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" ");

/** The place the walker has most recently passed. */
export function placeAt(km: number): string {
  let name = PLACES[0].name;
  for (const p of PLACES) if (p.km <= km + 0.3) name = p.name;
  return name;
}

/* ---------- the whole Way, Chipping Campden to Bath ---------- */

export const BIG_MAP_TIMING = { delay: 0.5, first: 0.9, rest: 1.9 };

/** Seconds into the drawing at which the line reaches a km. */
export function bigMapDelay(km: number): number {
  const { delay, first, rest } = BIG_MAP_TIMING;
  return km <= FIRST_STRETCH_KM
    ? delay + (km / FIRST_STRETCH_KM) * first
    : delay + first + ((km - FIRST_STRETCH_KM) / (WHOLE_WAY_KM - FIRST_STRETCH_KM)) * rest;
}

export function bigMapProjection() {
  const lng = KEY.map((p) => p[0]);
  const lat = KEY.map((p) => p[1]);
  const x0 = Math.min(...lng);
  const x1 = Math.max(...lng);
  const y0 = Math.min(...lat);
  const y1 = Math.max(...lat);
  const k = Math.cos((51.7 * Math.PI) / 180);
  const W = 320;
  const padX = 84;
  const padY = 22;
  const s = (W - padX * 2) / ((x1 - x0) * k);
  const H = Math.round((y1 - y0) * s + padY * 2);
  const ox = (W - (x1 - x0) * k * s) / 2;
  const P = (p: [number, number, number]): [number, number] => [ox + (p[0] - x0) * k * s, padY + (y1 - p[1]) * s];
  const at = (km: number) => P(KEY.reduce((b, c) => (Math.abs(c[2] - km) < Math.abs(b[2] - km) ? c : b)));
  const after = (km: number) => P(KEY.find((p) => p[2] >= km) ?? KEY[KEY.length - 1]);
  return { W, H, P, at, after };
}

export const BIG_MAP_TOWNS: [string, number][] = [
  ["Chipping Campden", 0],
  ["Winchcombe", 28.9],
  ["Painswick", 75.4],
  ["Dursley", 102.1],
  ["Wotton-under-Edge", 114.4],
  ["Old Sodbury", 133.5],
  ["Bath", 165],
];

/* ---------- the strip map of the first stretch ---------- */

export type StripVariant = "narrow" | "mid" | "wide";
export const STRIP_VARIANTS: StripVariant[] = ["narrow", "mid", "wide"];

/** Media queries matching each variant; keep in step with launch.css. */
export const STRIP_MEDIA: Record<StripVariant, string> = {
  narrow: "(max-width: 620px)",
  mid: "(min-width: 621px) and (max-width: 900px)",
  wide: "(min-width: 901px)",
};

const STRIP_PARAMS: Record<
  StripVariant,
  { base: number; room: number; rail: number; mapw: number; cx: number; amp: number; gap: number }
> = {
  narrow: { base: 52, room: 330, rail: 28, mapw: 72, cx: 0.46, amp: 11, gap: 3.2 },
  mid: { base: 58, room: 250, rail: 64, mapw: 150, cx: 0.38, amp: 20, gap: 6 },
  wide: { base: 66, room: 210, rail: 120, mapw: 330, cx: 0.38, amp: 44, gap: 9 },
};

/** Questions in walking order. */
export const QUESTION_STOPS = [...QUESTIONS].sort((a, b) => a.km - b.km);

/**
 * Lays the first stretch out down the page: distance down the page is true,
 * with room made at each question for its card.
 */
export function stripLayout(variant: StripVariant) {
  const p = STRIP_PARAMS[variant];
  const stops = QUESTION_STOPS.map((q) => q.km);
  const steps = FIRST_STRETCH_KM * 10;
  const ys: number[] = [];
  let y = 46;
  let si = 0;
  for (let i = 0; i <= steps; i++) {
    const km = i / 10;
    while (si < stops.length && stops[si] <= km) {
      y += p.room;
      si++;
    }
    ys.push(y);
    y += p.base / 10;
  }
  const total = y + 40;
  const W = p.rail + p.mapw;
  const cx = p.rail + p.mapw * p.cx;
  const yOfKm = (km: number) => ys[Math.max(0, Math.min(ys.length - 1, Math.round(km * 10)))];
  const kmOfY = (yy: number) => {
    let lo = 0;
    let hi = ys.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (ys[m] < yy) lo = m;
      else hi = m;
    }
    return lo / 10;
  };
  const X = (km: number) => cx + STRIP[Math.max(0, Math.min(STRIP.length - 1, Math.round(km * 10)))] * p.amp;
  const path: [number, number][] = [];
  for (let i = 0; i <= steps; i++) path.push([X(i / 10), yOfKm(i / 10)]);
  const cum = [0];
  for (let i = 1; i < path.length; i++)
    cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  return { ...p, variant, ys, total, W, X, yOfKm, kmOfY, path, cum, routeLen: cum[cum.length - 1] };
}

export type StripLayout = ReturnType<typeof stripLayout>;

/** Where the walker sits, and how much of the path is drawn, for a y on the strip. */
export function walkerAt(L: StripLayout, y: number) {
  const km = Math.max(0, Math.min(FIRST_STRETCH_KM, L.kmOfY(y)));
  const i = Math.round(km * 10);
  const inGap = i < L.ys.length - 1 ? Math.min(y - L.ys[i], L.cum[i + 1] - L.cum[i]) : 0;
  const along = Math.max(0, Math.min(L.routeLen, L.cum[i] + Math.max(0, inGap)));
  return { km, x: L.X(km), along };
}

/** Places drawn on the strip: a landmark sitting on top of a village is left out. */
export const STRIP_PLACES = PLACES.filter(
  (p, i) =>
    !PLACES.some((q, j) => j !== i && q.kind === "settlement" && p.kind === "feature" && Math.abs(q.km - p.km) < 0.6),
);

/** "Within half a mile: …" for a place's trail note. */
export function placeNote(p: Place): string {
  const n = p.near;
  const bits: string[] = [];
  if (n.food) bits.push(n.food + (n.food > 1 ? " pubs and cafés" : " pub or café"));
  if (n.shop) bits.push(n.shop > 1 ? `${n.shop} shops` : "a shop");
  if (n.water) bits.push("water");
  if (n.loo) bits.push("toilets");
  if (n.stay) bits.push(n.stay > 1 ? `${n.stay} places to stay` : "a place to stay");
  return bits.length
    ? `Within half a mile: ${bits.join(", ")}.`
    : "No water, food or toilets within half a mile. Fill up before you get here.";
}

/** Big climbs and descents on the first stretch: over 70 m within 2.5 km. */
export function bigClimbs() {
  const climbs: { km: number; d: number }[] = [];
  for (let i = 0; i < ELEV.length; i++) {
    const [ak, ae] = ELEV[i];
    let best: { d: number } | null = null;
    for (let j = i + 1; j < ELEV.length && ELEV[j][0] - ak <= 2.5; j++) {
      const dd = ELEV[j][1] - ae;
      if (!best || Math.abs(dd) > Math.abs(best.d)) best = { d: dd };
    }
    if (
      best &&
      Math.abs(best.d) >= 70 &&
      !climbs.some((c) => Math.abs(c.km - ak) < 3) &&
      !PLACES.some((pl) => Math.abs(pl.km - (ak + 0.6)) < 1)
    )
      climbs.push({ km: ak, d: best.d });
  }
  return climbs;
}

/* ---------- chapter two: Cleeve Hill to Bath, side on ---------- */

export const PROFILE_FROM_KM = 34;

/** Profile line in a 1000-wide box of the given height; x is stretched to fit with CSS. */
export function profileGeometry(H: number) {
  const arr = ELEV_FULL.filter((p) => p[0] >= PROFILE_FROM_KM);
  const base = H - 54;
  const top = 30;
  const emax = Math.max(...arr.map((p) => p[1]));
  const xs = (km: number) => ((km - PROFILE_FROM_KM) / (WHOLE_WAY_KM - PROFILE_FROM_KM)) * 1000;
  const ys = (e: number) => base - (e / emax) * (base - top);
  let line = arr.map((p) => [xs(p[0]), ys(p[1])]);
  for (let s = 0; s < 2; s++)
    line = line.map((q, i) =>
      i === 0 || i === line.length - 1 ? q : [q[0], (line[i - 1][1] + q[1] * 2 + line[i + 1][1]) / 4],
    );
  const eleNear = (km: number) => arr.reduce((b, c) => (Math.abs(c[0] - km) < Math.abs(b[0] - km) ? c : b))[1];
  return { line, base, xs, ys, eleNear, startEle: Math.round(arr[0][1]) };
}

export const PROFILE_TOWNS: { name: string; km: number; narrow: boolean }[] = [
  { name: "Leckhampton Hill", km: 54.1, narrow: false },
  { name: "Birdlip", km: 62.9, narrow: false },
  { name: "Painswick", km: 75.4, narrow: true },
  { name: "Selsley Common", km: 91.5, narrow: false },
  { name: "Dursley", km: 102.1, narrow: true },
  { name: "Wotton-under-Edge", km: 114.4, narrow: false },
  { name: "Old Sodbury", km: 133.5, narrow: true },
  { name: "Dyrham", km: 144.4, narrow: false },
  { name: "Bath", km: 165, narrow: true },
];
