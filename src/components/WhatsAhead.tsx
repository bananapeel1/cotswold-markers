import Link from "next/link";
import { Marker, getFacilityEmoji } from "@/data/types";
import { estimateWalkingTime } from "@/lib/constants";

interface WhatsAheadProps {
  currentMarker: Marker;
  upcomingMarkers: Marker[];
}

export default function WhatsAhead({
  currentMarker,
  upcomingMarkers,
}: WhatsAheadProps) {
  if (upcomingMarkers.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide mb-2">
        What&apos;s ahead
      </p>
      <div className="space-y-2">
        {upcomingMarkers.map((m) => {
          const distFromCurrent = m.trailMile - currentMarker.trailMile;
          return (
            <Link key={m.id} href={`/m/${m.shortCode}`}>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">
                  {m.shortCode.replace("CW", "")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface truncate">
                    {m.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {distFromCurrent} miles · ~{estimateWalkingTime(distFromCurrent)}
                  </p>
                </div>
                <div className="flex gap-0.5 text-sm">
                  {m.facilities.slice(0, 4).map((f) => (
                    <span key={f} title={f}>
                      {getFacilityEmoji(f)}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
