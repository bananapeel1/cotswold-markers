import { getMarkers } from "@/data/markers";
import TrailMapFull from "@/components/TrailMapFull";
import TopNav from "@/components/TopNav";
import MapFilters from "@/components/MapFilters";

export const metadata = {
  title: "TrailTap | Explore the Cotswold Way",
  description: "Interactive map of all trail markers along the 102-mile Cotswold Way.",
};

export default async function TrailPage() {
  const markers = await getMarkers();

  return (
    <>
      <TopNav />

      {/* Map — full screen */}
      <main className="relative h-screen w-full pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0 pt-16">
          <TrailMapFull markers={markers} />
        </div>

        <MapFilters markers={markers} />
      </main>
    </>
  );
}
