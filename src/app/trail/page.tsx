import { getMarkers } from "@/data/markers";
import { getPOIs } from "@/data/pois";
import TrailMapFull from "@/components/TrailMapFull";
import TopNav from "@/components/TopNav";
import MapFilters from "@/components/MapFilters";

export const metadata = {
  title: "TrailTap | Explore the Cotswold Way",
  description: "Interactive map of all trail markers along the 102-mile Cotswold Way.",
};

export const revalidate = 60;

export default async function TrailPage() {
  const [markers, pois] = await Promise.all([getMarkers(), getPOIs()]);

  return (
    <div className="fixed inset-0 bg-[#e8e0d8]">
      <TopNav />

      {/* Map — full screen, edge to edge, no scroll */}
      <main className="absolute inset-0 pt-16">
        <div className="absolute inset-0">
          <TrailMapFull markers={markers} pois={pois} />
        </div>

        <MapFilters markers={markers} pois={pois} />
      </main>
    </div>
  );
}
