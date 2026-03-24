import Link from "next/link";
import { Marker } from "@/data/types";

interface TrailProgressProps {
  currentMarker: Marker;
  upcomingMarkers: Marker[];
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

      {/* Vertical timeline — avoids overlap */}
      <div className="space-y-0">
        {stops.map((stop, i) => {
          const isFirst = i === 0;
          const isLast = i === stops.length - 1;
          const distance = stop.trailMile - currentMarker.trailMile;

          return (
            <div key={stop.id} className="relative pl-8 pb-6 last:pb-0">
              {/* Vertical line */}
              {!isLast && (
                <div className="absolute left-[7px] top-3 bottom-0 w-[2px] bg-outline-variant/20" />
              )}
              {/* Dot */}
              <div
                className={`absolute left-0 top-1 rounded-full ${
                  isFirst
                    ? "w-4 h-4 bg-primary ring-4 ring-primary/20"
                    : "w-3 h-3 bg-surface-container-highest ring-4 ring-surface-container-low mt-0.5 ml-0.5"
                }`}
              />
              {/* Content */}
              <Link href={`/m/${stop.shortCode}`} className="block">
                <p className={`text-sm font-bold ${isFirst ? "text-primary" : "text-on-surface"}`}>
                  {stop.name}
                </p>
                {isFirst ? (
                  <p className="text-[11px] text-secondary">You are here</p>
                ) : (
                  <p className="text-[11px] text-secondary">{distance} miles ahead</p>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
