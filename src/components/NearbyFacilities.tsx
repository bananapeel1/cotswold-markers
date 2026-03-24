import { FacilityType, getFacilityEmoji, getFacilityLabel } from "@/data/markers";

export default function NearbyFacilities({
  facilities,
}: {
  facilities: FacilityType[];
}) {
  if (facilities.length === 0) {
    return (
      <div className="px-4 pb-4">
        <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide mb-2">
          Nearby facilities
        </p>
        <p className="text-sm text-on-surface-variant italic">
          No facilities at this point — check the next marker
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide mb-2">
        Nearby facilities
      </p>
      <div className="flex flex-wrap gap-2">
        {facilities.map((facility) => (
          <span
            key={facility}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-sm text-on-surface"
          >
            <span>{getFacilityEmoji(facility)}</span>
            <span>{getFacilityLabel(facility)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
