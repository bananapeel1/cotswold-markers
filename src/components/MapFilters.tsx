"use client";

import { useState } from "react";
import Link from "next/link";
import { Marker, FacilityType } from "@/data/types";

interface MapFiltersProps {
  markers: Marker[];
}

type FilterType = "all" | "food" | "water" | "stay" | "stories" | "offers";

const FILTER_CONFIG: { id: FilterType; icon: string; label: string; match: (m: Marker) => boolean }[] = [
  { id: "food", icon: "restaurant", label: "Food", match: (m) => m.facilities.some((f: FacilityType) => ["pub", "cafe"].includes(f)) },
  { id: "water", icon: "water_drop", label: "Water", match: (m) => m.facilities.some((f: FacilityType) => f === "water") },
  { id: "stay", icon: "bed", label: "Stay", match: (m) => m.facilities.some((f: FacilityType) => ["accommodation", "campsite"].includes(f)) },
  { id: "stories", icon: "menu_book", label: "Stories", match: (m) => m.storyIds.length > 0 },
  { id: "offers", icon: "local_offer", label: "Offers", match: (m) => m.businessIds.length > 0 },
];

export default function MapFilters({ markers }: MapFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredMarkers = activeFilter === "all"
    ? markers
    : markers.filter((m) => FILTER_CONFIG.find((f) => f.id === activeFilter)?.match(m));

  return (
    <>
      {/* Filter pills */}
      <section className="absolute top-20 left-0 w-full z-10 overflow-x-auto no-scrollbar px-6 flex gap-3 py-2">
        {FILTER_CONFIG.map((pill) => (
          <button
            key={pill.id}
            onClick={() => setActiveFilter(activeFilter === pill.id ? "all" : pill.id)}
            className={`whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm font-label text-xs font-bold tracking-widest uppercase active:scale-95 transition-all ${
              activeFilter === pill.id
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest/90 backdrop-blur-md text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{pill.icon}</span>
            {pill.label}
          </button>
        ))}
      </section>



      {/* Bottom marker list sheet */}
      <div className="absolute bottom-4 left-4 right-4 z-20 md:hidden">
        <div className="bg-surface-container-lowest rounded-md p-4 shadow-ambient max-h-[30vh] overflow-y-auto no-scrollbar">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-1 bg-outline-variant rounded-full" />
          </div>
          <h3 className="font-headline font-bold text-primary text-lg mb-1">
            {activeFilter === "all" ? "All Markers" : FILTER_CONFIG.find((f) => f.id === activeFilter)?.label}
          </h3>
          <p className="text-[11px] text-secondary mb-3">
            {filteredMarkers.length} marker{filteredMarkers.length !== 1 ? "s" : ""} found
          </p>
          <div className="space-y-1">
            {filteredMarkers.map((m) => (
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
    </>
  );
}
