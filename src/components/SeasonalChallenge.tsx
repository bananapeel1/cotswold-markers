"use client";

import { useState, useEffect } from "react";

const TOTAL_MARKERS = 50;

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  if ([9, 10, 11].includes(month)) return "autumn";
  return "winter";
}

function getSeasonLabel(season: string): string {
  return season.charAt(0).toUpperCase() + season.slice(1);
}

function getSeasonIcon(season: string): string {
  const map: Record<string, string> = {
    spring: "local_florist",
    summer: "wb_sunny",
    autumn: "eco",
    winter: "ac_unit",
  };
  return map[season] || "calendar_month";
}

export default function SeasonalChallenge({ currentMarkerId }: { currentMarkerId?: string }) {
  const [coveredMarkers, setCoveredMarkers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const season = getCurrentSeason();

  useEffect(() => {
    fetch(`/api/community-photos/seasonal?season=${season}`)
      .then((r) => r.json())
      .then((data) => setCoveredMarkers(data.coveredMarkers || []))
      .catch(() => setCoveredMarkers([]))
      .finally(() => setLoading(false));
  }, [season]);

  if (loading) return null;

  const covered = coveredMarkers.length;
  const percent = Math.round((covered / TOTAL_MARKERS) * 100);
  const thisMarkerCovered = currentMarkerId ? coveredMarkers.includes(currentMarkerId) : false;

  return (
    <section className="mx-4">
      <div className="bg-surface-container-lowest rounded-md p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">
            {getSeasonIcon(season)}
          </span>
          <h3 className="font-headline font-bold text-sm">
            {getSeasonLabel(season)} Photo Challenge
          </h3>
        </div>

        <p className="text-xs text-secondary">
          Help capture all 50 markers in {season}!
          {currentMarkerId && !thisMarkerCovered && (
            <span className="text-primary font-bold"> This marker needs a {season} photo.</span>
          )}
        </p>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-secondary">{covered} of {TOTAL_MARKERS} markers</span>
            <span className="font-bold text-primary">{percent}%</span>
          </div>
          <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Mini grid */}
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: TOTAL_MARKERS }).map((_, i) => {
            const markerId = `cw-${String(i + 1).padStart(2, "0")}`;
            const isCovered = coveredMarkers.some((m) => m.startsWith(markerId));
            const isCurrent = currentMarkerId?.startsWith(markerId);

            return (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  isCurrent
                    ? isCovered
                      ? "bg-primary ring-2 ring-primary/30"
                      : "bg-surface-variant ring-2 ring-primary/30"
                    : isCovered
                    ? "bg-primary"
                    : "bg-surface-variant"
                }`}
                title={`Marker ${i + 1}${isCovered ? " (has photo)" : ""}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
