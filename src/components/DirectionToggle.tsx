"use client";

import { useState, useEffect } from "react";

export type Direction = "northbound" | "southbound";

export default function DirectionToggle({
  onChange,
}: {
  onChange?: (dir: Direction) => void;
}) {
  const [direction, setDirection] = useState<Direction>("northbound");

  useEffect(() => {
    const stored = localStorage.getItem("trailtap-direction") as Direction | null;
    if (stored) setDirection(stored);
  }, []);

  function toggle() {
    const next = direction === "northbound" ? "southbound" : "northbound";
    setDirection(next);
    localStorage.setItem("trailtap-direction", next);
    onChange?.(next);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-full text-xs font-bold text-secondary active:scale-95 transition-all mx-4"
    >
      <span
        className="material-symbols-outlined text-primary text-sm"
        style={{
          transform: direction === "northbound" ? "rotate(0deg)" : "rotate(180deg)",
          transition: "transform 0.3s ease",
        }}
      >
        north
      </span>
      Walking {direction === "northbound" ? "Chipping Campden → Bath" : "Bath → Chipping Campden"}
    </button>
  );
}
