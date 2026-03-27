import Link from "next/link";
import { Marker } from "@/data/types";

interface TrailProgressProps {
  currentMarker: Marker;
  upcomingMarkers: Marker[];
}

function formatWalkTime(miles: number): string {
  const hours = miles / 2.5; // average walking pace
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function TrailProgress({
  currentMarker,
  upcomingMarkers,
}: TrailProgressProps) {
  const stops = [currentMarker, ...upcomingMarkers.slice(0, 2)];

  return (
    <section className="bg-surface-container-low rounded-md p-6 mx-4">
      <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">alt_route</span>
        What&apos;s Next
      </h3>

      <div className="space-y-0 mb-3">
        {stops.map((stop, i) => {
          const isFirst = i === 0;
          const isLast = i === stops.length - 1;
          const distance = stop.trailMile - currentMarker.trailMile;

          return (
            <div key={stop.id} className="relative pl-8 pb-6 last:pb-0">
              {!isLast && (
                <div className="absolute left-[7px] top-3 bottom-0 w-[2px] bg-outline-variant/20" />
              )}
              <div
                className={`absolute left-0 top-1 rounded-full ${
                  isFirst
                    ? "w-4 h-4 bg-primary ring-4 ring-primary/20"
                    : "w-3 h-3 bg-surface-container-highest ring-4 ring-surface-container-low mt-0.5 ml-0.5"
                }`}
              />
              <Link href={`/m/${stop.shortCode}`} className="block">
                <p className={`text-sm font-bold ${isFirst ? "text-primary" : "text-on-surface"}`}>
                  {stop.name}
                </p>
                {isFirst ? (
                  <p className="text-[11px] text-secondary">You are here · Mile {stop.trailMile} · {stop.elevation_m}m</p>
                ) : (
                  <p className="text-[11px] text-secondary flex items-center gap-2">
                    <span>{distance} mi</span>
                    <span className="text-tertiary font-bold">
                      ~{formatWalkTime(distance)}
                    </span>
                    {stop.elevation_m !== undefined && currentMarker.elevation_m !== undefined && (
                      <span className="text-tertiary">
                        {stop.elevation_m >= currentMarker.elevation_m ? "↑" : "↓"}
                        {Math.abs(stop.elevation_m - currentMarker.elevation_m)}m
                      </span>
                    )}
                  </p>
                )}
              </Link>
            </div>
          );
        })}
      </div>

      <Link
        href="/trail"
        className="flex items-center justify-center gap-1.5 text-xs text-primary font-bold py-2 hover:underline"
      >
        <span className="material-symbols-outlined text-sm">map</span>
        View full trail map
      </Link>
    </section>
  );
}
