"use client";

import { useEffect, useRef } from "react";
import { DEMO_PAGE, DEMO_PHOTO } from "@/content/launch";
import Arrow from "./Arrow";
import { Icon } from "./mpIcons";

/**
 * The hero: a waymark post on the edge of the Cotswolds, looking west over
 * the vale, with a TrailTap plate screwed to it. Tap the plate (or wait) and
 * a phone touches it, the hidden layer opens out across the view, and the
 * phone shows the real marker page for Broadway Tower.
 *
 * The landscape is drawn on the server from a fixed seed, so it's the same on
 * every visit and costs no script. The script only places things and moves
 * them; with reduced motion it shows the opened state straight away.
 */

/* ---------- the landscape, drawn once ---------- */

let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const f1 = (n: number) => n.toFixed(1);

type Shape = { d?: string; fill?: string; line?: [number, number, number, number]; sw?: number; op?: number; c?: [number, number, number] };

function drawVale(): Shape[] {
  // fields in true perspective: boundaries converge on a point just above the horizon
  const cols = ["#b7c396", "#c4cca2", "#adbb8c", "#cbd0a3", "#bfc893", "#d5cf9f", "#b3c18f", "#c8cd9e", "#a9b889"];
  const VX = 760;
  const VY = 548;
  const rows = [574, 579, 585, 592, 601, 612, 626, 644, 667, 698, 734];
  const px = (u: number, y: number) => VX + u * (y - VY);
  const out: Shape[] = [];
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r];
    const y1 = rows[r + 1];
    const d = r / (rows.length - 1);
    let u = -40 - rnd() * 4;
    while (px(u, y0) < 1700) {
      const w = 1.2 + rnd() * 3.4;
      const ua = u;
      const ub = u + w;
      out.push({
        d: `M${f1(px(ua, y0))} ${y0} L${f1(px(ub, y0))} ${y0} L${f1(px(ub, y1))} ${y1} L${f1(px(ua, y1))} ${y1}Z`,
        fill: cols[Math.floor(rnd() * cols.length)],
      });
      if (rnd() < 0.6) out.push({ line: [px(ua, y0), y0, px(ua, y1), y1], sw: 0.5 + d * 1.8, op: 0.8 });
      if (rnd() < 0.35) {
        const tu = ua + rnd() * w;
        const ty = y0 + (y1 - y0) * rnd() * 0.3;
        out.push({ c: [px(tu, ty), ty, 1 + d * 5 + rnd() * 1.5] });
      }
      u = ub;
    }
    out.push({ line: [-100, y0, 1700, y0], sw: 0.6 + d * 2.2, op: 0.85 });
  }
  return out;
}
const VALE = drawVale();
const TREES: [number, number, number][] = [
  [90, 712, 1.1], [160, 706, 1.4], [230, 712, 0.9], [1440, 682, 1.3], [1510, 676, 1.6], [1575, 680, 1.1], [640, 698, 0.7],
];
const SHEEP: [number, number][] = [
  [300, 770], [340, 778], [420, 762], [560, 790], [1290, 752], [1340, 760], [1380, 748], [470, 808],
];
const GRASS = Array.from({ length: 140 }, () => {
  const gx = rnd() * 1600;
  const gy = 870 + rnd() * 130;
  const h = 6 + rnd() * 12;
  return { d: `M${gx.toFixed(0)} ${gy.toFixed(0)} l${(rnd() * 6 - 3).toFixed(1)} ${(-h).toFixed(1)}`, c: rnd() < 0.5 ? "#5f7d48" : "#93ac74" };
});
const GRID_X = Array.from({ length: 21 }, (_, i) => -1600 + i * 240);

/* the plate sits on the post's face; the wipe opens from its middle */
const PLATE = { x: 1056, y: 596, w: 84, h: 117 };
const WX = 1098;
const WY = 654;

/** Labels the layer adds to the view. `a` is the anchor in the drawing; `an` a nearer one for narrow screens. */
const TAGS = [
  { a: [1098, 404], k: "You are here", v: `${DEMO_PAGE.name} · 312 m`, wide: true, left: true },
  { a: [636, 640], an: [720, 702], k: "Ahead", v: `${DEMO_PAGE.next[1].name} · ${DEMO_PAGE.next[1].mi.replace(" ", "\u00a0")}` },
  { a: [900, 905], k: DEMO_PAGE.discovery[2].ask, v: `Water tap · ${DEMO_PAGE.discovery[2].dist.toLowerCase()}` },
  { a: [772, 531], k: "On the skyline", v: "Bredon Hill" },
] as const;

/** The real marker page, drawn at a phone's 390 px width and scaled down to fit the screen. */
function MarkerPage({ clock }: { clock: string }) {
  return (
    <div className="mp">
      <div className="mp-status">
        <b>{clock}</b>
        <span aria-hidden="true">
          <svg width="18" height="11" viewBox="0 0 18 11">
            <rect x="0" y="7" width="3" height="4" rx="1" />
            <rect x="5" y="5" width="3" height="6" rx="1" />
            <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
            <rect x="15" y="0" width="3" height="11" rx="1" />
          </svg>
          <svg width="26" height="12" viewBox="0 0 26 12">
            <rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4" />
            <rect x="2" y="2" width="15" height="8" rx="2" />
            <rect x="23.5" y="4" width="2" height="4" rx="1" opacity=".4" />
          </svg>
        </span>
      </div>
      <header className="mp-nav">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/launch/logo-64.png" alt="" width={32} height={32} loading="lazy" />
        <b>TrailTap</b>
        <svg className="mp-menu" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </header>
      <div className="mp-scroll">
        <section className="mp-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mp-photo" src={DEMO_PHOTO.src} alt="" width={358} height={201} decoding="async" loading="lazy" />
          <p className="mp-loc">
            <Icon i="pin" size={18} />
            Current location
          </p>
          <h4>{DEMO_PAGE.name}</h4>
          <p className="mp-credit">{DEMO_PAGE.credit}</p>
        </section>
        <section className="mp-map">
          <svg viewBox="0 0 358 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="358" height="160" fill="#cfe5bd" />
            <path d="M0 96C40 80 70 100 104 88S150 40 196 52 262 110 358 92V160H0Z" fill="#b7d9a0" />
            <path d="M30 0C46 30 60 60 52 100S70 150 64 160H40C46 120 28 90 30 60S14 20 10 0Z" fill="#9ccb83" />
            <path d="M250 0c10 26 6 50 24 70s50 26 84 30v-30c-30-4-50-14-62-34S280 10 278 0Z" fill="#a6d18e" />
            <path d="M232 0C236 40 214 90 214 160" fill="none" stroke="#fff" strokeWidth="9" />
            <path d="M232 0C236 40 214 90 214 160" fill="none" stroke="#e8e2d2" strokeWidth="1" />
            <path d="M358 18C320 40 290 60 262 80" fill="none" stroke="#f3c88a" strokeWidth="6" />
            <path d="M84 0C120 34 150 60 186 92" fill="none" stroke="#7c5a3a" strokeWidth="3.5" />
            <path d="M186 92c4 18 6 40 4 68" fill="none" stroke="#7c5a3a" strokeWidth="2" strokeDasharray="4 3" />
            <text x="200" y="12" textAnchor="middle" fill="#3a4a38" style={{ font: "500 11px var(--f-body)" }}>
              Armley Bank
            </text>
            <text x="270" y="64" fill="#556450" transform="rotate(-36 270 64)" style={{ font: "500 10px var(--f-body)" }}>
              Buckle St
            </text>
            <text x="188" y="114" textAnchor="middle" fill="#3a4a38" style={{ font: "500 11px var(--f-body)" }}>
              Broadway Tower
            </text>
          </svg>
          <span className="mp-here">
            <i />
            <b>You are here</b>
          </span>
        </section>
        <section className="mp-next">
          <h5>
            <Icon i="route" />
            What&rsquo;s Next
          </h5>
          <ol>
            {DEMO_PAGE.next.map((n) => (
              <li key={n.name} className={"here" in n ? "here" : undefined}>
                <b>{n.name}</b>
                {"here" in n ? (
                  <span>{n.detail}</span>
                ) : (
                  <span>
                    {n.mi} <em>{n.time}</em> <i>{n.drop}</i>
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mp-full">
            <Icon i="map" size={16} />
            View full trail map
          </p>
        </section>
        <section className="mp-disc">
          <div className="mp-disc-h">
            <h5>Discovery</h5>
            <span>
              <Icon i="cloud" size={12} fill="none" />
              {DEMO_PAGE.weather}
            </span>
          </div>
          <div className="mp-grid">
            {DEMO_PAGE.discovery.map((d) => (
              <div key={d.ask} style={{ borderLeftColor: d.tint }}>
                <span className="mp-ic" style={{ background: d.bg, color: d.ink }}>
                  <Icon i={d.icon} size={18} />
                </span>
                <b>{d.ask}</b>
                <span className="mp-what">{d.what}</span>
                <span className="mp-dist">
                  <Icon i="near" size={13} fill="none" />
                  {d.dist}
                </span>
              </div>
            ))}
          </div>
          <div className="mp-wc">
            <Icon i="wc" size={20} />
            <span>
              <b>{DEMO_PAGE.toilets.name}</b>
              <small>{DEMO_PAGE.toilets.hours}</small>
            </span>
            <span className="mp-dist">
              <Icon i="near" size={13} fill="none" />
              {DEMO_PAGE.toilets.dist}
            </span>
          </div>
        </section>
      </div>
      <span className="mp-fab mp-fab-a">
        <Icon i="person" size={22} fill="none" />
      </span>
      <span className="mp-fab mp-fab-b">
        <Icon i="map" size={22} fill="none" />
      </span>
    </div>
  );
}

export default function HiddenLayerHero({
  lede,
  steps,
  cta,
}: {
  lede: string;
  steps: string[];
  /** The page's main call to action, which leads to the sign-up. */
  cta: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = root.current;
    if (!stage) return;
    const $ = <T extends Element = HTMLElement>(s: string) => stage.querySelector<T>(s)!;
    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = $<SVGSVGElement>(".hl-scene");
    const phone = $(".hl-phone");
    const page = $(".mp-scroll");
    const waves = $(".hl-waves");
    const hit = $<HTMLButtonElement>(".hl-hit");
    const copy = $(".hl-copy");
    const wipe = $<SVGCircleElement>("#hl-wipe");
    const edge = $<SVGCircleElement>(".hl-edge");
    const plate = $<SVGRectElement>(".hl-plate-box");
    const status = $(".hl-status");
    const stepEls = [...stage.querySelectorAll<HTMLElement>(".hl-steps li")];
    const tags = [...stage.querySelectorAll<HTMLElement>(".hl-tag")];
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    type Pose = { x: number; y: number; r: number };

    let state: "idle" | "playing" | "revealed" = "idle";
    let narrow = false;
    let phScale = 1;
    let copyBottom = 0;
    const timers: number[] = [];
    const rafs = new Set<number>();
    const PW = 216;
    const PH = 444;

    const layout = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const a = w / h;
      narrow = a < 1.1;
      if (narrow) {
        // keep the post and the land below the copy, however tall the copy wraps
        const cb = copy.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + 18;
        copyBottom = cb;
        const H = Math.max(1200, (596 * h) / Math.max(120, h - cb));
        const W = H * a;
        scene.setAttribute("viewBox", `${f1(WX - W * 0.7)} ${f1(1000 - H)} ${f1(W)} ${f1(H)}`);
      } else scene.setAttribute("viewBox", "0 0 1600 1000");
      // on phones it also has to fit between the words and the bottom of the screen
      phScale = narrow ? Math.min(clamp(w / 520, 0.6, 0.8), Math.max(0.5, (h - copyBottom - 14) / PH)) : clamp(h / 900, 0.7, 1.04);
    };
    const pt = (x: number, y: number) => {
      const m = scene.getScreenCTM();
      const sr = stage.getBoundingClientRect();
      if (!m) return [0, 0];
      const p = new DOMPoint(x, y).matrixTransform(m);
      return [p.x - sr.left, p.y - sr.top];
    };
    const plateBox = () => {
      const r = plate.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height, cx: r.left - sr.left + r.width / 2, cy: r.top - sr.top + r.height / 2 };
    };
    const pose = (which: "rest" | "contact" | "settle"): Pose => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const pw = PW * phScale;
      const ph = PH * phScale;
      const pb = plateBox();
      // on phones it waits out of sight, so a corner of it doesn't crowd the plate
      if (which === "rest") return narrow ? { x: w - pw - 12, y: h + 24, r: -8 } : { x: w - pw * 0.9, y: h - ph * 0.38, r: -12 };
      if (which === "contact") return { x: pb.cx - pw * 0.5, y: pb.cy - ph * 0.36, r: -4 };
      if (narrow) return { x: w - pw - 12, y: clamp(pb.cy - ph * 0.5, copyBottom, h - ph - 14), r: 2 };
      return { x: Math.min(w - pw - 28, pb.x + pb.w + Math.max(40, w * 0.035)), y: clamp(pb.cy - ph * 0.66, 80, h - ph - 20), r: 3 };
    };
    const setPhone = (p: Pose) => {
      phone.style.transform = `translate(${f1(p.x)}px,${f1(p.y)}px) rotate(${p.r.toFixed(2)}deg) scale(${phScale})`;
    };
    const placeHit = () => {
      const pb = plateBox();
      // never smaller than a fingertip, however small the drawing gets
      const hw = Math.max(48, pb.w);
      const hh = Math.max(56, pb.h);
      Object.assign(hit.style, { left: `${pb.cx - hw / 2}px`, top: `${pb.cy - hh / 2}px`, width: `${hw}px`, height: `${hh}px` });
      Object.assign(waves.style, { left: `${pb.cx}px`, top: `${pb.cy}px` });
    };
    type Box = { l: number; r: number; t: number; b: number };
    const hits = (a: Box, b: Box) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
    const placeTags = () => {
      const w = stage.clientWidth;
      const ph = pose("settle");
      const avail = ph.x - 24;
      const sr = stage.getBoundingClientRect();
      const cr = copy.getBoundingClientRect();
      const copyBox = { l: cr.left - sr.left - 8, r: cr.right - sr.left + 8, t: cr.top - sr.top - 8, b: cr.bottom - sr.top + 8 };
      const phoneBox = { l: ph.x, r: ph.x + PW * phScale, t: ph.y, b: ph.y + PH * phScale };
      const placed: Box[] = [];
      tags.forEach((t, i) => {
        const def = TAGS[i];
        if (narrow && "wide" in def) {
          t.style.display = "none";
          return;
        }
        t.style.display = "";
        const [ax, ay] = narrow && "an" in def ? def.an : def.a;
        const p = pt(ax, ay);
        const lab = t.querySelector<HTMLElement>(".hl-lab")!;
        const stem = t.querySelector<HTMLElement>(".hl-stem")!;
        lab.style.maxWidth = narrow ? `${avail}px` : "";
        lab.style.whiteSpace = narrow ? "normal" : "";
        const lw = lab.offsetWidth;
        const lh = lab.offsetHeight;
        const sH = narrow ? 16 : 26;
        let lx: number;
        if (narrow) lx = 12 - p[0];
        else {
          lx = "left" in def ? 14 - lw : -14;
          if (p[0] + lx + lw > w - 12) lx = w - 12 - p[0] - lw;
          if (p[0] + lx < 12) lx = 12 - p[0];
        }
        const up = p[1] - sH - lh > 74;
        const ly = up ? -(sH + lh) : sH;
        if (!narrow) {
          // try a few spots; hide the label rather than let it cover the words or the phone
          let cands = [lx, 14 - lw, -14, copyBox.r - p[0] + 6];
          if (p[0] > copyBox.l && p[0] < copyBox.r && p[1] > copyBox.t && p[1] < copyBox.b) cands = [];
          let ok = false;
          for (const L of cands) {
            const b = { l: p[0] + L, r: p[0] + L + lw, t: p[1] + ly, b: p[1] + ly + lh };
            if (b.l < 8 || b.r > w - 8 || hits(b, copyBox) || hits(b, phoneBox) || placed.some((o) => hits(b, o))) continue;
            ok = true;
            lx = L;
            placed.push(b);
            break;
          }
          t.style.display = ok ? "" : "none";
          if (!ok) return;
        }
        lab.style.left = `${lx}px`;
        lab.style.top = `${ly}px`;
        stem.style.top = `${up ? -sH : 0}px`;
        stem.style.height = `${sH}px`;
        t.style.left = `${p[0].toFixed(0)}px`;
        t.style.top = `${p[1].toFixed(0)}px`;
      });
    };
    const setSteps = (n: number, now: number) =>
      stepEls.forEach((li, i) => {
        li.classList.toggle("on", i <= n);
        li.classList.toggle("now", i === now);
      });
    const tween = (ms: number, fn: (t: number) => void, done?: () => void) => {
      const t0 = performance.now();
      const f = (now: number) => {
        const t = clamp((now - t0) / ms, 0, 1);
        fn(t);
        if (t < 1) {
          const id = requestAnimationFrame((n) => {
            rafs.delete(id);
            f(n);
          });
          rafs.add(id);
        } else done?.();
      };
      f(t0);
    };
    const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), r: lerp(a.r, b.r, t) });
    const scrollPage = (to: number, ms: number) => {
      const from = Number(page.dataset.y || 0);
      if (RM || ms === 0) {
        page.style.transform = `translateY(${-to}px)`;
        page.dataset.y = String(to);
        return;
      }
      tween(ms, (t) => {
        const y = lerp(from, to, easeIO(t));
        page.style.transform = `translateY(${-y.toFixed(1)}px)`;
        page.dataset.y = String(y);
      });
    };
    const fullLayout = () => {
      layout();
      placeHit();
      // while it's playing, the tweens read the poses live each frame
      if (state !== "playing") setPhone(pose(state === "revealed" ? "settle" : "rest"));
      placeTags();
    };
    const revealNow = () => {
      state = "revealed";
      stage.classList.add("revealed", "tapped");
      stage.classList.remove("playing");
      setSteps(2, 2);
      wipe.setAttribute("r", "4000");
      edge.setAttribute("opacity", "0");
      setPhone(pose("settle"));
      placeTags();
      tags.forEach((t) => t.classList.add("on"));
    };
    const play = (e?: Event) => {
      if (state === "playing") return;
      timers.forEach(clearTimeout);
      status.textContent = "";
      if (RM) {
        revealNow();
        return;
      }
      const byUser = !!e?.isTrusted;
      state = "playing";
      stage.classList.add("playing");
      stage.classList.remove("revealed", "tapped");
      tags.forEach((t) => t.classList.remove("on"));
      wipe.setAttribute("r", "0");
      scrollPage(0, 0);
      setSteps(1, 1);
      tween(
        850,
        (t) => setPhone(lerpPose(pose("rest"), pose("contact"), easeIO(t))),
        () => {
          waves.classList.remove("go");
          void waves.offsetWidth;
          waves.classList.add("go");
          if (byUser && navigator.vibrate) {
            try {
              navigator.vibrate(18);
            } catch {}
          }
          stage.classList.add("tapped");
          setSteps(2, 2);
          timers.push(
            window.setTimeout(() => {
              tween(700, (t) => setPhone(lerpPose(pose("contact"), pose("settle"), easeIO(t))));
              const dist = TAGS.map((d) => Math.hypot(d.a[0] - WX, d.a[1] - WY));
              placeTags();
              tween(
                1500,
                (t) => {
                  const r = easeOut(t) * 2600;
                  wipe.setAttribute("r", r.toFixed(0));
                  edge.setAttribute("r", r.toFixed(0));
                  edge.setAttribute("opacity", ((1 - t) * 0.9).toFixed(2));
                  tags.forEach((tg, i) => r > dist[i] && tg.classList.add("on"));
                },
                () => {
                  state = "revealed";
                  stage.classList.remove("playing");
                  stage.classList.add("revealed");
                  placeTags();
                  // say what changed for screen readers, only when someone asked for it
                  if (byUser) status.textContent = "The plate opened the Broadway Tower page. It shows the next stops along the Way and what's nearby.";
                },
              );
              // once the view has opened, the phone scrolls down to what's nearby, as you would
              timers.push(window.setTimeout(() => scrollPage(610, 1700), 2600));
            }, 380),
          );
        },
      );
    };

    const onHit = (e: Event) => play(e);
    const onReplay = (e: Event) => {
      state = "idle";
      play(e);
    };
    hit.addEventListener("click", onHit);
    const tapBtn = $(".hl-try");
    const replay = $(".hl-replay");
    tapBtn.addEventListener("click", onHit);
    replay.addEventListener("click", onReplay);
    // give people time to read and tap it themselves before it plays on its own
    timers.push(window.setTimeout(() => state === "idle" && play(), 7500));
    const onScroll = () => {
      if (scrollY > 40 && state === "idle") play();
    };
    addEventListener("scroll", onScroll, { passive: true });

    // a gentle parallax for mouse pointers: the post stays put, the far land drifts
    const vale = $("#hl-vale");
    const trees = $("#hl-trees");
    const onMove = (e: PointerEvent) => {
      if (RM || e.pointerType !== "mouse" || narrow) return;
      const dx = e.clientX / innerWidth - 0.5;
      const dy = e.clientY / innerHeight - 0.5;
      vale.setAttribute("transform", `translate(${f1(dx * -10)} ${f1(dy * -3)})`);
      trees.setAttribute("transform", `translate(${f1(dx * -18)} 0)`);
    };
    stage.addEventListener("pointermove", onMove);

    let rz = 0;
    const onResize = () => {
      clearTimeout(rz);
      rz = window.setTimeout(fullLayout, 80);
    };
    addEventListener("resize", onResize);
    // the stage can change height without a resize (the phone's address bar), so watch it too
    const ro = new ResizeObserver(onResize);
    ro.observe(stage);

    phone.style.transition = "none";
    fullLayout();
    stage.classList.add("live");
    if (RM) {
      revealNow();
      scrollPage(610, 0);
    }
    document.fonts?.ready.then(fullLayout);

    return () => {
      timers.forEach(clearTimeout);
      rafs.forEach(cancelAnimationFrame);
      clearTimeout(rz);
      ro.disconnect();
      hit.removeEventListener("click", onHit);
      tapBtn.removeEventListener("click", onHit);
      replay.removeEventListener("click", onReplay);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      stage.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section className="hl" id="hero" aria-labelledby="h1">
      <div className="hl-stage" ref={root}>
        <svg className="hl-scene" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <defs>
            <linearGradient id="hl-sky" gradientUnits="userSpaceOnUse" x1="0" y1="-400" x2="0" y2="600">
              <stop offset="0" stopColor="#c9dbdc" />
              <stop offset=".55" stopColor="#e3e8df" />
              <stop offset=".88" stopColor="#f1ead6" />
              <stop offset="1" stopColor="#f4e3c0" />
            </linearGradient>
            <linearGradient id="hl-haze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f3e6c8" stopOpacity=".85" />
              <stop offset="1" stopColor="#f3e6c8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hl-wood" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7c6a52" />
              <stop offset=".45" stopColor="#94816a" />
              <stop offset="1" stopColor="#857258" />
            </linearGradient>
            <linearGradient id="hl-slope" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9db27f" />
              <stop offset="1" stopColor="#7d9862" />
            </linearGradient>
            <linearGradient id="hl-near" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#86a16a" />
              <stop offset="1" stopColor="#6b8a53" />
            </linearGradient>
            <clipPath id="hl-wipe-clip">
              <circle id="hl-wipe" cx={WX} cy={WY} r="0" />
            </clipPath>
            <clipPath id="hl-land">
              <path d="M0 568 L1600 568 L1600 1000 L0 1000Z" />
            </clipPath>
          </defs>
          <rect x="-400" y="-500" width="2400" height="1100" fill="url(#hl-sky)" />
          <g fill="#fbf8ef" opacity=".75">
            <g className="hl-cloud">
              <ellipse cx="300" cy="170" rx="120" ry="22" />
              <ellipse cx="360" cy="152" rx="70" ry="26" />
              <ellipse cx="250" cy="160" rx="50" ry="18" />
            </g>
            <g className="hl-cloud c2">
              <ellipse cx="1180" cy="250" rx="150" ry="20" />
              <ellipse cx="1240" cy="232" rx="80" ry="24" />
            </g>
            <g className="hl-cloud">
              <ellipse cx="820" cy="-80" rx="130" ry="22" />
              <ellipse cx="870" cy="-98" rx="60" ry="22" />
            </g>
          </g>
          {/* the skyline: Bredon Hill's dome, the Malverns beyond */}
          <path
            d="M880 570 C930 560 960 548 990 546 C1020 540 1036 526 1058 530 C1080 520 1100 514 1124 522 C1146 510 1166 512 1186 524 C1210 516 1236 520 1262 534 C1300 540 1360 548 1420 556 C1480 560 1540 564 1600 566 L1600 576 L880 576Z"
            fill="#b3bfb9"
          />
          <path d="M560 572 C610 566 650 548 700 538 C740 528 780 526 820 532 C866 540 900 556 950 568 L950 578 L560 578Z" fill="#a4b2a6" />
          <path d="M0 574 C200 568 420 572 600 570 L1600 572 L1600 586 L0 588Z" fill="#b9c3ad" />
          <g id="hl-vale">
            {VALE.map((s, i) =>
              s.d ? (
                <path key={i} d={s.d} fill={s.fill} />
              ) : s.line ? (
                <line
                  key={i}
                  x1={f1(s.line[0])}
                  y1={s.line[1]}
                  x2={f1(s.line[2])}
                  y2={s.line[3]}
                  stroke="#7f9163"
                  strokeWidth={s.sw!.toFixed(2)}
                  opacity={s.op}
                />
              ) : (
                <circle key={i} cx={f1(s.c![0])} cy={f1(s.c![1])} r={f1(s.c![2])} fill="#6a8155" />
              ),
            )}
          </g>
          <rect x="0" y="566" width="1600" height="60" fill="url(#hl-haze)" />
          {/* the escarpment we stand on */}
          <path d="M0 742 C260 700 560 690 820 696 C1060 702 1300 690 1600 676 L1600 1000 L0 1000Z" fill="url(#hl-slope)" />
          <g id="hl-trees">
            {TREES.map(([x, y, k]) => (
              <g key={x}>
                <rect x={x - 2 * k} y={y - 6 * k} width={4 * k} height={14 * k} fill="#5a4b36" />
                <ellipse cx={x} cy={y - 16 * k} rx={26 * k} ry={18 * k} fill="#5c7449" />
                <ellipse cx={x - 8 * k} cy={y - 22 * k} rx={14 * k} ry={11 * k} fill="#6c8556" />
              </g>
            ))}
          </g>
          <g>
            {SHEEP.map(([x, y], i) => {
              const k = 0.7 + (y - 740) / 90;
              return (
                <g key={x}>
                  <ellipse cx={x} cy={y} rx={9 * k} ry={5.5 * k} fill="#f6f3ea" />
                  <circle cx={x + (i % 2 ? -9 : 9) * k} cy={y - 1.5 * k} r={2.6 * k} fill="#3a3a34" />
                </g>
              );
            })}
          </g>
          <path d="M0 860 C380 820 820 830 1600 790 L1600 1000 L0 1000Z" fill="url(#hl-near)" />
          {/* the Way, worn into the grass, dropping off the edge towards the village */}
          <path
            d="M948 1000 C930 940 880 880 820 820 C780 780 740 730 706 694 L718 692 C760 728 810 776 858 818 C930 880 1000 940 1040 1000Z"
            fill="#e4d6ae"
          />
          <path d="M706 694 L718 692 C730 704 744 716 760 730" stroke="#d3c193" strokeWidth="2" fill="none" />
          <g strokeWidth="2" strokeLinecap="round">
            {GRASS.map((g, i) => (
              <path key={i} d={g.d} stroke={g.c} />
            ))}
          </g>
          {/* the post: square oak, a chamfered cap, the footpath disc, and our plate screwed on below it */}
          <ellipse cx="1110" cy="1000" rx="90" ry="12" fill="#5e7a48" opacity=".6" />
          <g>
            <path d="M1144 424 L1162 436 L1162 1010 L1144 1010Z" fill="#6b5a45" />
            <rect x="1052" y="424" width="92" height="586" fill="url(#hl-wood)" />
            <path d="M1048 404 L1148 404 L1166 420 L1166 436 L1144 424 L1052 424 L1048 420Z" fill="#a39079" />
            <path d="M1048 404 L1148 404 L1144 424 L1052 424Z" fill="#b5a28a" />
            <path d="M1054 446 L1142 446" stroke="#6e5c47" strokeWidth="2" />
            <g stroke="#6e5c47" strokeWidth="1.6" opacity=".7" fill="none">
              <path d="M1066 470 C1064 600 1070 760 1066 1000" />
              <path d="M1084 440 C1088 560 1082 700 1086 1000" />
              <path d="M1118 450 C1114 620 1122 800 1116 1000" />
              <path d="M1134 520 C1132 640 1136 760 1133 900" />
            </g>
            <g fill="#cdd3bd" opacity=".85">
              <circle cx="1062" cy="460" r="5" />
              <circle cx="1070" cy="468" r="3" />
              <circle cx="1126" cy="436" r="4" />
              <circle cx="1132" cy="482" r="6" />
              <circle cx="1124" cy="490" r="3" />
              <circle cx="1062" cy="780" r="4" />
              <circle cx="1068" cy="790" r="2.5" />
              <circle cx="1134" cy="860" r="3.5" />
            </g>
            <circle cx="1098" cy="530" r="27" fill="#f2c230" stroke="#c99b1a" strokeWidth="1.5" />
            <path d="M1084 530 h22 M1098 519 l11 11 -11 11" stroke="#1d3024" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <g fill="#6b6152">
              <circle cx="1098" cy="507" r="2" />
              <circle cx="1098" cy="553" r="2" />
            </g>
            <rect x={PLATE.x + 3} y={PLATE.y + 4} width={PLATE.w} height={PLATE.h} rx="8" fill="#1d3024" opacity=".25" />
            {/* its QR code opens the real Broadway Tower page, so pointing a phone at the screen works too */}
            <image href="/launch/plate-demo.svg" x={PLATE.x} y={PLATE.y} width={PLATE.w} height={PLATE.h} />
            <rect className="hl-plate-box" x={PLATE.x} y={PLATE.y} width={PLATE.w} height={PLATE.h} rx="8" fill="none" stroke="#1d3024" strokeOpacity=".35" strokeWidth="1" />
          </g>
          {/* the hidden layer: only drawn inside the opening circle */}
          <g clipPath="url(#hl-wipe-clip)">
            <rect x="-400" y="-500" width="2400" height="1600" fill="#9a3412" opacity=".07" />
            <g clipPath="url(#hl-land)" stroke="#9a3412" strokeWidth="1.2" opacity=".3" fill="none">
              {GRID_X.map((bx) => (
                <line key={bx} x1="700" y1="600" x2={bx} y2="1000" />
              ))}
              {[618, 650, 700, 780, 900].map((y) => (
                <line key={y} x1="0" y1={y} x2="1600" y2={y} />
              ))}
            </g>
            <path d="M995 1000 C960 930 900 870 840 812 C790 764 750 724 712 694" fill="none" stroke="#c2410c" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 16" />
            <path d="M712 694 C680 664 640 640 590 618 C560 606 530 598 498 594" fill="none" stroke="#c2410c" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 10" />
            <path d="M512 584 L494 594 L514 604" fill="none" stroke="#c2410c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={WX} cy={WY} r="96" fill="none" stroke="#9a3412" strokeWidth="2.5" strokeDasharray="5 8" />
            <circle cx={WX} cy={WY} r="140" fill="none" stroke="#9a3412" strokeWidth="1.5" strokeDasharray="3 10" opacity=".6" />
          </g>
          <circle className="hl-edge" cx={WX} cy={WY} r="0" fill="none" stroke="#c2410c" strokeWidth="5" opacity="0" />
        </svg>

        <div className="hl-copy">
          <h1 id="h1">
            The Cotswold Way has a <em>hidden layer</em>.
          </h1>
          <p className="lede">{lede}</p>
          <ol className="hl-steps">
            {steps.map((s, i) => (
              <li key={s} className={i === 0 ? "on now" : undefined}>
                {s}
              </li>
            ))}
          </ol>
          <div className="hl-actions">
            <a className="btn btn-primary" href="#paper">
              {cta} <Arrow />
            </a>
            <button className="btn btn-ghost hl-try" type="button">
              Try it: tap the plate
            </button>
            <button className="btn btn-ghost hl-replay" type="button">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2v3h3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tap again
            </button>
          </div>
        </div>

        <button className="hl-hit" type="button" aria-label="Tap the plate to see what it opens">
          <span className="hl-pulse" />
          <span className="hl-say">Tap the plate</span>
        </button>
        <div className="hl-waves" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>

        <div aria-hidden="true">
          {TAGS.map((t) => (
            <div className="hl-tag" key={t.k}>
              <span className="hl-pin" />
              <span className="hl-stem" />
              <span className="hl-lab">
                <span className="k">{t.k}</span>
                <span className="v">{t.v}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="hl-phone" aria-hidden="true">
          <div className="hl-body">
            <div className="hl-screen">
              <span className="hl-island" />
              <div className="hl-idle">
                <b>09:41</b>
                <span className="ring">
                  <svg width="26" height="26" viewBox="0 0 26 26">
                    <path d="M8 7q5 6 0 12M12.5 4q8 9 0 18M17 1.5q11 11.5 0 23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <span>
                  Hold near
                  <br />
                  the plate
                </span>
              </div>
              <MarkerPage clock="09:41" />
            </div>
          </div>
        </div>

        {/* the phone and labels are drawings; this says what they show */}
        <p className="vh hl-status" role="status" aria-live="polite" />
        <p className="vh">
          Tapping a plate opens that spot&rsquo;s page on your phone. At Broadway Tower it shows the place, the next
          stops along the Way, and what&rsquo;s nearby: a water tap right there, a café 241 yards away, toilets 309
          yards away.
        </p>

        <a className="hl-cue" href="#shows">
          <span>See everything a plate shows</span>
          <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 2v11M3 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}
