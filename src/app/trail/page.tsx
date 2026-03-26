import { getMarkers } from "@/data/markers";
import { getPOIs } from "@/data/pois";
import TrailMapFull from "@/components/TrailMapFull";
import TopNav from "@/components/TopNav";
import MapFilters from "@/components/MapFilters";

export const metadata = {
  title: "TrailTap | Explore the Cotswold Way",
  description: "Interactive map of all trail markers along the 102-mile Cotswold Way.",
};

export default async function TrailPage() {
  const [markers, pois] = await Promise.all([getMarkers(), getPOIs()]);

  return (
    <>
      <TopNav />

      {/* Map — full screen, edge to edge */}
      <main className="relative h-dvh w-full pt-16 overflow-hidden bg-[#e8e0d8]">
        <div className="absolute inset-0 z-0 pt-16">
          <TrailMapFull markers={markers} pois={pois} />
        </div>

        <MapFilters markers={markers} pois={pois} />
      </main>
    </>
  );
}
