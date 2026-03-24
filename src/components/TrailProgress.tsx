import { TRAIL } from "@/lib/constants";

export default function TrailProgress({ trailMile }: { trailMile: number }) {
  const progress = (trailMile / TRAIL.totalMiles) * 100;
  const remaining = TRAIL.totalMiles - trailMile;

  return (
    <div className="px-4 pb-4">
      <div className="bg-surface-container-high rounded-xl p-3">
        <div className="flex justify-between text-xs text-on-surface-variant mb-2">
          <span>{TRAIL.start}</span>
          <span>{TRAIL.end}</span>
        </div>
        <div className="relative h-3 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-tertiary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-tertiary border-2 border-white rounded-full shadow-md"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="font-semibold text-primary">
            {trailMile} miles done
          </span>
          <span className="text-on-surface-variant">
            {remaining} miles to go
          </span>
        </div>
      </div>
    </div>
  );
}
