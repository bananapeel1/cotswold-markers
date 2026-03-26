"use client";

import { useEffect, useState } from "react";

const COLORS = ["#D4A843", "#154212", "#B8860B", "#2d5a27", "#fcf9f2"];

export default function ConfettiCelebration() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 50 }}
      aria-hidden="true"
    >
      {Array.from({ length: 30 }).map((_, i) => {
        const color = COLORS[i % COLORS.length];
        const width = 6 + Math.random() * 6;
        const height = 6 + Math.random() * 6;
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const rotation = Math.random() * 360;
        const duration = 2 + Math.random() * 1.5;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-20px",
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              transform: `rotate(${rotation}deg)`,
              animation: `confetti-fall ${duration}s ease-in ${delay}s forwards, confetti-spin ${duration}s linear ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
