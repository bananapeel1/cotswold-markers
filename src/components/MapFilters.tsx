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
  const [showSheet, setShowSheet] = useState(true);

  const filteredMarkers = activeFilter === "all"
    ? markers
    : markers.filter((m) => FILTER_CONFIG.find((f) => f.id === activeFilter)?.match(m));

  return (
    <>
      {/* Compact filter bar */}
      <div className="absolute top-20 left-4 right-4 z-10">
        <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-full shadow-lg flex items-center p-1 gap-0.5">
          {/* All button */}
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-2 rounded-full text-[10px] font-bold transition-all ${
              activeFilter === "all"
                ? "bg-primary text-on-primary"
                : "text-secondary"
            }`}
          >
            All
          </button>
          {/* Filter icons */}
          {FILTER_CONFIG.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(activeFilter === pill.id ? "all" : pill.id)}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                activeFilter === pill.id
                  ? "bg-primary text-on-primary"
                  : "text-secondary hover:bg-surface-container"
              }`}
              title={pill.label}
            >
              <span className="material-symbols-outlined text-base">
                {pill.icon}
              </span>
            </button>
          ))}
          {/* Active filter label */}
          {activeFilter !== "all" && (
            <span className="text-[10px] font-bold text-primary pl-1 pr-2">
              {FILTER_CONFIG.find((f) => f.id === activeFilter)?.label}
            </span>
          )}
        </div>
      </div>

      {/* Bottom marker list sheet */}
      <div className="absolute bottom-4 left-4 right-4 z-20 md:hidden">
        <div className="bg-surface-container-lowest rounded-md shadow-ambient overflow-hidden">
          {/* Handle + header */}
          <button
            onClick={() => setShowSheet(!showSheet)}
            className="w-full p-3 flex flex-col items-center"
          >
            <div className="w-10 h-1 bg-outline-variant rounded-full mb-2" />
            <div className="flex items-center justify-between w-full px-1">
              <h3 className="font-headline font-bold text-primary text-sm">
                {activeFilter === "all"
                  ? "All Markers"
                  : FILTER_CONFIG.find((f) => f.id === activeFilter)?.label}
                <span className="text-secondary font-normal ml-2 text-xs">
                  {filteredMarkers.length}
                </span>
              </h3>
              <span className="material-symbols-outlined text-secondary text-sm">
                {showSheet ? "expand_more" : "expand_less"}
              </span>
            </div>
          </button>

          {/* Marker list */}
          {showSheet && (
            <div className="max-h-[25vh] overflow-y-auto no-scrollbar px-3 pb-3">
              <div className="space-y-0.5">
                {filteredMarkers.map((m) => (
                  <Link
                    key={m.id}
                    href={`/m/${m.shortCode}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-container transition-colors"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold font-headline">
                      {m.shortCode.replace("CW", "")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">
                        {m.name}
                      </p>
                      <p className="text-[10px] text-secondary">
                        Mile {m.trailMile}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-sm">
                      chevron_right
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
