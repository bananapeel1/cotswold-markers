export interface ScanEntry {
  markerId: string;
  timestamp: string;
  weather?: { temp?: number; code?: number; isRaining?: boolean };
  source?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "milestone" | "special" | "seasonal" | "secret";
}

// All marker IDs (first and last)
const FIRST_MARKER = "cw-01-chipping-campden";
const LAST_MARKER = "cw-15-bath";
const TOTAL_MARKERS = 50;

export const BADGES: Badge[] = [
  // Milestone badges
  { id: "first-steps", name: "First Steps", description: "Scan your first marker", icon: "footprint", category: "milestone" },
  { id: "getting-started", name: "Getting Started", description: "Scan 5 markers", icon: "hiking", category: "milestone" },
  { id: "trail-regular", name: "Trail Regular", description: "Scan 10 markers", icon: "landscape", category: "milestone" },
  { id: "half-way-hero", name: "Half Way Hero", description: "Scan 25 markers", icon: "military_tech", category: "milestone" },
  { id: "almost-there", name: "Almost There", description: "Scan 40 markers", icon: "flag", category: "milestone" },
  { id: "cotswold-conqueror", name: "Cotswold Conqueror", description: "Scan all 50 markers", icon: "emoji_events", category: "milestone" },

  // Special badges
  { id: "dawn-walker", name: "Dawn Walker", description: "Scan a marker before 7am", icon: "wb_twilight", category: "special" },
  { id: "night-owl", name: "Night Owl", description: "Scan a marker after 8pm", icon: "dark_mode", category: "special" },
  { id: "speed-demon", name: "Speed Demon", description: "Scan 3 markers in one day", icon: "bolt", category: "special" },
  { id: "weekend-warrior", name: "Weekend Warrior", description: "Scan on a Saturday or Sunday", icon: "calendar_month", category: "special" },
  { id: "rainy-day-hero", name: "Rainy Day Hero", description: "Scan when it's raining", icon: "water_drop", category: "special" },

  // Seasonal badges
  { id: "spring-bloom", name: "Spring Bloom", description: "Scan in March, April, or May", icon: "local_florist", category: "seasonal" },
  { id: "summer-solstice", name: "Summer Solstice", description: "Scan on June 20th or 21st", icon: "wb_sunny", category: "seasonal" },
  { id: "autumn-gold", name: "Autumn Gold", description: "Scan in October or November", icon: "eco", category: "seasonal" },
  { id: "winter-walker", name: "Winter Walker", description: "Scan in December, January, or February", icon: "ac_unit", category: "seasonal" },

  // Photo badges
  { id: "first-snap", name: "First Snap", description: "Share your first community photo", icon: "photo_camera", category: "special" },
  { id: "trail-photographer", name: "Trail Photographer", description: "Share 10 community photos", icon: "camera_roll", category: "milestone" },
  { id: "seasonal-spotter", name: "Seasonal Spotter", description: "Share photos in 3+ different seasons", icon: "filter_vintage", category: "seasonal" },
  { id: "all-eyes", name: "All Eyes", description: "Share photos at 10+ different markers", icon: "visibility", category: "special" },

  // Secret badges
  { id: "bookends", name: "Bookends", description: "Scan both the first and last marker", icon: "menu_book", category: "secret" },
  { id: "completionist", name: "Completionist", description: "Scan all 50 markers within 14 days", icon: "star", category: "secret" },
];

export interface PhotoStats {
  totalPhotos: number;
  uniqueMarkers: number;
  uniqueSeasons: number;
}

export function checkBadges(scans: ScanEntry[], photoStats?: PhotoStats): string[] {
  const earned: string[] = [];
  if (scans.length === 0) return earned;

  const uniqueMarkerIds = new Set(scans.map((s) => s.markerId));
  const uniqueCount = uniqueMarkerIds.size;

  // Milestone badges
  if (uniqueCount >= 1) earned.push("first-steps");
  if (uniqueCount >= 5) earned.push("getting-started");
  if (uniqueCount >= 10) earned.push("trail-regular");
  if (uniqueCount >= 25) earned.push("half-way-hero");
  if (uniqueCount >= 40) earned.push("almost-there");
  if (uniqueCount >= TOTAL_MARKERS) earned.push("cotswold-conqueror");

  // Special badges — check each scan
  for (const scan of scans) {
    const date = new Date(scan.timestamp);
    const hour = date.getHours();
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday

    if (hour < 7) earned.push("dawn-walker");
    if (hour >= 20) earned.push("night-owl");
    if (day === 0 || day === 6) earned.push("weekend-warrior");
    if (scan.weather?.isRaining) earned.push("rainy-day-hero");
  }

  // Speed Demon — 3 unique markers in one calendar day
  const scansByDate = new Map<string, Set<string>>();
  for (const scan of scans) {
    const dateKey = scan.timestamp.slice(0, 10); // YYYY-MM-DD
    if (!scansByDate.has(dateKey)) scansByDate.set(dateKey, new Set());
    scansByDate.get(dateKey)!.add(scan.markerId);
  }
  for (const markers of scansByDate.values()) {
    if (markers.size >= 3) {
      earned.push("speed-demon");
      break;
    }
  }

  // Seasonal badges
  for (const scan of scans) {
    const month = new Date(scan.timestamp).getMonth(); // 0-indexed
    const dayOfMonth = new Date(scan.timestamp).getDate();

    if (month >= 2 && month <= 4) earned.push("spring-bloom"); // Mar-May
    if (month === 5 && (dayOfMonth === 20 || dayOfMonth === 21)) earned.push("summer-solstice"); // June 20-21
    if (month >= 9 && month <= 10) earned.push("autumn-gold"); // Oct-Nov
    if (month === 11 || month <= 1) earned.push("winter-walker"); // Dec-Feb
  }

  // Photo badges
  if (photoStats) {
    if (photoStats.totalPhotos >= 1) earned.push("first-snap");
    if (photoStats.totalPhotos >= 10) earned.push("trail-photographer");
    if (photoStats.uniqueSeasons >= 3) earned.push("seasonal-spotter");
    if (photoStats.uniqueMarkers >= 10) earned.push("all-eyes");
  }

  // Secret badges
  if (uniqueMarkerIds.has(FIRST_MARKER) && uniqueMarkerIds.has(LAST_MARKER)) {
    earned.push("bookends");
  }

  // Completionist — all 15 within 14 days
  if (uniqueCount >= TOTAL_MARKERS) {
    const sortedScans = [...scans].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const firstScan = new Date(sortedScans[0].timestamp);
    const lastScan = new Date(sortedScans[sortedScans.length - 1].timestamp);
    const daysDiff = (lastScan.getTime() - firstScan.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 14) earned.push("completionist");
  }

  // Deduplicate
  return [...new Set(earned)];
}

export interface StreakData {
  current: number;
  best: number;
  lastScanDate: string | null;
}

export function calculateStreak(scans: ScanEntry[]): StreakData {
  if (scans.length === 0) return { current: 0, best: 0, lastScanDate: null };

  // Get unique scan dates sorted
  const dates = [
    ...new Set(scans.map((s) => s.timestamp.slice(0, 10))),
  ].sort();

  let current = 1;
  let best = 1;
  let streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
      best = Math.max(best, streak);
    } else {
      streak = 1;
    }
  }
  current = streak;

  // Check if streak is still active (last scan was today or yesterday)
  const lastDate = dates[dates.length - 1];
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (lastDate !== today && lastDate !== yesterday) {
    current = 0;
  }

  return { current, best, lastScanDate: lastDate };
}

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}
