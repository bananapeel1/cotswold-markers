"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  label: string;
  value: string;
  unit?: string;
}

function AnimatedNumber({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const numericPart = value.replace(/[^0-9.]/g, "");
          const target = parseFloat(numericPart) || 0;
          const prefix = value.replace(/[0-9.+,k]/gi, "");
          const hasK = value.toLowerCase().includes("k");
          const hasPlus = value.includes("+");
          const duration = 1200;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);
            setDisplay(`${prefix}${current}${hasK ? "k" : ""}${hasPlus ? "+" : ""}`);
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

export default function StatsRibbon({ stats }: { stats: Stat[] }) {
  return (
    <section className="bg-surface-container-high py-8 overflow-x-auto no-scrollbar whitespace-nowrap">
      <div className="max-w-7xl mx-auto flex items-center justify-around px-6 gap-12">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-12">
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="font-label text-secondary text-[10px] uppercase tracking-widest mb-1">
                {stat.label}
              </span>
              <AnimatedNumber value={stat.value} suffix={stat.unit} />
            </div>
            {i < stats.length - 1 && (
              <div className="h-12 w-[2px] bg-tertiary/20" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
