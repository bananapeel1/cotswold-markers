"use client";

import type { ScanEntry } from "@/lib/badges";

interface StatsGridProps {
  scans: ScanEntry[];
  scanCount: number;
  badgeCount: number;
  streak: number;
  bestStreak: number;
}

export default function StatsGrid({ scans, scanCount, badgeCount, streak, bestStreak }: StatsGridProps) {
  // Days on trail — unique scan dates
  const uniqueDays = new Set(scans.map((s) => s.timestamp.slice(0, 10))).size;

  // Best day — most unique markers in one day
  const scansByDay = new Map<string, Set<string>>();
  for (const s of scans) {
    const day = s.timestamp.slice(0, 10);
    if (!scansByDay.has(day)) scansByDay.set(day, new Set());
    scansByDay.get(day)!.add(s.markerId);
  }
  let bestDay = 0;
  for (const markers of scansByDay.values()) {
    bestDay = Math.max(bestDay, markers.size);
  }

  const stats = [
    { label: "Markers", value: String(scanCount), icon: "location_on" },
    { label: "Badges", value: String(badgeCount), icon: "military_tech" },
    { label: "Streak", value: String(streak), icon: "local_fire_department" },
    { label: "Best Streak", value: String(bestStreak), icon: "whatshot" },
    { label: "Days on Trail", value: String(uniqueDays), icon: "calendar_month" },
    { label: "Best Day", value: String(bestDay), icon: "bolt" },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-base">bar_chart</span>
        <h2 className="font-headline font-bold text-primary text-lg">Stats</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-container rounded-md p-3 text-center">
            <span
              className="material-symbols-outlined text-primary text-lg mb-1 block"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {s.icon}
            </span>
            <p className="font-headline font-extrabold text-xl text-primary">{s.value}</p>
            <p className="text-[9px] text-secondary uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
