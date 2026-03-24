import { getMarkers } from "@/data/markers";
import TrailMapFull from "@/components/TrailMapFull";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

export const metadata = {
  title: "TrailTap | Explore the Cotswold Way",
  description: "Interactive map of all trail markers along the 102-mile Cotswold Way.",
};

export default async function TrailPage() {
  const markers = await getMarkers();

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md flex justify-between items-center h-16 px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="active:scale-95 transition-transform p-2 hover:bg-surface-container rounded-full">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-primary tracking-tighter font-headline">TrailTap</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="active:scale-95 transition-transform p-2 hover:bg-surface-container rounded-full">
            <span className="material-symbols-outlined text-primary">map</span>
          </button>
        </div>
      </header>

      {/* Map — full screen */}
      <main className="relative h-screen w-full pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0 pt-16 pb-24">
          <TrailMapFull markers={markers} />
        </div>

        {/* Filter pills */}
        <section className="absolute top-20 left-0 w-full z-10 overflow-x-auto no-scrollbar px-6 flex gap-3 py-2">
          {[
            { icon: "restaurant", label: "Food", active: false },
            { icon: "water_drop", label: "Water", active: false },
            { icon: "bed", label: "Stay", active: false },
            { icon: "menu_book", label: "Stories", active: false },
            { icon: "local_offer", label: "Offers", active: false },
          ].map((pill) => (
            <button
              key={pill.label}
              className={`whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm font-label text-xs font-bold tracking-widest uppercase active:scale-95 transition-all ${
                pill.active
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-lowest/90 backdrop-blur-md text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{pill.icon}</span>
              {pill.label}
            </button>
          ))}
        </section>

        {/* Floating action controls */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
          <button className="w-12 h-12 bg-surface-container-lowest rounded-full shadow-lg flex items-center justify-center text-primary active:scale-90 transition-all">
            <span className="material-symbols-outlined">my_location</span>
          </button>
          <button className="w-12 h-12 bg-surface-container-lowest rounded-full shadow-lg flex items-center justify-center text-primary active:scale-90 transition-all">
            <span className="material-symbols-outlined">layers</span>
          </button>
        </div>

        {/* Bottom marker list sheet */}
        <div className="absolute bottom-28 left-4 right-4 z-20 md:hidden">
          <div className="bg-surface-container-lowest rounded-md p-4 shadow-ambient max-h-[30vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1 bg-outline-variant rounded-full" />
            </div>
            <h3 className="font-headline font-bold text-primary text-lg mb-3">
              All Markers
            </h3>
            <div className="space-y-1">
              {markers.map((m) => (
                <Link
                  key={m.id}
                  href={`/m/${m.shortCode}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-container transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold font-headline">
                    {m.shortCode.replace("CW", "")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {m.name}
                    </p>
                    <p className="text-[11px] text-secondary">
                      Mile {m.trailMile} · Day {m.dayOnTrail}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-base">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav active="explore" />
    </>
  );
}
