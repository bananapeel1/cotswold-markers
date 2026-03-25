"use client";

import { useState } from "react";
import { POI } from "@/data/types";
import { haversineDistance } from "@/lib/geo";

interface ContextualPromptsProps {
  markerLat: number;
  markerLng: number;
  pois: POI[];
}

interface POIWithDist extends POI {
  dist: number;
}

type Category = "food" | "water" | "rest" | "supplies";

const CATEGORIES: {
  id: Category;
  icon: string;
  label: string;
  types: string[];
}[] = [
  { id: "food", icon: "restaurant", label: "Hungry?", types: ["pub", "cafe"] },
  { id: "water", icon: "local_cafe", label: "Thirsty?", types: ["water"] },
  { id: "rest", icon: "park", label: "Need a break?", types: ["accommodation", "campsite"] },
  { id: "supplies", icon: "shopping_basket", label: "Need supplies?", types: ["shop", "toilets"] },
];

function formatDist(miles: number): string {
  if (miles < 0.1) return "Right here";
  if (miles < 1) return `${(miles * 1760).toFixed(0)} yards`;
  return `${miles.toFixed(1)} mi`;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    pub: "Pub",
    cafe: "Café",
    water: "Water",
    shop: "Shop",
    toilets: "Toilets",
    accommodation: "Stay",
    campsite: "Campsite",
  };
  return labels[type] || type;
}

export default function ContextualPrompts({
  markerLat,
  markerLng,
  pois,
}: ContextualPromptsProps) {
  const [expanded, setExpanded] = useState<Category | null>(null);

  function getMatches(types: string[]): POIWithDist[] {
    return pois
      .filter((p) => types.includes(p.type))
      .map((p) => ({
        ...p,
        dist: haversineDistance(markerLat, markerLng, p.latitude, p.longitude),
      }))
      .sort((a, b) => a.dist - b.dist);
  }

  function directionsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
  }

  return (
    <section className="space-y-4 px-4">
      <h3 className="font-headline font-bold text-lg px-2">Discovery</h3>
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const matches = getMatches(cat.types);
          const nearest = matches[0];
          const isExpanded = expanded === cat.id;

          return (
            <div key={cat.id} className="col-span-1">
              {/* Card */}
              <button
                onClick={() => setExpanded(isExpanded ? null : cat.id)}
                className={`w-full text-left bg-surface-container-lowest p-5 rounded-md shadow-ambient hover:shadow-lg transition-all active:scale-[0.97] duration-200 ${
                  isExpanded ? "ring-2 ring-primary/20" : ""
                }`}
              >
                <span className="material-symbols-outlined text-tertiary mb-3">
                  {cat.icon}
                </span>
                <p className="font-headline font-bold text-sm">{cat.label}</p>
                <p className="text-[11px] text-secondary leading-tight mt-1 line-clamp-2">
                  {nearest
                    ? nearest.name
                    : "None nearby — check the next village."}
                </p>
                {nearest && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-primary">
                    <span className="material-symbols-outlined text-xs">
                      near_me
                    </span>
                    {formatDist(nearest.dist)}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Expanded POI list */}
      {expanded && (
        <div className="bg-surface-container-lowest rounded-md p-5 shadow-ambient animate-fade-in-up space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-headline font-bold text-base">
              {CATEGORIES.find((c) => c.id === expanded)?.label}
            </h4>
            <button
              onClick={() => setExpanded(null)}
              className="p-1 hover:bg-surface-container rounded-full"
            >
              <span className="material-symbols-outlined text-secondary text-lg">
                close
              </span>
            </button>
          </div>

          {getMatches(
            CATEGORIES.find((c) => c.id === expanded)?.types || []
          ).map((poi) => (
            <div
              key={poi.id}
              className="flex items-start gap-3 p-3 rounded-md bg-surface-container/50 hover:bg-surface-container transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm truncate">{poi.name}</p>
                  <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider bg-surface-container-high px-2 py-0.5 rounded-full text-secondary">
                    {getTypeLabel(poi.type)}
                  </span>
                </div>
                <p className="text-[11px] text-secondary leading-snug mb-2">
                  {poi.description}
                </p>
                {poi.openingHours && (
                  <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      schedule
                    </span>
                    {poi.openingHours}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-[10px] font-bold text-primary">
                  {formatDist(poi.dist)}
                </span>
                <a
                  href={directionsUrl(poi.latitude, poi.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-primary text-on-primary text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-xs">
                    directions_walk
                  </span>
                  Go
                </a>
              </div>
            </div>
          ))}

          {getMatches(
            CATEGORIES.find((c) => c.id === expanded)?.types || []
          ).length === 0 && (
            <p className="text-sm text-secondary text-center py-4">
              No stops found near this marker. Try the next one along the trail.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
