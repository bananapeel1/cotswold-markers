import { Marker } from "@/data/markers";

interface MarkerHeaderProps {
  marker: Marker;
  nextVillageName?: string;
  distanceToNextVillage?: number;
  nearestWaterDistance?: number | null;
  nearestFoodDistance?: number | null;
}

export default function MarkerHeader({
  marker,
  nextVillageName,
  distanceToNextVillage,
  nearestWaterDistance,
  nearestFoodDistance,
}: MarkerHeaderProps) {
  return (
    <div className="px-4 pt-6 pb-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary text-on-tertiary">
          Mile {marker.trailMile}
        </span>
        <span className="text-xs text-on-surface-variant">
          {marker.elevation_m}m elevation
        </span>
      </div>
      <h1 className="font-headline text-2xl font-bold text-primary leading-tight">
        {marker.name}
      </h1>
      <p className="text-sm text-on-surface-variant mt-0.5 italic font-headline">
        {marker.subtitle}
      </p>
      <p className="text-xs text-on-surface-variant mt-1">
        <span className="material-symbols-outlined text-sm mr-0.5">route</span>
        {marker.segment} · Day {marker.dayOnTrail}
      </p>

      {/* Conversational distance info */}
      {(nextVillageName || nearestWaterDistance || nearestFoodDistance) && (
        <div className="mt-3 bg-surface-container-low rounded-lg p-3 text-sm text-on-surface space-y-1">
          {nextVillageName && distanceToNextVillage !== undefined && (
            <p>
              <span className="material-symbols-outlined text-sm mr-1 text-primary align-text-bottom">
                location_on
              </span>
              You are <span className="font-semibold">{distanceToNextVillage} miles</span> from {nextVillageName}
            </p>
          )}
          {nearestWaterDistance != null && (
            <p>
              <span className="material-symbols-outlined text-sm mr-1 text-blue-600 align-text-bottom">
                water_drop
              </span>
              Next water: <span className="font-semibold">{nearestWaterDistance} miles</span>
            </p>
          )}
          {nearestFoodDistance != null && (
            <p>
              <span className="material-symbols-outlined text-sm mr-1 text-tertiary align-text-bottom">
                restaurant
              </span>
              Next food: <span className="font-semibold">{nearestFoodDistance} miles</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
