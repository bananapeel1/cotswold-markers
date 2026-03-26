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
  discountCode?: string;
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
  isHidden?: boolean;
  trailSecret?: string;
}

export type POIType = "pub" | "cafe" | "water" | "shop" | "accommodation" | "campsite" | "toilets";

export interface POI {
  id: string;
  name: string;
  type: POIType;
  description: string;
  latitude: number;
  longitude: number;
  openingHours: string | null;
  nearestMarkerIds: string[];
}

export type TrailConditionType =
  | "muddy"
  | "fallen-tree"
  | "flooded"
  | "overgrown"
  | "slippery"
  | "livestock"
  | "other";

export interface TrailConditionReport {
  id: string;
  markerId: string;
  userId: string;
  userName: string;
  conditionType: TrailConditionType;
  note?: string;
  timestamp: string;
  expiresAt: string;
}

export interface Friendship {
  id: string;
  inviterUid: string;
  inviteeUid: string;
  inviterName: string;
  inviteeName: string;
  createdAt: string;
}

export function getConditionIcon(type: TrailConditionType): string {
  const map: Record<TrailConditionType, string> = {
    muddy: "water_drop",
    "fallen-tree": "park",
    flooded: "flood",
    overgrown: "grass",
    slippery: "warning",
    livestock: "pets",
    other: "info",
  };
  return map[type] || "info";
}

export function getConditionLabel(type: TrailConditionType): string {
  const map: Record<TrailConditionType, string> = {
    muddy: "Muddy",
    "fallen-tree": "Fallen Tree",
    flooded: "Flooded",
    overgrown: "Overgrown",
    slippery: "Slippery",
    livestock: "Livestock",
    other: "Other",
  };
  return map[type] || type;
}

export type ScanCounts = Record<string, number>;

export type PromptCategory = "hungry" | "thirsty" | "rest" | "supplies";

export function getPromptCategory(type: POIType): PromptCategory | null {
  const map: Record<POIType, PromptCategory | null> = {
    pub: "hungry",
    cafe: "hungry",
    water: "thirsty",
    shop: "supplies",
    accommodation: "rest",
    campsite: "rest",
    toilets: null,
  };
  return map[type] ?? null;
}

export function getPromptLabel(category: PromptCategory): string {
  const map: Record<PromptCategory, string> = {
    hungry: "Hungry?",
    thirsty: "Thirsty?",
    rest: "Need a rest?",
    supplies: "Need supplies?",
  };
  return map[category];
}

export function getPromptIcon(category: PromptCategory): string {
  const map: Record<PromptCategory, string> = {
    hungry: "restaurant",
    thirsty: "water_drop",
    rest: "hotel",
    supplies: "shopping_bag",
  };
  return map[category];
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
