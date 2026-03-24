"use client";

import { useState } from "react";
import {
  POI,
  Business,
  PromptCategory,
  getPromptCategory,
  getPromptLabel,
  getPromptIcon,
  getFacilityEmoji,
} from "@/data/types";
import { haversineDistance } from "@/lib/geo";
import { estimateWalkingTime } from "@/lib/constants";

interface POIWithDistance {
  name: string;
  type: string;
  distance: number;
  walkingTime: string;
  emoji: string;
  openingHours: string | null;
  offer?: string | null;
  isSponsor?: boolean;
}

interface ContextualPromptsProps {
  markerLat: number;
  markerLng: number;
  pois: POI[];
  businesses: Business[];
  storyCount: number;
}

export default function ContextualPrompts({
  markerLat,
  markerLng,
  pois,
  businesses,
  storyCount,
}: ContextualPromptsProps) {
  const [expanded, setExpanded] = useState<PromptCategory | "curious" | null>(null);

  // Group POIs by prompt category with distances
  const grouped: Record<PromptCategory, POIWithDistance[]> = {
    hungry: [],
    thirsty: [],
    rest: [],
    supplies: [],
  };

  for (const poi of pois) {
    const cat = getPromptCategory(poi.type);
    if (!cat) continue;
    const dist = haversineDistance(markerLat, markerLng, poi.latitude, poi.longitude);
    grouped[cat].push({
      name: poi.name,
      type: poi.type,
      distance: Math.round(dist * 10) / 10,
      walkingTime: estimateWalkingTime(dist),
      emoji: getFacilityEmoji(poi.type as "pub" | "cafe" | "water" | "shop" | "accommodation" | "campsite"),
      openingHours: poi.openingHours,
    });
  }

  // Add sponsor businesses to hungry category
  for (const biz of businesses) {
    if (biz.type === "pub" || biz.type === "cafe") {
      const dist = haversineDistance(markerLat, markerLng, biz.latitude, biz.longitude);
      grouped.hungry.push({
        name: biz.name,
        type: biz.type,
        distance: Math.round(dist * 10) / 10,
        walkingTime: estimateWalkingTime(dist),
        emoji: getFacilityEmoji(biz.type),
        openingHours: biz.openingHours,
        offer: biz.offer,
        isSponsor: true,
      });
    }
    if (biz.type === "accommodation") {
      const dist = haversineDistance(markerLat, markerLng, biz.latitude, biz.longitude);
      grouped.rest.push({
        name: biz.name,
        type: biz.type,
        distance: Math.round(dist * 10) / 10,
        walkingTime: estimateWalkingTime(dist),
        emoji: "🛏️",
        openingHours: biz.openingHours,
        offer: biz.offer,
        isSponsor: true,
      });
    }
  }

  // Sort each group by distance
  for (const cat of Object.keys(grouped) as PromptCategory[]) {
    grouped[cat].sort((a, b) => a.distance - b.distance);
  }

  const categories: (PromptCategory | "curious")[] = ["hungry", "thirsty", "rest", "supplies"];
  if (storyCount > 0) categories.push("curious");

  return (
    <div className="px-4 pb-4 space-y-2">
      {categories.map((cat) => {
        if (cat === "curious") {
          const isOpen = expanded === "curious";
          return (
            <button
              key="curious"
              onClick={() => setExpanded(isOpen ? null : "curious")}
              className="w-full text-left bg-surface-container-low rounded-xl p-4 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-xl">
                    auto_stories
                  </span>
                  <span className="font-headline font-semibold text-primary">
                    Curious?
                  </span>
                </div>
                <span className="text-sm text-on-surface-variant">
                  {storyCount} {storyCount === 1 ? "story" : "stories"} here
                </span>
              </div>
            </button>
          );
        }

        const items = grouped[cat];
        if (items.length === 0) return null;

        const isOpen = expanded === cat;
        const nearest = items[0];

        return (
          <div key={cat} className="bg-surface-container-low rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : cat)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl">
                  {getPromptIcon(cat)}
                </span>
                <span className="font-headline font-semibold text-primary">
                  {getPromptLabel(cat)}
                </span>
              </div>
              <span className="text-sm text-on-surface-variant">
                {nearest.name} · {nearest.distance}mi
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-2">
                {items.slice(0, 4).map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      item.isSponsor
                        ? "bg-tertiary-fixed"
                        : "bg-surface-container-high"
                    }`}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">
                          {item.name}
                        </p>
                        {item.isSponsor && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-tertiary text-on-tertiary uppercase">
                            Offer
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {item.distance} miles · ~{item.walkingTime}
                        {item.openingHours ? ` · ${item.openingHours}` : ""}
                      </p>
                      {item.offer && (
                        <p className="text-xs font-semibold text-tertiary mt-1">
                          {item.offer}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
