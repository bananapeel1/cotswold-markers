"use client";

import { POI } from "@/data/types";
import { haversineDistance } from "@/lib/geo";

interface ContextualPromptsProps {
  markerLat: number;
  markerLng: number;
  pois: POI[];
}

export default function ContextualPrompts({
  markerLat,
  markerLng,
  pois,
}: ContextualPromptsProps) {
  function getNearest(types: string[]): { name: string; desc: string } | null {
    const matches = pois
      .filter((p) => types.includes(p.type))
      .map((p) => ({
        ...p,
        dist: haversineDistance(markerLat, markerLng, p.latitude, p.longitude),
      }))
      .sort((a, b) => a.dist - b.dist);
    if (matches.length === 0) return null;
    return { name: matches[0].name, desc: matches[0].description };
  }

  const food = getNearest(["pub", "cafe"]);
  const water = getNearest(["water"]);
  const rest = getNearest(["accommodation", "campsite"]);
  const shop = getNearest(["shop"]);

  const cards = [
    { icon: "restaurant", label: "Hungry?", desc: food?.desc || "Check the next village for options.", color: "text-tertiary" },
    { icon: "local_cafe", label: "Thirsty?", desc: water?.desc || "Water refill station ahead.", color: "text-tertiary" },
    { icon: "park", label: "Need a break?", desc: rest?.desc || "Rest stops with scenic views ahead.", color: "text-tertiary" },
    { icon: "shopping_basket", label: "Need supplies?", desc: shop?.desc || "Village shop at the next stop.", color: "text-tertiary" },
  ];

  return (
    <section className="space-y-4 px-4">
      <h3 className="font-headline font-bold text-lg px-2">Discovery</h3>
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-container-lowest p-5 rounded-md shadow-ambient hover:shadow-lg transition-shadow active:scale-95 duration-200"
          >
            <span className={`material-symbols-outlined ${card.color} mb-3`}>
              {card.icon}
            </span>
            <p className="font-headline font-bold text-sm">{card.label}</p>
            <p className="text-[11px] text-secondary leading-tight mt-1 line-clamp-2">
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
