"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Marker, POI } from "@/data/types";

interface MapFiltersProps {
  markers: Marker[];
  pois?: POI[];
}

const CATEGORIES = [
  { id: "food", icon: "restaurant", label: "Food & Drink", color: "#E67E22", types: ["pub", "cafe"] },
  { id: "water", icon: "water_drop", label: "Water", color: "#3498DB", types: ["water"] },
  { id: "toilets", icon: "wc", label: "Toilets", color: "#7F8C8D", types: ["toilets"] },
  { id: "shops", icon: "shopping_bag", label: "Shops", color: "#27AE60", types: ["shop"] },
  { id: "accommodation", icon: "bed", label: "Stay", color: "#8E44AD", types: ["accommodation", "campsite"] },
];

export default function MapFilters({ markers, pois = [] }: MapFiltersProps) {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [layersOpen, setLayersOpen] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [nearMeCount, setNearMeCount] = useState(0);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [showMarkerList, setShowMarkerList] = useState(true);

  // Listen for near-me count updates from the map
  useEffect(() => {
    function handleCount(e: Event) {
      const count = (e as CustomEvent).detail?.count || 0;
      setNearMeCount(count);
      setNearMeLoading(false);
    }
    window.addEventListener("trailtap:near-me-count", handleCount);
    return () => window.removeEventListener("trailtap:near-me-count", handleCount);
  }, []);

  function toggleCategory(catId: string) {
    const newSet = new Set(activeCategories);
    const isNowActive = !newSet.has(catId);
    if (isNowActive) newSet.add(catId);
    else newSet.delete(catId);
    setActiveCategories(newSet);

    window.dispatchEvent(
      new CustomEvent("trailtap:poi-toggle", {
        detail: { category: catId, visible: isNowActive },
      })
    );
  }

  function showAll() {
    const newSet = new Set(CATEGORIES.map((c) => c.id));
    setActiveCategories(newSet);
    CATEGORIES.forEach((cat) => {
      window.dispatchEvent(
        new CustomEvent("trailtap:poi-toggle", { detail: { category: cat.id, visible: true } })
      );
    });
  }

  function hideAll() {
    setActiveCategories(new Set());
    CATEGORIES.forEach((cat) => {
      window.dispatchEvent(
        new CustomEvent("trailtap:poi-toggle", { detail: { category: cat.id, visible: false } })
      );
    });
  }

  function toggleNearMe() {
    if (nearMeActive) {
      setNearMeActive(false);
      setNearMeCount(0);
      window.dispatchEvent(
        new CustomEvent("trailtap:near-me", { detail: { active: false } })
      );
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setNearMeLoading(true);

    // Auto-enable all categories when using Near Me
    if (activeCategories.size === 0) showAll();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearMeActive(true);
        window.dispatchEvent(
          new CustomEvent("trailtap:near-me", {
            detail: { active: true, lat: pos.coords.latitude, lng: pos.coords.longitude },
          })
        );
      },
      () => {
        setNearMeLoading(false);
        alert("Unable to get your location. Please enable location services.");
      },
      { enableHighAccuracy: true }
    );
  }

  function getCountForCategory(catId: string): number {
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (!cat) return 0;
    return pois.filter((p) => cat.types.includes(p.type)).length;
  }

  return (
    <>
      {/* Control buttons — top left */}
      <div className="absolute top-20 left-4 z-10 flex gap-2">
        {/* Layers button */}
        <button
          onClick={() => { setLayersOpen(!layersOpen); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-xs font-bold active:scale-95 transition-all ${
            activeCategories.size > 0
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest/95 backdrop-blur-md text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-sm">layers</span>
          <span>Places</span>
          {activeCategories.size > 0 && (
            <span className="bg-on-primary/20 text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {activeCategories.size}
            </span>
          )}
        </button>

        {/* Near Me button */}
        <button
          onClick={toggleNearMe}
          disabled={nearMeLoading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-xs font-bold active:scale-95 transition-all ${
            nearMeActive
              ? "bg-blue-500 text-white"
              : "bg-surface-container-lowest/95 backdrop-blur-md text-on-surface"
          } ${nearMeLoading ? "opacity-60" : ""}`}
        >
          <span className="material-symbols-outlined text-sm">
            {nearMeLoading ? "progress_activity" : "near_me"}
          </span>
          <span>{nearMeActive ? `${nearMeCount} nearby` : "Near Me"}</span>
        </button>
      </div>

      {/* Category panel */}
      {layersOpen && (
        <div className="absolute top-32 left-4 z-10 bg-surface-container-lowest/95 backdrop-blur-md rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.12)] p-3 animate-fade-in-up w-[220px] border border-outline-variant/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-secondary/70 uppercase tracking-[0.15em]">
              Show on map
            </span>
            <button
              onClick={() => setLayersOpen(false)}
              className="p-0.5 hover:bg-surface-container rounded"
            >
              <span className="material-symbols-outlined text-secondary text-sm">close</span>
            </button>
          </div>

          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategories.has(cat.id);
              const count = getCountForCategory(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-left transition-all active:scale-[0.98] ${
                    isActive ? "bg-surface-container-high" : "hover:bg-surface-container"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isActive ? cat.color : "#e5e2db" }}
                  >
                    <span
                      className="material-symbols-outlined text-white"
                      style={{ fontSize: "12px" }}
                    >
                      {cat.icon}
                    </span>
                  </div>
                  <span className={`text-[11px] font-semibold flex-1 ${isActive ? "text-on-surface" : "text-secondary"}`}>
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-secondary/60 tabular-nums">{count}</span>
                  {isActive && (
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "14px" }}>check</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-2 pt-2 border-t border-outline-variant/15">
            <button
              onClick={showAll}
              className="flex-1 text-[10px] font-bold text-primary py-1 rounded hover:bg-primary-fixed transition-colors"
            >
              Show all
            </button>
            <button
              onClick={hideAll}
              className="flex-1 text-[10px] font-bold text-secondary py-1 rounded hover:bg-surface-container transition-colors"
            >
              Hide all
            </button>
          </div>
        </div>
      )}

      {/* Bottom marker list sheet */}
      <div id="map-bottom-panel" className="absolute bottom-4 left-4 right-4 z-20 md:hidden transition-transform duration-300">
        <div className="bg-surface-container-lowest rounded-md shadow-ambient overflow-hidden">
          <button
            onClick={() => setShowMarkerList(!showMarkerList)}
            className="w-full p-3 flex flex-col items-center"
          >
            <div className="w-10 h-1 bg-outline-variant rounded-full mb-2" />
            <div className="flex items-center justify-between w-full px-1">
              <h3 className="font-headline font-bold text-primary text-sm">
                All Markers
                <span className="text-secondary font-normal ml-2 text-xs">{markers.length}</span>
              </h3>
              <span className="material-symbols-outlined text-secondary text-sm">
                {showMarkerList ? "expand_more" : "expand_less"}
              </span>
            </div>
          </button>

          {showMarkerList && (
            <div className="max-h-[25vh] overflow-y-auto no-scrollbar px-3 pb-3">
              <div className="space-y-0.5">
                {markers.map((m) => (
                  <Link
                    key={m.id}
                    href={`/m/${m.shortCode}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-container transition-colors"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold font-headline">
                      {m.shortCode.replace("CW", "")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{m.name}</p>
                      <p className="text-[10px] text-secondary">Mile {m.trailMile}</p>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-sm">chevron_right</span>
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
