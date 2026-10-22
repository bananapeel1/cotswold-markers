"use client";

import { useState, useEffect } from "react";

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

        {/* No "x of N" total: the pilot covers part of the trail, so a
            whole-trail count would overstate where markers are. */}
        <p className="text-xs text-secondary">
          Photograph the markers you pass this {season}.
          {currentMarkerId && !thisMarkerCovered && (
            <span className="text-primary font-bold"> This one has no {season} photo yet.</span>
          )}
        </p>

        {covered > 0 && (
          <p className="text-[10px] text-secondary">
            {covered} {covered === 1 ? "marker" : "markers"} photographed this {season} so far.
          </p>
        )}
      </div>
    </section>
  );
}
