import { getMarkers } from "@/data/markers";
import TrailMapFull from "@/components/TrailMapFull";
import Link from "next/link";

export const metadata = {
  title: "Trail Map | Cotswold Way Markers",
  description: "Interactive map of all 15 trail markers along the 102-mile Cotswold Way.",
};

export default async function TrailPage() {
  const markers = await getMarkers();

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-primary text-on-primary z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <span className="material-symbols-outlined">hiking</span>
          <span className="font-headline font-bold text-lg">Cotswold Way</span>
        </Link>
        <span className="text-sm opacity-80">{markers.length} markers</span>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <TrailMapFull markers={markers} />

        {/* Bottom sheet - marker list */}
        <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-lg max-h-[40vh] overflow-y-auto z-10">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-outline-variant rounded-full" />
          </div>
          <div className="px-4 pb-4">
            <h2 className="font-headline font-bold text-primary text-lg mb-3">
              All Markers
            </h2>
            <div className="space-y-2">
              {markers.map((m) => (
                <Link
                  key={m.id}
                  href={`/m/${m.shortCode}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">
                    {m.shortCode.replace("CW", "")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Mile {m.trailMile} · Day {m.dayOnTrail}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-base">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
