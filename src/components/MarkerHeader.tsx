import { Marker } from "@/data/markers";

export default function MarkerHeader({ marker }: { marker: Marker }) {
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
    </div>
  );
}
