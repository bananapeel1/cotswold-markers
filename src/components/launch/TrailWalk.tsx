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
 * revealed wherever it has been, and the miles and height count along. The
 * map, stops and route are all on the page without script; the script only
 * moves the camera and the walker.
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
const GRID_Y = Array.from({ length: 40 }, (_, i) => 233.2 - 30.63 * 7 + i * 30.63);
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

const PlateIcon = () => (
  <svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true">
    <rect x="1.5" y="1.5" width="19" height="25" rx="4" fill="#f3eee2" stroke="#1d3024" strokeWidth="1.6" />
    <circle cx="11" cy="10" r="5" fill="none" stroke="#1d3024" strokeWidth="1.4" />
    <circle cx="11" cy="10" r="1.8" fill="#9a3412" />
    <rect x="7" y="17.5" width="8" height="6" rx="1" fill="#1d3024" opacity=".75" />
  </svg>
);

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
    const walked = $<SVGPolylineElement>("#tw-walked");
    const maskAll = $<SVGRectElement>("#tw-mask-all");
    const walker = $<SVGGElement>(".tw-walker");
    const lens = $<SVGCircleElement>("#tw-lens");
    const lensRing = $<SVGCircleElement>(".tw-lens-ring");
    const miEl = $(".tw-mi");
    const whereEl = $(".tw-where");
    const heightEl = $(".tw-height");
    const clipR = $<SVGRectElement>("#tw-pclip-r");
    const pline = $<SVGLineElement>(".tw-pline");
    const stopEls = [...sec.querySelectorAll<HTMLElement>(".tw-stop")];
    const rings = [...sec.querySelectorAll<SVGCircleElement>(".tw-ring")];
    const ringKm = rings.map((r) => Number(r.dataset.km));
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    sec.classList.add("live");

    // pins answer clicks only once they're drawn: walked past, or under the lens
    const pins = [...sec.querySelectorAll<SVGElement>(".tw-pin")].map((el) => {
      const c = el instanceof SVGCircleElement ? el : el.querySelector("circle")!;
      return { el, km: Number(el.dataset.km), x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")) };
    });
    let upp = 1; // map units per screen pixel
    let walkedKm = 0;
    let allOpen = false;
    const lensAt = { x: 0, y: 0, r: 0 };
    const updatePins = () => {
      for (const p of pins) {
        const on = allOpen || p.km <= walkedKm + 0.2 || Math.hypot(p.x - lensAt.x, p.y - lensAt.y) < lensAt.r;
        p.el.classList.toggle("on", on);
      }
    };

    const camera = (km: number, zf: number) => {
      // zoom 1 frames the whole stretch, labels included, clear of the readout and the profile;
      // closer zooms follow the walker
      const narrow = narrowQ.matches;
      const bw = box.clientWidth;
      const bh = box.clientHeight;
      if (!bw || !bh) return;
      const a = bw / bh;
      const padT = (narrow ? 80 : 92) / bh;
      const padB = (narrow ? 124 : 92) / bh; // on phones the legend sits above the profile
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
      const y = clamp(c[1] - vh * 0.5, fy, fy + vhFit - vh);
      map.setAttribute("viewBox", `${x.toFixed(1)} ${y.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
      // map units per screen pixel: the labels use it to stay readable at every zoom
      upp = vw / bw;
      map.style.setProperty("--u", upp.toFixed(3));
    };

    let lastStop = -1;
    let lastPin = -1;
    let lastMi = "";
    const walk = () => {
      const narrow = narrowQ.matches;
      const mid = innerHeight * (narrow ? 0.78 : 0.5);
      const cs = stopEls.map((s) => {
        const r = s.firstElementChild!.getBoundingClientRect();
        return r.top + Math.min(r.height, innerHeight * 0.5) / 2;
      });
      let idx = 0;
      let t = 0;
      if (mid >= cs[cs.length - 1]) idx = cs.length - 1;
      else if (mid > cs[0])
        for (let i = 0; i < cs.length - 1; i++)
          if (mid >= cs[i] && mid < cs[i + 1]) {
            idx = i;
            t = (mid - cs[i]) / (cs[i + 1] - cs[i]);
            break;
          }
      const last = STOPS.length - 1;
      const km = lerp(STOPS[idx].km, STOPS[Math.min(idx + 1, last)].km, easeIO(clamp(t, 0, 1)));
      const active = Math.min(t > 0.5 ? idx + 1 : idx, last);
      if (active !== lastStop) {
        stopEls.forEach((s, i) => s.classList.toggle("active", i === active));
        lastStop = active;
      }
      const zoomMax = narrow ? 2.05 : 1.7;
      let zf = RM ? 1 : zoomMax;
      if (!RM && idx === last - 1) zf = lerp(zoomMax, 1, easeIO(clamp((t - 0.15) / 0.85, 0, 1)));
      if (idx >= last) zf = 1;
      camera(km, zf);
      const w = at(km);
      walker.setAttribute("transform", `translate(${w[0].toFixed(1)} ${w[1].toFixed(1)})`);
      const pts: string[] = [];
      for (let i = 0; i < w[2] && i < WALK_ROUTE.length; i++) pts.push(`${WALK_ROUTE[i][0]},${WALK_ROUTE[i][1]}`);
      pts.push(`${w[0].toFixed(1)},${w[1].toFixed(1)}`);
      walked.setAttribute("points", pts.join(" "));
      allOpen = idx >= last || (idx === last - 1 && t > 0.85);
      maskAll.setAttribute("fill", allOpen ? "#fff" : "#000");
      walkedKm = km;
      // the camera moved under a still mouse: keep the lens under the pointer
      placeLens();
      const m = mi(km).toFixed(1);
      if (m !== lastMi) {
        lastMi = m;
        miEl.textContent = m;
        let place = WALK_PLACES[0].n;
        for (const p of WALK_PLACES) if (p.km <= km + 0.35) place = p.n;
        if (whereEl.textContent !== place) whereEl.textContent = place;
        let ele = Math.round(eleAt(Math.min(km, 36)));
        for (const s of STOPS) if (s.kind === "q" && Math.abs(s.km - km) < 0.2) ele = s.ele;
        heightEl.textContent = `miles walked · ${km.toFixed(1)} km · ${ele} m up`;
      }
      const px = Math.min(km, 36) * 10;
      clipR.setAttribute("width", String(px));
      pline.setAttribute("x1", String(px));
      pline.setAttribute("x2", String(px));
      let pi = -1;
      ringKm.forEach((k, i) => km >= k - 0.05 && (pi = i));
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
    // only follow the scroll while the walk is anywhere near the screen
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        req();
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(sec);
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req);
    narrowQ.addEventListener("change", req);

    // the lens: a mouse over the map opens the layer under it. It stays the same size on screen at every zoom,
    // follows the pointer through scrolling, and grows and shrinks rather than blinking on and off.
    const LENS_PX = 64;
    let pointer: { x: number; y: number } | null = null;
    let grow = 0; // 0 closed, 1 open
    let lensQueued = false;
    const placeLens = () => {
      const m = map.getScreenCTM();
      if (pointer && m) {
        const p = new DOMPoint(pointer.x, pointer.y).matrixTransform(m.inverse());
        lensAt.x = p.x;
        lensAt.y = p.y;
      }
      lensAt.r = grow * LENS_PX * upp;
      for (const c of [lens, lensRing]) {
        c.setAttribute("cx", lensAt.x.toFixed(1));
        c.setAttribute("cy", lensAt.y.toFixed(1));
        c.setAttribute("r", lensAt.r.toFixed(1));
      }
      updatePins();
    };
    const lensFrame = () => {
      lensQueued = false;
      const target = pointer ? 1 : 0;
      grow = RM ? target : grow + (target - grow) * 0.28;
      if (Math.abs(target - grow) < 0.01) grow = target;
      placeLens();
      if (grow !== target) lensTick();
    };
    const lensTick = () => {
      if (!lensQueued) {
        lensQueued = true;
        requestAnimationFrame(lensFrame);
      }
    };
    // listen on the whole box, so crossing the readout or the legend doesn't close the lens
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      lensTick();
    };
    const onLeave = () => {
      pointer = null;
      lensTick();
    };
    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerleave", onLeave);
    // a pin or a town ring on the map jumps to its card (the cards are the keyboard route)
    const onPin = (e: MouseEvent) => {
      const id = (e.target as Element).closest<SVGElement>("[data-stop]")?.dataset.stop;
      const card = id && document.getElementById(id);
      if (!card) return;
      const narrow = narrowQ.matches;
      const y = card.getBoundingClientRect().top + scrollY - (narrow ? innerHeight * 0.62 : innerHeight * 0.3);
      scrollTo({ top: y, behavior: RM ? "auto" : "smooth" });
    };
    map.addEventListener("click", onPin);
    walk();

    return () => {
      io.disconnect();
      removeEventListener("scroll", req);
      removeEventListener("resize", req);
      narrowQ.removeEventListener("change", req);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
      map.removeEventListener("click", onPin);
    };
  }, []);

  return (
    <section className="tw" id="walk" aria-labelledby="h-walk" ref={root}>
      <div className="wrap tw-head">
        <h2 id="h-walk">{heading}</h2>
        <p>
          Drawn from the real route. Scroll and the TrailTap layer opens wherever you&rsquo;ve walked: the questions
          waiting at the posts, and the towns for food, shops and toilets.
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
                    <circle id="tw-lens" cx="-500" cy="-500" r="0" fill="#fff" />
                  </mask>
                </defs>
                <g stroke="#ebe4d2" strokeWidth=".8">
                  {GRID_X.map((x) => (
                    <line key={x} x1={x.toFixed(1)} y1="0" x2={x.toFixed(1)} y2="1000" />
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
                  {WALK_PLACES.map((pl) => (
                    <text key={pl.n} x={pl.lx} y={pl.ly} textAnchor={pl.a} className={pl.big ? "big" : undefined}>
                      {pl.n}
                    </text>
                  ))}
                </g>
                <circle className="tw-lens-ring" cx="-500" cy="-500" r="0" fill="none" stroke="#1d3024" strokeWidth="1.2" strokeDasharray="3 3" />
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
              </div>
              <div className="tw-profile">
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
              </div>
            </div>
          </div>
        </div>
        <ol className="tw-stops">
          {STOPS.map((s) => (
            <li className="tw-stop" key={s.where} id={stopId(s.where)}>
              {s.kind === "q" ? (
                <article className="tw-card">
                  <Image src={s.photo} alt={s.alt} width={720} height={405} sizes="(max-width: 900px) 100vw, 460px" />
                  <div className="cb">
                    <p className="ck">
                      <span className="q" aria-hidden="true">
                        ?
                      </span>
                      {s.where} · {s.ele} m up
                    </p>
                    <h3 className="cq">{s.question}</h3>
                    <p className="ca">{s.answer}</p>
                    <p className="sealed-note">
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
                    {s.km === 0 && <p className="cf">Scroll down to start walking. The map follows you.</p>}
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
      </div>
    </section>
  );
}
