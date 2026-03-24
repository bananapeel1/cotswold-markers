"use client";

import { useState } from "react";
import { POI, Business, getFacilityEmoji, getBusinessTypeEmoji } from "@/data/types";
import { haversineDistance } from "@/lib/geo";
import { estimateWalkingTime } from "@/lib/constants";

interface NearbyItem {
  name: string;
  type: string;
  emoji: string;
  distance: number;
  walkingTime: string;
  openingHours: string | null;
  isSponsor: boolean;
}

interface NearbyPOIsProps {
  markerLat: number;
  markerLng: number;
  pois: POI[];
  businesses: Business[];
}

export default function NearbyPOIs({
  markerLat,
  markerLng,
  pois,
  businesses,
}: NearbyPOIsProps) {
  const [showAll, setShowAll] = useState(false);

  const items: NearbyItem[] = [];

  for (const poi of pois) {
    const dist = haversineDistance(markerLat, markerLng, poi.latitude, poi.longitude);
    items.push({
      name: poi.name,
      type: poi.type,
      emoji: getFacilityEmoji(poi.type as "pub" | "cafe" | "water" | "shop" | "accommodation" | "campsite" | "toilets"),
      distance: Math.round(dist * 10) / 10,
      walkingTime: estimateWalkingTime(dist),
      openingHours: poi.openingHours,
      isSponsor: false,
    });
  }

  for (const biz of businesses) {
    const dist = haversineDistance(markerLat, markerLng, biz.latitude, biz.longitude);
    items.push({
      name: biz.name,
      type: biz.type,
      emoji: getBusinessTypeEmoji(biz.type),
      distance: Math.round(dist * 10) / 10,
      walkingTime: estimateWalkingTime(dist),
      openingHours: biz.openingHours,
      isSponsor: biz.isSponsor,
    });
  }

  items.sort((a, b) => a.distance - b.distance);
  const visible = showAll ? items : items.slice(0, 8);

  if (items.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide mb-2">
        All nearby ({items.length})
      </p>
      <div className="space-y-1.5">
        {visible.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-low"
          >
            <span className="text-base">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold text-on-surface">
                {item.distance}mi
              </p>
              <p className="text-[10px] text-on-surface-variant">
                ~{item.walkingTime}
              </p>
            </div>
          </div>
        ))}
      </div>
      {items.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center text-sm text-tertiary font-semibold mt-2 py-1"
        >
          {showAll ? "Show less" : `Show all ${items.length} nearby`}
        </button>
      )}
    </div>
  );
}
