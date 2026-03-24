import Link from "next/link";
import { Marker } from "@/data/markers";
import { estimateWalkingTime } from "@/lib/constants";

export default function NextMarkerCard({
  nextMarker,
  distanceToNext,
}: {
  nextMarker: Marker;
  distanceToNext: number;
}) {
  return (
    <div className="px-4 pb-4">
      <Link href={`/m/${nextMarker.shortCode}`}>
        <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3 hover:bg-surface-container transition-colors">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-lg">
              arrow_forward
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
              Next up
            </p>
            <p className="font-headline font-semibold text-primary truncate">
              {nextMarker.name}
            </p>
            <p className="text-sm text-on-surface-variant">
              {distanceToNext} miles · ~{estimateWalkingTime(distanceToNext)}
            </p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">
            chevron_right
          </span>
        </div>
      </Link>
    </div>
  );
}
