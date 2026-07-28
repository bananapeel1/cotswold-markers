"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CircularRoute,
  getAccessibilityGradeLabel,
  getDifficultyLabel,
} from "@/data/types";

const GRADE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  "for-all": { bg: "#e8f5e9", text: "#1b5e20", icon: "accessible" },
  "for-many": { bg: "#fff8e1", text: "#8d6e00", icon: "accessible" },
  "for-some": { bg: "#fff3e0", text: "#a35a00", icon: "accessible" },
  ungraded: { bg: "#f0efe9", text: "#5e5e5e", icon: "help" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#27AE60",
  moderate: "#E67E22",
  challenging: "#C0392B",
};

export default function RoutesList({ routes }: { routes: CircularRoute[] }) {
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  const visible = accessibleOnly
    ? routes.filter((r) => r.accessibility && r.accessibility.grade !== "ungraded")
    : routes;

  return (
    <div>
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setAccessibleOnly(false)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
            !accessibleOnly
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-secondary hover:bg-surface-container-high"
          }`}
        >
          All routes ({routes.length})
        </button>
        <button
          onClick={() => setAccessibleOnly(true)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
            accessibleOnly
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-secondary hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">accessible</span>
          Accessible (
          {routes.filter((r) => r.accessibility && r.accessibility.grade !== "ungraded").length})
        </button>
      </div>

      {/* Route cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((route) => {
          const grade = route.accessibility?.grade;
          const gradeStyle = grade ? GRADE_STYLES[grade] : null;
          return (
            <Link
              key={route.id}
              href={`/routes/${route.slug}`}
              className="bg-surface-container-lowest rounded-md p-5 shadow-ambient hover:shadow-lg transition-all active:scale-[0.98] flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-headline font-bold text-base text-on-surface leading-tight">
                    {route.name}
                  </h3>
                  <p className="text-xs text-secondary mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {route.startLocation}
                  </p>
                </div>
                <span
                  className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${DIFFICULTY_COLORS[route.difficulty]}18`,
                    color: DIFFICULTY_COLORS[route.difficulty],
                  }}
                >
                  {getDifficultyLabel(route.difficulty)}
                </span>
              </div>

              <p className="text-xs text-secondary leading-snug line-clamp-2">
                {route.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-auto">
                <span className="flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-sm">route</span>
                  {route.distanceMiles} mi
                </span>
                {route.estimatedTime && (
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {route.estimatedTime}
                  </span>
                )}
                {route.poiIds.length > 0 && (
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-sm">pin_drop</span>
                    {route.poiIds.length} places
                  </span>
                )}
              </div>

              {gradeStyle && grade && (
                <div
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg w-fit"
                  style={{ backgroundColor: gradeStyle.bg, color: gradeStyle.text }}
                >
                  <span className="material-symbols-outlined text-sm">{gradeStyle.icon}</span>
                  {getAccessibilityGradeLabel(grade)}
                  <span className="font-normal opacity-70">· {route.accessibility!.source}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-secondary text-center py-10">
          No routes match this filter yet.
        </p>
      )}
    </div>
  );
}
