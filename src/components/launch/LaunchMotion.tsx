"use client";

import { useEffect } from "react";
import { FIRST_STRETCH_KM, WHOLE_WAY_KM, WHOLE_WAY_MILES } from "@/content/launch";
import {
  BIG_MAP_TIMING,
  STRIP_MEDIA,
  STRIP_VARIANTS,
  eleAt,
  mi,
  placeAt,
  stripLayout,
  walkerAt,
  type StripLayout,
  type StripVariant,
} from "@/lib/launch/geo";

/**
 * The launch page's motion. Everything it animates is already on the page in
 * its finished state (server-rendered); this only adds the movement, and
 * does nothing beyond setting final values when reduced motion is on.
 */
export default function LaunchMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ll");
    if (!root) return;
    root.classList.add("ready");
    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s);
    const cleanups: (() => void)[] = [];

    /* reveal on scroll */
    const countUp = (el: Element) => {
      if (RM) return;
      el.querySelectorAll<HTMLElement>("[data-count]").forEach((b) => {
        const to = Number(b.dataset.count);
        const t0 = performance.now();
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / 1400);
          b.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };
    const reveal = (el: Element) => {
      el.classList.add("in");
      io.unobserve(el);
      if (el.matches(".stats")) countUp(el);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting || e.boundingClientRect.bottom < 0) && reveal(e.target)),
      { rootMargin: "0px 0px -10% 0px" },
    );
    root.querySelectorAll(".rv").forEach((n) => io.observe(n));
    // a fast scroll can jump clean over an element without it ever intersecting
    const catchUp = () =>
      root.querySelectorAll(".rv:not(.in)").forEach((n) => n.getBoundingClientRect().bottom < 0 && reveal(n));
    addEventListener("scroll", catchUp, { passive: true });
    cleanups.push(() => {
      io.disconnect();
      removeEventListener("scroll", catchUp);
    });

    /* the whole Way draws itself, and the miles count up with the line */
    const sheet = $(".sheet");
    const mic = $("#mic");
    if (sheet && mic) {
      if (RM) {
        sheet.classList.add("go");
      } else {
        mic.textContent = "0";
        requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add("go")));
        const { delay, first, rest } = BIG_MAP_TIMING;
        const t0 = performance.now() + delay * 1000;
        let raf = 0;
        const tick = (now: number) => {
          const t = (now - t0) / 1000;
          const km =
            t <= 0
              ? 0
              : t < first
                ? (t / first) * FIRST_STRETCH_KM
                : FIRST_STRETCH_KM + Math.min(1, (t - first) / rest) * (WHOLE_WAY_KM - FIRST_STRETCH_KM);
          if (km < WHOLE_WAY_KM) {
            mic.textContent = String(Math.round(mi(km)));
            raf = requestAnimationFrame(tick);
          } else mic.textContent = String(WHOLE_WAY_MILES);
        };
        raf = requestAnimationFrame(tick);
        cleanups.push(() => cancelAnimationFrame(raf));
      }
    }

    /* walking the strip: the walker, the drawn-in path and the readout follow the middle of the screen */
    const strip = $("#strip");
    const walked = $("#walked");
    const topo = $("#topo");
    const layouts = new Map<StripVariant, StripLayout>();
    const queries = STRIP_VARIANTS.map((k) => [k, matchMedia(STRIP_MEDIA[k])] as const);
    let L: StripLayout | null = null;
    let svg: SVGSVGElement | null = null;
    let places: SVGGElement[] = [];
    const pick = () => {
      const k = queries.find(([, q]) => q.matches)?.[0] ?? "wide";
      if (!layouts.has(k)) layouts.set(k, stripLayout(k));
      L = layouts.get(k)!;
      svg = root.querySelector<SVGSVGElement>(`.map-${k}`);
      places = svg ? [...svg.querySelectorAll<SVGGElement>(".place-g")] : [];
      curY = null;
    };

    const roMi = $("#ro-mi");
    const roH = $("#ro-h");
    const roP = $("#ro-p");
    let curY: number | null = null;
    let tgtY = 0;
    let gliding = false;
    let lastKm = -1;

    const render = () => {
      if (!L || !svg || curY === null) return;
      const { km, x, along } = walkerAt(L, curY);
      svg.querySelector(".walkpath")?.setAttribute("stroke-dashoffset", (L.routeLen - along).toFixed(1));
      svg.querySelector(".walker")?.setAttribute("transform", `translate(${x.toFixed(1)} ${curY.toFixed(1)})`);
      if (km !== lastKm) {
        lastKm = km;
        if (roMi) roMi.textContent = mi(km).toFixed(1);
        if (roH) roH.textContent = `${Math.round(eleAt(km))} m up`;
        const place = placeAt(km);
        if (roP && roP.textContent !== place) roP.textContent = place;
        places.forEach((g) => g.classList.toggle("passed", Number(g.dataset.km) <= km));
      }
    };
    const glide = () => {
      if (curY === null) return;
      curY += (tgtY - curY) * 0.2;
      if (Math.abs(tgtY - curY) < 0.5) curY = tgtY;
      render();
      if (curY !== tgtY) requestAnimationFrame(glide);
      else gliding = false;
    };
    const onScroll = () => {
      const doc = document.documentElement;
      walked?.style.setProperty("--p", (scrollY / Math.max(1, doc.scrollHeight - innerHeight)).toFixed(4));
      if (topo && !RM) topo.style.transform = `translateY(${(scrollY * 0.12).toFixed(1)}px)`;
      if (!L || !strip) return;
      const r = strip.getBoundingClientRect();
      tgtY = Math.max(L.ys[0], Math.min(L.ys[L.ys.length - 1], innerHeight * 0.45 - r.top));
      if (curY === null || RM) {
        curY = tgtY;
        render();
        return;
      }
      if (!gliding) {
        gliding = true;
        requestAnimationFrame(glide);
      }
    };
    const onMedia = () => {
      pick();
      lastKm = -1;
      onScroll();
    };
    pick();
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    queries.forEach(([, q]) => q.addEventListener("change", onMedia));
    cleanups.push(() => {
      removeEventListener("scroll", onScroll);
      queries.forEach(([, q]) => q.removeEventListener("change", onMedia));
    });

    return () => cleanups.forEach((f) => f());
  }, []);

  return null;
}
