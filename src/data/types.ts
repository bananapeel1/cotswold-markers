// Shared types - safe to import from client components

export type FacilityType =
  | "pub"
  | "cafe"
  | "water"
  | "toilets"
  | "shop"
  | "parking"
  | "bus"
  | "campsite"
  | "accommodation";

export interface EmergencyInfo {
  nearestRoad: string;
  gridReference: string;
  what3words: string;
  nearestPhone: string;
  mountainRescue: string;
}

export interface Marker {
  id: string;
  shortCode: string;
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  trailMile: number;
  elevation_m: number;
  segment: string;
  dayOnTrail: number;
  description: string;
  facilities: FacilityType[];
  emergencyInfo: EmergencyInfo;
  storyIds: string[];
  businessIds: string[];
  nextMarkerId: string | null;
  prevMarkerId: string | null;
  distanceToNext_miles: number;
  isActive: boolean;
  imageUrl: string;
}

export interface Business {
  id: string;
  name: string;
  type: "pub" | "cafe" | "shop" | "accommodation" | "transport" | "gear" | "spa";
  description: string;
  offer: string | null;
  offerExpiry: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string | null;
  openingHours: string;
  distanceFromTrail_miles: number;
  imageUrl: string;
  isSponsor: boolean;
  markerIds: string[];
}

export interface Story {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: "history" | "nature" | "legend" | "local" | "geology";
  imageUrl: string | null;
  attribution: string | null;
  markerIds: string[];
}

// Utility functions safe for client use

export function getFacilityEmoji(facility: FacilityType): string {
  const map: Record<FacilityType, string> = {
    pub: "🍺",
    cafe: "☕",
    water: "💧",
    toilets: "🚻",
    shop: "🛒",
    parking: "🅿️",
    bus: "🚌",
    campsite: "⛺",
    accommodation: "🛏️",
  };
  return map[facility] || "📍";
}

export function getFacilityLabel(facility: FacilityType): string {
  const map: Record<FacilityType, string> = {
    pub: "Pub",
    cafe: "Café",
    water: "Water",
    toilets: "Toilets",
    shop: "Shop",
    parking: "Parking",
    bus: "Bus Stop",
    campsite: "Campsite",
    accommodation: "Accommodation",
  };
  return map[facility] || facility;
}

export function getBusinessTypeEmoji(type: Business["type"]): string {
  const map: Record<Business["type"], string> = {
    pub: "🍺",
    cafe: "☕",
    shop: "🛒",
    accommodation: "🛏️",
    transport: "🚐",
    gear: "🎒",
    spa: "♨️",
  };
  return map[type] || "📍";
}

export function getCategoryEmoji(category: Story["category"]): string {
  const map: Record<Story["category"], string> = {
    history: "🏛️",
    nature: "🌿",
    legend: "🐉",
    local: "📖",
    geology: "🪨",
  };
  return map[category] || "📖";
}
