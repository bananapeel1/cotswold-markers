"use client";

import { useEffect } from "react";

/**
 * The launch page's shared motion: things fade in as they scroll into view,
 * and the header gets its paper background once you're past the hero.
 * Everything is on the page in its finished state; with reduced motion the
 * stylesheet shows it as is. The hero and the walk run their own scripts.
 */
export default function LaunchMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ll");
    if (!root) return;
    root.classList.add("ready");

    const reveal = (el: Element) => {
      el.classList.add("in");
      io.unobserve(el);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting || e.boundingClientRect.bottom < 0) && reveal(e.target)),
      { rootMargin: "0px 0px -10% 0px" },
    );
    root.querySelectorAll(".rv").forEach((n) => io.observe(n));

    const top = root.querySelector(".top");
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        top?.classList.toggle("solid", scrollY > innerHeight * 0.6);
        // a fast scroll can jump clean over an element without it ever intersecting
        root.querySelectorAll(".rv:not(.in)").forEach((n) => n.getBoundingClientRect().bottom < 0 && reveal(n));
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
