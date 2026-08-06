"use client";

import { useEffect, useRef, useState } from "react";
import { useCommunityStats } from "@/hooks/useCommunityStats";

interface Stat {
  label: string;
  value: string;
  unit?: string;
  /** Replace `value` with the live community figure once it loads. */
  live?: "totalScans" | "totalWalkers";
}

function AnimatedNumber({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Preserve the exact shape of the target string — decimals and thousand
    // separators included — so the ribbon never rounds to a different number
    // than the one rendered elsewhere on the page.
    const numericPart = value.replace(/,/g, "").replace(/[^0-9.]/g, "");
    const target = parseFloat(numericPart) || 0;
    const decimals = numericPart.split(".")[1]?.length ?? 0;
    const grouped = value.includes(",");
    const prefix = value.replace(/[0-9.+,k]/gi, "");
    const hasK = value.toLowerCase().includes("k");
    const hasPlus = value.includes("+");

    const format = (n: number) => {
      const rounded = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
      const body = grouped
        ? Number(rounded).toLocaleString("en-GB", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : rounded;
      return `${prefix}${body}${hasK ? "k" : ""}${hasPlus ? "+" : ""}`;
    };

    // Already animated once (e.g. a live value arrived) — snap to the new number.
    if (animated.current) {
      setDisplay(format(target));
      return;
    }

    setDisplay(format(0));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1200;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(format(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="font-headline text-3xl font-bold text-primary">
      {display}
      {suffix && <span className="text-sm font-medium ml-1">{suffix}</span>}
    </span>
  );
}

export default function StatsRibbon({ stats: rawStats }: { stats: Stat[] }) {
  const community = useCommunityStats();
  const stats = rawStats.map((stat) =>
    stat.live && community
      ? { ...stat, value: community[stat.live].toLocaleString("en-GB") }
      : stat
  );

  return (
    <section className="bg-surface-container-high py-8">
      {/* Desktop: single row with equal spacing */}
      <div className="hidden md:flex max-w-7xl mx-auto items-center justify-evenly px-6">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-0 flex-1">
            <div className="flex flex-col items-center flex-1">
              <span className="font-label text-secondary text-[10px] uppercase tracking-widest mb-1">
                {stat.label}
              </span>
              <AnimatedNumber value={stat.value} suffix={stat.unit} />
            </div>
            {i < stats.length - 1 && (
              <div className="h-12 w-[2px] bg-tertiary/20 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: 2x2 grid */}
      <div className="md:hidden grid grid-cols-2 gap-y-10 py-4 px-6 max-w-xs mx-auto">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center ${
              i % 2 === 0 ? "border-r border-tertiary/20" : ""
            }`}
          >
            <AnimatedNumber value={stat.value} suffix={stat.unit} />
            <span className="font-label text-secondary text-[10px] uppercase tracking-widest mt-2">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
