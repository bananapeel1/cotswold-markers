"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { QUESTIONS, WALK_HEIGHTS, WALK_TOWNS } from "@/content/launch";
import { eleAt, mi } from "@/lib/launch/geo";
import Arrow from "./Arrow";
import { WALK_PLACES, WALK_ROUTE } from "@/lib/launch/walk";

/**
 * Walking the first stretch: a sticky map on one side, stops on the other.
 * As you scroll, a walker moves along the real route, the TrailTap layer is
 * revealed wherever it has been, and the miles and height count along. On
 * phones the map is the whole screen: you walk by dragging along the hills at
 * its foot (or the buttons, a swipe, or "Start walking"), and the stop you
 * reach stands up on the map above the walker, its answer one tap away. The
 * map, stops and route are all on the page without script (on phones the
 * stops then follow the map as a list); the script moves the camera, the
 * walker and the card.
 */

type Stop =
  | { kind: "town"; km: number; where: string; heading: string; has: readonly string[] }
  | { kind: "q"; km: number; where: string; question: string; answer: string; photo: string; alt: string; ele: number }
  | { kind: "end"; km: number; where: string };

const STOPS: Stop[] = [
  ...WALK_TOWNS.map((t) => ({ kind: "town" as const, ...t })),
  ...QUESTIONS.map((q) => ({
    kind: "q" as const,
    km: q.km,
    where: q.where,
    question: q.question,
    answer: q.answer,
    photo: q.photo,
    alt: q.alt,
    ele: WALK_HEIGHTS[q.where] ?? Math.round(eleAt(q.km)),
  })),
  { kind: "end" as const, km: 36.1, where: "Cleeve Hill" },
].sort((a, b) => a.km - b.km);

/** The id of a stop's card, so the pins on the map can jump to it. */
const stopId = (where: string) => `stop-${where.toLowerCase().replace(/[^a-z]+/g, "-")}`;

const ROUTE_PTS = WALK_ROUTE.map((p) => `${p[0]},${p[1]}`).join(" ");
const KM_END = WALK_ROUTE[WALK_ROUTE.length - 1][2];

function at(km: number): [number, number, number] {
  for (let i = 1; i < WALK_ROUTE.length; i++) {
    if (WALK_ROUTE[i][2] >= km) {
      const a = WALK_ROUTE[i - 1];
      const b = WALK_ROUTE[i];
      const t = (km - a[2]) / (b[2] - a[2] || 1);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, i];
    }
  }
  const l = WALK_ROUTE[WALK_ROUTE.length - 1];
  return [l[0], l[1], WALK_ROUTE.length];
}

/* the height profile along the bottom of the map: 0.5 km steps, 0 to 36 km, 75 to 335 m */
const PROFILE = Array.from({ length: 73 }, (_, i) => [i * 5, 58 - ((eleAt(i * 0.5) - 75) / (335 - 75)) * 52] as const);
const PROFILE_LINE = PROFILE.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y.toFixed(1)}`).join(" ");
const PROFILE_AREA = `M0 60 ${PROFILE_LINE.replace(/^M/, "L")} L360 60Z`;

const GRID_X = Array.from({ length: 30 }, (_, i) => 96.1 - 30.63 * 6 + i * 30.63);
const GRID_Y = Array.from({ length: 46 }, (_, i) => 233.2 - 30.63 * 13 + i * 30.63);
const SQUARES: [number, number][] = [[-9, -5], [-4, -9], [5, -7], [9, -1], [-8, 4], [6, 6], [0, 9], [-2, -2]];

const HAS: Record<string, { label: string; icon: React.ReactNode }> = {
  food: {
    label: "Pubs and cafés",
    icon: <path d="M3 6h8v3a4 4 0 0 1-8 0zM11 7h1.5a1.5 1.5 0 0 1 0 3H11M5 2.5v1.5M8 2v2" />,
  },
  shop: { label: "Shops", icon: <path d="M3 5.5h10l-1 8H4zM6 5.5V4a2 2 0 0 1 4 0v1.5" /> },
  loo: {
    label: "Toilets",
    icon: (
      <>
        <rect x="1.5" y="3" width="13" height="10" rx="2.5" />
        <path d="M4.5 6l1 4 1-3 1 3 1-4M10.5 6.5a1.4 1.4 0 1 0 0 3" />
      </>
    ),
  },
  stay: {
    label: "Places to stay",
    icon: <path d="M2 12V4M2 9.5h12V12M14 9.5V8a2 2 0 0 0-2-2H7v3.5M4.5 8a1 1 0 1 0 0-.1" />,
  },
};

export const PlateIcon = () => (
  <svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true">
    <rect x="1.5" y="1.5" width="19" height="25" rx="4" fill="#f3eee2" stroke="#1d3024" strokeWidth="1.6" />
    <circle cx="11" cy="10" r="5" fill="none" stroke="#1d3024" strokeWidth="1.4" />
    <circle cx="11" cy="10" r="1.8" fill="#9a3412" />
    <rect x="7" y="17.5" width="8" height="6" rx="1" fill="#1d3024" opacity=".75" />
  </svg>
);

/* what the lines mean: on the map on wide screens, under the heading on phones where the map is small */
const KEY = (
  <>
    <span>
      <i style={{ borderTop: "2px dashed #8d8a7e" }} />
      The Way
    </span>
    <span>
      <i style={{ borderTop: "4px solid #9a3412" }} />
      Opened by TrailTap
    </span>
    <span>
      <svg width="20" height="14" viewBox="0 0 20 14">
        <circle cx="10" cy="7" r="5.5" fill="none" stroke="#9a3412" strokeWidth="2.2" />
      </svg>
      Food, shops, toilets
    </span>
  </>
);
const FIRST_Q = STOPS.findIndex((s) => s.kind === "q");

export default function TrailWalk({
  heading,
  fullStory,
  endText,
  endCta,
}: {
  heading: string;
  fullStory: string;
  endText: string;
  endCta: string;
}) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = root.current;
    if (!sec) return;
    const $ = <T extends Element = HTMLElement>(s: string) => sec.querySelector<T>(s)!;
    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrowQ = matchMedia("(max-width: 900px)");
    const map = $<SVGSVGElement>(".tw-map");
    const box = $(".tw-box");
    const hud = $(".tw-hud");
    const rail = $(".tw-stops");
    const profile = $(".tw-profile");
    const thumb = $(".tw-thumb");
    const prev = $<HTMLButtonElement>(".tw-prev");
    const next = $<HTMLButtonElement>(".tw-next");
    const walked = $<SVGPolylineElement>("#tw-walked");
    const maskAll = $<SVGRectElement>("#tw-mask-all");
    const walker = $<SVGGElement>(".tw-walker");
    const miEl = $(".tw-mi");
    const whereEl = $(".tw-where");
    const heightEl = $(".tw-height");
    const clipR = $<SVGRectElement>("#tw-pclip-r");
    const pline = $<SVGLineElement>(".tw-pline");
    const stopEls = [...sec.querySelectorAll<HTMLElement>(".tw-stop")];
    const rings = [...sec.querySelectorAll<SVGCircleElement>(".tw-ring")];
    const ringKm = rings.map((r) => Number(r.dataset.km));
    const KMS = STOPS.map((s) => s.km);
    const last = STOPS.length - 1;
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    sec.classList.add("live");

    // pins answer clicks only once they're drawn: walked past
    const pins = [...sec.querySelectorAll<SVGElement>(".tw-pin")].map((el) => ({ el, km: Number(el.dataset.km) }));
    let walkedKm = 0;
    let allOpen = false;
    const updatePins = () => {
      for (const p of pins) {
        const on = allOpen || p.km <= walkedKm + 0.2;
        p.el.classList.toggle("on", on);
      }
    };

    /** Points the map at km and returns the view box it chose. */
    const camera = (km: number, zf: number) => {
      // zoom 1 frames the whole stretch, labels included, clear of the readout and the profile;
      // closer zooms follow the walker
      const narrow = narrowQ.matches;
      const bw = box.clientWidth;
      const bh = box.clientHeight;
      if (!bw || !bh) return null;
      const a = bw / bh;
      let padT = 92 / bh;
      let padB = 92 / bh;
      // on phones: between the readout and the strip along the foot, with the walker low enough
      // that the stop it reaches has room to speak above it
      let focus = padT + (1 - padT - padB) / 2;
      if (narrow) {
        // over the last stretch the map pulls back to the whole walk, below the closing card
        const end = easeIO(clamp((km - KMS[last - 1]) / (KMS[last] - KMS[last - 1]), 0, 1));
        const endCard = stopEls[last].offsetHeight || 260;
        padT = (hud.offsetTop + hud.offsetHeight + 10 + end * (endCard + 16)) / bh;
        padB = (bh - profile.offsetTop + 10) / bh;
        focus = 0.7;
      }
      const [cx0, cx1, cy0, cy1] = [-10, 610, 200, 686];
      let vhFit = (cy1 - cy0) / (1 - padT - padB);
      const vwFit = Math.max(cx1 - cx0, vhFit * a);
      vhFit = vwFit / a;
      const fx = (cx0 + cx1) / 2 - vwFit / 2;
      const fy = cy0 - padT * vhFit - (vhFit * (1 - padT - padB) - (cy1 - cy0)) / 2;
      const vw = vwFit / zf;
      const vh = vw / a;
      const c = at(km);
      const x = clamp(c[0] - vw / 2, fx, fx + vwFit - vw);
      const y = clamp(c[1] - vh * focus, fy, fy + vhFit - vh);
      map.setAttribute("viewBox", `${x.toFixed(1)} ${y.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
      // map units per screen pixel: the labels use it to stay readable at every zoom
      map.style.setProperty("--u", (vw / bw).toFixed(3));
      // a small map zoomed out has no room for every name: keep where it starts and ends
      map.classList.toggle("far", narrow && zf < 1.4);
      return { x, y, vw, vh, bw, bh };
    };

    // phones: the walker is wherever you've taken it (drag, buttons, pins, or "Start walking")
    let km = 0;
    let open = false;
    let shown = -1;
    let wasNarrow = false;

    /** On phones, the stop you've reached stands on the map above the walker, like a plate speaking. */
    const perch = (view: NonNullable<ReturnType<typeof camera>>, wx: number, wy: number) => {
      let n = 0;
      for (let i = 1; i <= last; i++) if (Math.abs(KMS[i] - km) < Math.abs(KMS[n] - km)) n = i;
      const d = Math.abs(KMS[n] - km);
      const o = clamp(1 - (d - 0.06) / 0.3, 0, 1);
      if (n !== shown) {
        if (shown >= 0) stopEls[shown].classList.remove("shown", "solid", "open");
        stopEls[n].classList.add("shown");
        shown = n;
        if (open) setOpen(false);
      }
      const li = stopEls[n];
      li.classList.toggle("solid", o > 0.6);
      const sx = ((wx - view.x) / view.vw) * view.bw;
      const sy = ((wy - view.y) / view.vh) * view.bh;
      const cw = li.offsetWidth;
      const ch = li.offsetHeight;
      const left = n === last ? (view.bw - cw) / 2 : clamp(sx - cw / 2, 10, view.bw - 10 - cw);
      const under = hud.offsetTop + hud.offsetHeight + 8;
      // the closing card sits under the readout, over the whole walk
      const want = n === last ? under - 100 : sy - 26 - ch;
      const top = Math.max(open ? 10 : under, want);
      li.style.transform = `translate(${left.toFixed(1)}px,${(top + (1 - o) * 14).toFixed(1)}px) scale(${(0.94 + 0.06 * o).toFixed(3)})`;
      li.style.opacity = o.toFixed(3);
      li.style.setProperty("--tail", `${clamp(sx - left, 24, cw - 24).toFixed(1)}px`);
      li.classList.toggle("tailless", top > want + 2);
      li.style.setProperty("--maxh", `${view.bh - 84}px`);
    };

    let lastStop = -1;
    let lastPin = -1;
    let lastMi = "";
    const walk = () => {
      const narrow = narrowQ.matches;
      if (narrow !== wasNarrow) {
        // a phone turned sideways (or a window resized) between the two ways of walking
        stopEls.forEach((s) => (s.removeAttribute("style"), s.classList.remove("shown", "solid", "open", "active")));
        shown = -1;
        lastStop = -1;
        setOpen(false);
        wasNarrow = narrow;
        if (narrow) {
          profile.setAttribute("role", "slider");
          profile.tabIndex = 0;
        } else {
          profile.removeAttribute("role");
          profile.removeAttribute("tabindex");
        }
      }
      let idx = last;
      let t = 0;
      let here: number;
      if (narrow) {
        for (let i = 0; i < last; i++)
          if (km < KMS[i + 1]) {
            idx = i;
            t = (km - KMS[i]) / (KMS[i + 1] - KMS[i]);
            break;
          }
        here = km;
      } else {
        // where the stops sit against the middle of the screen
        const mid = innerHeight * 0.5;
        const cs = stopEls.map((s) => {
          const r = s.firstElementChild!.getBoundingClientRect();
          return r.top + Math.min(r.height, innerHeight * 0.5) / 2;
        });
        idx = 0;
        if (mid >= cs[cs.length - 1]) idx = cs.length - 1;
        else if (mid > cs[0])
          for (let i = 0; i < cs.length - 1; i++)
            if (mid >= cs[i] && mid < cs[i + 1]) {
              idx = i;
              t = (mid - cs[i]) / (cs[i + 1] - cs[i]);
              break;
            }
        here = lerp(KMS[idx], KMS[Math.min(idx + 1, last)], easeIO(clamp(t, 0, 1)));
      }
      const active = Math.min(t > 0.5 ? idx + 1 : idx, last);
      if (active !== lastStop) {
        if (!narrow) stopEls.forEach((s, i) => s.classList.toggle("active", i === active));
        prev.disabled = active === 0 && here < 0.05;
        next.disabled = active === last;
        profile.setAttribute("aria-valuetext", `Mile ${mi(KMS[active]).toFixed(1)}, ${STOPS[active].where}`);
        lastStop = active;
      }
      const zoomMax = narrow ? 1.9 : 1.7;
      let zf = RM ? 1 : zoomMax;
      if (!RM && idx === last - 1) zf = lerp(zoomMax, 1, easeIO(clamp((t - 0.15) / 0.85, 0, 1)));
      if (idx >= last) zf = 1;
      const view = camera(here, zf);
      const w = at(here);
      walker.setAttribute("transform", `translate(${w[0].toFixed(1)} ${w[1].toFixed(1)})`);
      if (narrow && view) perch(view, w[0], w[1]);
      const pts: string[] = [];
      for (let i = 0; i < w[2] && i < WALK_ROUTE.length; i++) pts.push(`${WALK_ROUTE[i][0]},${WALK_ROUTE[i][1]}`);
      pts.push(`${w[0].toFixed(1)},${w[1].toFixed(1)}`);
      walked.setAttribute("points", pts.join(" "));
      allOpen = idx >= last || (idx === last - 1 && t > 0.85);
      maskAll.setAttribute("fill", allOpen ? "#fff" : "#000");
      walkedKm = here;
      updatePins();
      const m = mi(here).toFixed(1);
      if (m !== lastMi) {
        lastMi = m;
        miEl.textContent = m;
        profile.setAttribute("aria-valuenow", m);
        let place = WALK_PLACES[0].n;
        for (const p of WALK_PLACES) if (p.km <= here + 0.35) place = p.n;
        if (whereEl.textContent !== place) whereEl.textContent = place;
        let ele = Math.round(eleAt(Math.min(here, 36)));
        for (const s of STOPS) if (s.kind === "q" && Math.abs(s.km - here) < 0.2) ele = s.ele;
        heightEl.textContent = `miles walked · ${here.toFixed(1)} km · ${ele} m up`;
      }
      const px = Math.min(here, 36) * 10;
      clipR.setAttribute("width", String(px));
      pline.setAttribute("x1", String(px));
      pline.setAttribute("x2", String(px));
      thumb.style.left = `${((px / 361) * 100).toFixed(2)}%`;
      let pi = -1;
      ringKm.forEach((k, i) => here >= k - 0.05 && (pi = i));
      if (pi !== lastPin) {
        if (pi > lastPin && pi >= 0 && !RM)
          rings[pi].animate([{ r: "8px", opacity: 1 }, { r: "30px", opacity: 0 }], { duration: 1100, easing: "ease-out" });
        lastPin = pi;
      }
    };

    let queued = false;
    let onScreen = false;
    const frame = () => {
      queued = false;
      walk();
    };
    const req = () => {
      if (onScreen && !queued) {
        queued = true;
        requestAnimationFrame(frame);
      }
    };

    // phones: the card opens where it stands, the map dims behind it
    function setOpen(v: boolean) {
      open = v;
      sec!.classList.toggle("card-open", v);
      if (shown >= 0) stopEls[shown].classList.toggle("open", v);
      req();
    }

    // phones: glide the walker to a km, then call back
    let tween = 0;
    const go = (to: number, then?: () => void) => {
      cancelAnimationFrame(tween);
      const from = km;
      const dur = RM ? 0 : clamp(Math.abs(to - from) * 300, 500, 2200);
      const t0 = performance.now();
      const step = (now: number) => {
        const t = dur ? clamp((now - t0) / dur, 0, 1) : 1;
        km = lerp(from, to, easeIO(t));
        walk();
        if (t < 1) tween = requestAnimationFrame(step);
        else then?.();
      };
      tween = requestAnimationFrame(step);
    };

    // "Start walking": stop to stop on its own, pausing at each; any touch takes over
    let playing = false;
    let dwell = 0;
    const setPlaying = (v: boolean) => {
      playing = v;
      clearTimeout(dwell);
      sec.classList.toggle("playing", v);
      next.setAttribute("aria-label", v ? "Pause the walk" : "Walk on to the next stop");
      if (!v) cancelAnimationFrame(tween);
    };
    const onward = () => {
      const n = KMS.findIndex((k) => k > km + 0.05);
      if (!playing || n < 0) return setPlaying(false);
      go(KMS[n], () => {
        if (n === last) return setPlaying(false);
        dwell = window.setTimeout(onward, STOPS[n].kind === "q" ? 4200 : 3000);
      });
    };
    const takeOver = () => playing && setPlaying(false);

    const stepTo = (dir: 1 | -1) => {
      const n = dir > 0 ? KMS.findIndex((k) => k > km + 0.05) : KMS.findLastIndex((k) => k < km - 0.05);
      if (n >= 0) go(KMS[n]);
    };
    const nearest = () => KMS.reduce((b, k, i) => (Math.abs(k - km) < Math.abs(KMS[b] - km) ? i : b), 0);

    // only follow the scroll while the walk is anywhere near the screen
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (!onScreen) takeOver();
        req();
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(sec);
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req);
    narrowQ.addEventListener("change", req);

    const behavior: ScrollBehavior = RM ? "auto" : "smooth";
    const toCard = (card: HTMLElement) => {
      if (narrowQ.matches) {
        takeOver();
        go(KMS[stopEls.indexOf(card)]);
      } else scrollTo({ top: card.getBoundingClientRect().top + scrollY - innerHeight * 0.3, behavior });
    };
    // a pin or a town ring on the map jumps to its card (the cards are the keyboard route);
    // on phones, a tap on the dimmed map closes an open card
    const onPin = (e: MouseEvent) => {
      if (open) return setOpen(false);
      const id = (e.target as Element).closest<SVGElement>("[data-stop]")?.dataset.stop;
      const card = id && document.getElementById(id);
      if (card) toCard(card);
    };
    const onPrev = () => {
      takeOver();
      stepTo(-1);
    };
    const onNext = () => {
      if (playing) return setPlaying(false);
      setOpen(false);
      stepTo(1);
    };
    // the buttons inside the cards: open, close, start walking
    const onCard = (e: MouseEvent) => {
      const b = (e.target as Element).closest("button");
      if (!b) return;
      if (b.classList.contains("tw-open")) {
        takeOver();
        setOpen(true);
      } else if (b.classList.contains("tw-close")) setOpen(false);
      else if (b.classList.contains("tw-go")) {
        setPlaying(true);
        onward();
      }
    };

    // phones: the height strip is a slider: drag along the hills, let go at the nearest stop
    const kmAtX = (x: number) => {
      const r = profile.querySelector("svg")!.getBoundingClientRect();
      return clamp(((x - r.left) / r.width) * 36.1, 0, KMS[last]);
    };
    let dragging = false;
    const onDown = (e: PointerEvent) => {
      if (!narrowQ.matches) return;
      takeOver();
      setOpen(false);
      cancelAnimationFrame(tween);
      dragging = true;
      profile.setPointerCapture(e.pointerId);
      sec.classList.add("dragging");
      km = kmAtX(e.clientX);
      req();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      km = kmAtX(e.clientX);
      req();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      sec.classList.remove("dragging");
      go(KMS[nearest()]);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!narrowQ.matches) return;
      const k = e.key;
      if (k === "ArrowRight" || k === "ArrowUp") stepTo(1);
      else if (k === "ArrowLeft" || k === "ArrowDown") stepTo(-1);
      else if (k === "Home") go(0);
      else if (k === "End") go(KMS[last]);
      else return;
      e.preventDefault();
      takeOver();
    };
    // phones: a sideways swipe across the map walks a stop on or back
    let sx0 = 0;
    let sy0 = 0;
    const onSwipeStart = (e: PointerEvent) => {
      sx0 = e.clientX;
      sy0 = e.clientY;
    };
    const onSwipeEnd = (e: PointerEvent) => {
      const dx = e.clientX - sx0;
      if (!narrowQ.matches || Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(e.clientY - sy0) * 1.6) return;
      takeOver();
      setOpen(false);
      stepTo(dx < 0 ? 1 : -1);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && open && setOpen(false);

    map.addEventListener("click", onPin);
    prev.addEventListener("click", onPrev);
    next.addEventListener("click", onNext);
    rail.addEventListener("click", onCard);
    profile.addEventListener("pointerdown", onDown);
    profile.addEventListener("pointermove", onMove);
    profile.addEventListener("pointerup", onUp);
    profile.addEventListener("pointercancel", onUp);
    profile.addEventListener("keydown", onKey);
    box.addEventListener("pointerdown", onSwipeStart);
    box.addEventListener("pointerup", onSwipeEnd);
    sec.addEventListener("keydown", onEsc);
    walk();

    return () => {
      io.disconnect();
      setPlaying(false);
      removeEventListener("scroll", req);
      removeEventListener("resize", req);
      narrowQ.removeEventListener("change", req);
      map.removeEventListener("click", onPin);
      prev.removeEventListener("click", onPrev);
      next.removeEventListener("click", onNext);
      rail.removeEventListener("click", onCard);
      profile.removeEventListener("pointerdown", onDown);
      profile.removeEventListener("pointermove", onMove);
      profile.removeEventListener("pointerup", onUp);
      profile.removeEventListener("pointercancel", onUp);
      profile.removeEventListener("keydown", onKey);
      box.removeEventListener("pointerdown", onSwipeStart);
      box.removeEventListener("pointerup", onSwipeEnd);
      sec.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <section className="tw" id="walk" aria-labelledby="h-walk" ref={root}>
      <div className="wrap tw-head">
        <h2 id="h-walk">{heading}</h2>
        <p>
          Drawn from the real route. Walk it below and the TrailTap layer opens wherever you&rsquo;ve been: the
          questions waiting at the posts, and the towns for food, shops and toilets.
        </p>
        <p className="tw-key" aria-hidden="true">
          {KEY}
        </p>
      </div>
      <div className="tw-body">
        <div className="tw-col">
          <div className="tw-sticky">
            <div className="tw-box">
              <svg
                className="tw-map"
                viewBox="0 150 600 560"
                role="img"
                aria-label="Map of the Cotswold Way from Chipping Campden to Cleeve Hill, with the part you've scrolled through highlighted"
              >
                <defs>
                  <mask id="tw-reveal" maskUnits="userSpaceOnUse" x="-200" y="0" width="1000" height="1000">
                    <rect id="tw-mask-all" x="-200" y="0" width="1000" height="1000" fill="#000" />
                    <polyline id="tw-walked" fill="none" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" points="" />
                  </mask>
                </defs>
                <g stroke="#ebe4d2" strokeWidth=".8">
                  {GRID_X.map((x) => (
                    <line key={x} x1={x.toFixed(1)} y1="-200" x2={x.toFixed(1)} y2="1000" />
                  ))}
                  {GRID_Y.map((y) => (
                    <line key={y} x1="-200" y1={y.toFixed(1)} x2="800" y2={y.toFixed(1)} />
                  ))}
                </g>
                <polyline points={ROUTE_PTS} fill="none" stroke="#fbf8ef" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={ROUTE_PTS} fill="none" stroke="#8d8a7e" strokeWidth="1.8" strokeDasharray="2.5 4" strokeLinecap="round" />
                {WALK_PLACES.map((pl) => {
                  const [x, y] = at(pl.km);
                  return (
                    <g key={pl.n}>
                      {pl.big &&
                        SQUARES.map(([ox, oy], k) => (
                          <rect
                            key={k}
                            x={(x + ox - 1.8).toFixed(1)}
                            y={(y + oy - 1.8).toFixed(1)}
                            width="3.6"
                            height="3.6"
                            fill="#b9b19c"
                            transform={`rotate(${k * 23} ${(x + ox).toFixed(1)} ${(y + oy).toFixed(1)})`}
                          />
                        ))}
                      <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={pl.big ? 3.6 : 2.6} fill="#1d3024" />
                    </g>
                  );
                })}
                <g mask="url(#tw-reveal)">
                  <polyline points={ROUTE_PTS} fill="none" stroke="#9a3412" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
                  {WALK_PLACES.filter((p) => p.near).map((pl) => {
                    const [x, y] = at(pl.km);
                    const town = WALK_TOWNS.find((t) => t.where === pl.n);
                    return (
                      <circle
                        key={pl.n}
                        className={town ? "tw-pin" : undefined}
                        data-stop={town ? stopId(town.where) : undefined}
                        data-km={town ? pl.km : undefined}
                        cx={x.toFixed(1)}
                        cy={y.toFixed(1)}
                        r="7"
                        fill="#fbf8ef"
                        fillOpacity="0"
                        stroke="#9a3412"
                        strokeWidth="2.2"
                      />
                    );
                  })}
                  {QUESTIONS.map((q) => {
                    const [x, y] = at(q.km);
                    return (
                      <g key={q.where} className="tw-pin" data-stop={stopId(q.where)} data-km={q.km}>
                        <circle className="tw-ring" data-km={q.km} cx={x.toFixed(1)} cy={y.toFixed(1)} r="8" fill="none" stroke="#9a3412" strokeWidth="2" opacity="0" />
                        <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="8" fill="#9a3412" stroke="#f3eee2" strokeWidth="2" />
                        <text x={x.toFixed(1)} y={(y + 3.8).toFixed(1)} textAnchor="middle" className="tw-qmark">
                          ?
                        </text>
                      </g>
                    );
                  })}
                </g>
                <g className="tw-labels">
                  {WALK_PLACES.map((pl, i) => (
                    <text
                      key={pl.n}
                      x={pl.lx}
                      y={pl.ly}
                      textAnchor={pl.a}
                      className={[pl.big && "big", (i === 0 || i === WALK_PLACES.length - 1) && "ends"].filter(Boolean).join(" ") || undefined}
                    >
                      {pl.n}
                    </text>
                  ))}
                </g>
                <g className="tw-walker" transform={`translate(${WALK_ROUTE[0][0]} ${WALK_ROUTE[0][1]})`}>
                  <circle className="halo" r="16" fill="#9a3412" opacity=".18" />
                  <circle r="7.5" fill="#9a3412" stroke="#f3eee2" strokeWidth="2.6" />
                </g>
              </svg>
              <div className="tw-hud">
                <span className="tw-mi">0.0</span>
                <span className="tw-m">
                  <b className="tw-where">Chipping Campden</b>
                  <span className="tw-height">miles walked · {Math.round(eleAt(0))} m up</span>
                </span>
              </div>
              <div className="tw-legend" aria-hidden="true">
                {KEY}
              </div>
              <div className="tw-profile" aria-label="How far along the walk you are" aria-valuemin={0} aria-valuemax={Number(mi(KM_END).toFixed(1))} aria-valuenow={0}>
                <svg viewBox="0 0 361 60" preserveAspectRatio="none" aria-hidden="true">
                  <clipPath id="tw-pclip">
                    <rect id="tw-pclip-r" x="0" y="0" width="0" height="60" />
                  </clipPath>
                  <path d={PROFILE_AREA} fill="#e9e1cc" />
                  <path d={PROFILE_AREA} fill="#efc6ad" clipPath="url(#tw-pclip)" />
                  <path d={PROFILE_LINE} fill="none" stroke="#8d8a7e" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                  <path d={PROFILE_LINE} fill="none" stroke="#9a3412" strokeWidth="2" clipPath="url(#tw-pclip)" vectorEffect="non-scaling-stroke" />
                  <line className="tw-pline" x1="0" y1="0" x2="0" y2="60" stroke="#1d3024" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="tw-ticks" aria-hidden="true">
                  {STOPS.map((s) => (
                    <i key={s.where} className={s.kind} style={{ left: `${((Math.min(s.km, 36) * 1000) / 361).toFixed(2)}%` }} />
                  ))}
                  <span className="tw-thumb" />
                </span>
              </div>
            </div>
          </div>
        </div>
        <ol className="tw-stops">
          {STOPS.map((s, i) => (
            <li className="tw-stop" key={s.where} id={stopId(s.where)}>
              {s.kind === "q" ? (
                <article className="tw-card">
                  <button type="button" className="tw-close" aria-label="Close the answer">
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  <Image src={s.photo} alt={s.alt} width={720} height={405} sizes="(max-width: 900px) 100vw, 460px" />
                  <div className="cb">
                    <p className="ck">
                      <span className="q" aria-hidden="true">
                        ?
                      </span>
                      {s.where} · {s.ele} m up
                    </p>
                    <h3 className="cq">{s.question}</h3>
                    <button type="button" className="tw-open">
                      Show the answer
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                        <path d="M3.5 5.5 7 9l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <p className="ca">{s.answer}</p>
                    <p className={i === FIRST_Q ? "sealed-note" : "sealed-note again"}>
                      <PlateIcon />
                      {fullStory}
                    </p>
                  </div>
                </article>
              ) : s.kind === "town" ? (
                <article className="tw-card">
                  <div className="cb">
                    <p className="ck">
                      Mile {mi(s.km).toFixed(1)} · {s.where}
                    </p>
                    <h3>{s.heading}</h3>
                    <ul className="near" aria-label={`In ${s.where}`}>
                      {s.has.map((h) => (
                        <li key={h}>
                          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                            <g fill="none" stroke="#9a3412" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              {HAS[h].icon}
                            </g>
                          </svg>
                          {HAS[h].label}
                        </li>
                      ))}
                    </ul>
                    {s.km === 0 && (
                      <p className="cf">
                        <span className="tw-wide">Scroll down to start walking. The map follows you.</span>
                        <span className="tw-narrow">
                          <button type="button" className="btn btn-primary tw-go">
                            Start walking
                          </button>
                          or drag along the hills below.
                        </span>
                      </p>
                    )}
                  </div>
                </article>
              ) : (
                <article className="tw-card">
                  <div className="cb">
                    <p className="ck">
                      Mile {mi(KM_END).toFixed(1)} · {s.where}
                    </p>
                    <h3>The end of the first stretch</h3>
                    <p className="cf">{endText}</p>
                    <a className="btn btn-primary end-cta" href="#paper">
                      {endCta} <Arrow />
                    </a>
                  </div>
                </article>
              )}
            </li>
          ))}
        </ol>
        <div className="tw-nav">
          <button type="button" className="tw-prev" aria-label="Back one stop" disabled>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="tw-next" aria-label="Walk on to the next stop">
            <svg className="go" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="hold" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M7 5v10M13 5v10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
