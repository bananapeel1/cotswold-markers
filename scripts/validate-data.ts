/**
 * Validate all JSON data files before build.
 *
 * Checks:
 * 1. POI/marker coords within Cotswold Way corridor
 * 2. No duplicate IDs in any collection
 * 3. All nearestMarkerIds reference valid markers
 * 4. All POI types are valid
 * 5. No two POIs share identical coordinates
 *
 * Usage: tsx scripts/validate-data.ts
 */

import { readFileSync } from "fs";
import path from "path";

const DATA_DIR = path.join(__dirname, "..", "public", "data");

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

// Cotswold Way corridor bounds (with generous margin)
const LAT_MIN = 51.3;
const LAT_MAX = 52.1;
const LNG_MIN = -2.5;
const LNG_MAX = -1.7;

const VALID_POI_TYPES = [
  "pub",
  "cafe",
  "water",
  "shop",
  "accommodation",
  "campsite",
  "toilets",
];

interface POI {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  nearestMarkerIds: string[];
}

interface Marker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface WithId {
  id: string;
}

let errors: string[] = [];

function checkDuplicateIds(collection: string, items: WithId[]) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push(`[${collection}] Duplicate ID: "${item.id}"`);
    }
    seen.add(item.id);
  }
}

function checkCoords(
  collection: string,
  items: { id: string; name: string; latitude: number; longitude: number }[]
) {
  for (const item of items) {
    if (
      item.latitude < LAT_MIN ||
      item.latitude > LAT_MAX ||
      item.longitude < LNG_MIN ||
      item.longitude > LNG_MAX
    ) {
      errors.push(
        `[${collection}] "${item.name}" (${item.id}) coords out of bounds: ${item.latitude}, ${item.longitude}`
      );
    }
  }
}

function checkDuplicateCoords(pois: POI[]) {
  // Only flag exact coordinate matches of the SAME type
  // (different types at the same location is normal — e.g. pub + accommodation)
  const coordMap = new Map<string, string>();
  for (const poi of pois) {
    const key = `${poi.type}:${poi.latitude},${poi.longitude}`;
    if (coordMap.has(key)) {
      errors.push(
        `[pois] Duplicate coordinates (same type "${poi.type}"): "${poi.name}" and "${coordMap.get(key)}" both at ${poi.latitude},${poi.longitude}`
      );
    }
    coordMap.set(key, poi.name);
  }
}

function main() {
  console.log("Validating data files...\n");

  // Load data
  const pois = readJson<POI[]>("pois.json");
  const markers = readJson<Marker[]>("markers.json");
  const stories = readJson<WithId[]>("stories.json");
  const businesses = readJson<WithId[]>("businesses.json");

  // Valid marker IDs for cross-reference
  const markerIds = new Set(markers.map((m) => m.id));

  // 1. Duplicate IDs
  checkDuplicateIds("pois", pois);
  checkDuplicateIds("markers", markers);
  checkDuplicateIds("stories", stories);
  checkDuplicateIds("businesses", businesses);

  // 2. Coordinate bounds
  checkCoords("pois", pois);
  checkCoords("markers", markers);

  // 3. Valid POI types
  for (const poi of pois) {
    if (!VALID_POI_TYPES.includes(poi.type)) {
      errors.push(
        `[pois] "${poi.name}" (${poi.id}) has invalid type: "${poi.type}"`
      );
    }
  }

  // 4. nearestMarkerIds reference valid markers
  for (const poi of pois) {
    for (const mid of poi.nearestMarkerIds) {
      if (!markerIds.has(mid)) {
        errors.push(
          `[pois] "${poi.name}" (${poi.id}) references unknown marker: "${mid}"`
        );
      }
    }
  }

  // 5. No duplicate coordinates
  checkDuplicateCoords(pois);

  // Report
  if (errors.length === 0) {
    console.log(`  ✓ pois: ${pois.length} entries valid`);
    console.log(`  ✓ markers: ${markers.length} entries valid`);
    console.log(`  ✓ stories: ${stories.length} entries valid`);
    console.log(`  ✓ businesses: ${businesses.length} entries valid`);
    console.log("\n✓ All data validation passed.\n");
  } else {
    console.error(`\n✗ ${errors.length} validation error(s) found:\n`);
    for (const err of errors) {
      console.error(`  ✗ ${err}`);
    }
    console.error("");
    process.exit(1);
  }
}

main();
