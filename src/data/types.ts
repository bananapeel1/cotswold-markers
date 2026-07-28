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
  hintPhoto?: string;
  hintText?: string;
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
  audioUrl?: string;
}

export type POIType =
  | "pub"
  | "cafe"
  | "water"
  | "shop"
  | "accommodation"
  | "campsite"
  | "toilets"
  | "pharmacy"
  | "medical"
  | "historic";

// Toilets: whether an accessible (disabled) toilet is provided at the site
export type ToiletAccessibility = "accessible" | "standard" | "unknown";

export type HistoricSiteType = "prehistoric" | "roman" | "medieval" | "civil-war" | "other";

export interface POI {
  id: string;
  name: string;
  type: POIType;
  description: string;
  latitude: number;
  longitude: number;
  openingHours: string | null;
  nearestMarkerIds: string[];
  accessibility?: ToiletAccessibility; // toilets only
  siteType?: HistoricSiteType; // historic only
  access?: string; // historic only — public access note, e.g. "Visible from the trail; no public access"
  nhle?: string; // historic only — Historic England NHLE list entry number
}

// Circular routes connected to the Cotswold Way.
// Accessibility grades follow the Miles Without Stiles convention used by
// England's National Landscapes: never self-certified — only published
// gradings, with provenance carried alongside.
export type AccessibilityGrade = "for-all" | "for-many" | "for-some" | "ungraded";

export interface RouteAccessibility {
  grade: AccessibilityGrade;
  summary: string; // the publisher's own wording
  source: string; // publishing body, e.g. "Cotswolds National Landscape"
  sourceUrl: string;
  lastVerified: string; // ISO date the source was checked
}

export interface CircularRoute {
  id: string;
  slug: string;
  name: string;
  description: string;
  startLocation: string;
  latitude: number; // start point
  longitude: number;
  nearestMarkerIds: string[];
  distanceMiles: number;
  ascentM: number | null;
  estimatedTime: string | null;
  difficulty: "easy" | "moderate" | "challenging";
  accessibility: RouteAccessibility | null;
  officialUrl: string;
  gpxUrl: string | null; // official download on the publisher's site
  geometryFile: string | null; // e.g. "/data/routes/uley-bury.geojson" when verified geometry exists
  poiIds: string[]; // POIs within ~250m of the route line (computed)
  source: string; // publishing body
}

export interface AccessibleSection {
  id: string;
  name: string;
  description: string; // the publisher's claim about this stretch
  startLocation: string;
  latitude: number;
  longitude: number;
  distanceMiles: number | null;
  nearestMarkerIds: string[];
  source: string;
  sourceUrl: string;
  lastVerified: string;
}

export function getAccessibilityGradeLabel(grade: AccessibilityGrade): string {
  const map: Record<AccessibilityGrade, string> = {
    "for-all": "Accessible for all",
    "for-many": "Accessible for many",
    "for-some": "Accessible for some",
    ungraded: "Not yet graded",
  };
  return map[grade] || grade;
}

export function getDifficultyLabel(difficulty: CircularRoute["difficulty"]): string {
  const map: Record<CircularRoute["difficulty"], string> = {
    easy: "Easy",
    moderate: "Moderate",
    challenging: "Challenging",
  };
  return map[difficulty] || difficulty;
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
  photoUrl?: string;
  photoStoragePath?: string;
  timestamp: string;
  expiresAt: string;
}

export interface CommunityPhoto {
  id: string;
  markerId: string;
  userId: string;
  userName: string;
  photoUrl: string;
  storagePath: string;
  source: "journal" | "condition";
  sourceId: string;
  month: number;
  timestamp: string;
  expiresAt: string | null;
  moderationStatus: "published" | "flagged" | "rejected";
  moderationReason: string | null;
  reportCount: number;
}

export type MarkerIssueType = "missing" | "damaged" | "obscured" | "wrong-location" | "other";

export interface MarkerReport {
  id: string;
  markerId: string;
  userId: string;
  userName: string;
  issueType: MarkerIssueType;
  note: string;
  photoUrl?: string;
  photoStoragePath?: string;
  status: "open" | "acknowledged" | "resolved";
  timestamp: string;
  resolvedAt?: string;
  adminNote?: string;
}

export function getIssueIcon(type: MarkerIssueType): string {
  const map: Record<MarkerIssueType, string> = {
    missing: "search_off",
    damaged: "broken_image",
    obscured: "visibility_off",
    "wrong-location": "wrong_location",
    other: "info",
  };
  return map[type] || "info";
}

export function getIssueLabel(type: MarkerIssueType): string {
  const map: Record<MarkerIssueType, string> = {
    missing: "Missing",
    damaged: "Damaged",
    obscured: "Obscured",
    "wrong-location": "Wrong Location",
    other: "Other",
  };
  return map[type] || type;
}

export type BlogCategory = "route" | "tips" | "seasonal" | "news" | "community";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string | null;
  category: BlogCategory;
  author: string;
  publishedAt: string;
  updatedAt: string;
  isPublished: boolean;
}

export function getBlogCategoryIcon(category: BlogCategory): string {
  const map: Record<BlogCategory, string> = {
    route: "route",
    tips: "lightbulb",
    seasonal: "eco",
    news: "campaign",
    community: "groups",
  };
  return map[category] || "article";
}

export function getBlogCategoryLabel(category: BlogCategory): string {
  const map: Record<BlogCategory, string> = {
    route: "Route Guide",
    tips: "Walking Tips",
    seasonal: "Seasonal",
    news: "Trail News",
    community: "Community",
  };
  return map[category] || category;
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
    pharmacy: "supplies",
    medical: null,
    historic: null,
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

export function getPOIEmoji(type: POIType): string {
  const map: Record<POIType, string> = {
    pub: "🍺",
    cafe: "☕",
    water: "💧",
    toilets: "🚻",
    shop: "🛒",
    campsite: "⛺",
    accommodation: "🛏️",
    pharmacy: "💊",
    medical: "🏥",
    historic: "🏛️",
  };
  return map[type] || "📍";
}

export function getPOILabel(type: POIType): string {
  const map: Record<POIType, string> = {
    pub: "Pub",
    cafe: "Café",
    water: "Water",
    toilets: "Toilets",
    shop: "Shop",
    campsite: "Campsite",
    accommodation: "Accommodation",
    pharmacy: "Pharmacy",
    medical: "Medical",
    historic: "Historic Site",
  };
  return map[type] || type;
}

export function getSiteTypeLabel(siteType: HistoricSiteType): string {
  const map: Record<HistoricSiteType, string> = {
    prehistoric: "Prehistoric",
    roman: "Roman",
    medieval: "Medieval",
    "civil-war": "Civil War",
    other: "Historic",
  };
  return map[siteType] || siteType;
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
