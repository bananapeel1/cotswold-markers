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

// Locked marker coordinates — markers are snapped to the trail and must NOT
// be moved without explicit verification. If you need to update a marker's
// position, update the LOCKED_MARKER_COORDS below to match.
// This prevents accidental coordinate changes from reaching production.
const LOCKED_MARKER_COORDS: Record<string, { lat: number; lng: number }> = {
  "cw-01-chipping-campden": { lat: 52.05055, lng: -1.78153 },
  "cw-16-dovers-hill": { lat: 52.0548, lng: -1.80176 },
  "cw-17-fish-hill": { lat: 52.03098, lng: -1.82685 },
  "cw-02-broadway-tower": { lat: 52.02491, lng: -1.83518 },
  "cw-03-broadway-village": { lat: 52.03615, lng: -1.85774 },
  "cw-18-snowshill-ridge": { lat: 52.01667, lng: -1.87454 },
  "cw-04-stanway-house": { lat: 51.96885, lng: -1.92613 },
  "cw-19-hailes-abbey": { lat: 51.96905, lng: -1.9269 },
  "cw-21-sudeley-castle": { lat: 51.95406, lng: -1.96339 },
  "cw-05-winchcombe": { lat: 51.95348, lng: -1.96404 },
  "cw-20-belas-knap": { lat: 51.92769, lng: -1.97078 },
  "cw-22-postlip-hall": { lat: 51.9399, lng: -2.00113 },
  "cw-06-cleeve-hill": { lat: 51.93875, lng: -2.00358 },
  "cw-23-dowdeswell": { lat: 51.88124, lng: -2.01581 },
  "cw-24-seven-springs": { lat: 51.85272, lng: -2.04766 },
  "cw-07-leckhampton": { lat: 51.86433, lng: -2.07762 },
  "cw-25-crickley-hill": { lat: 51.84396, lng: -2.10571 },
  "cw-26-barrow-wake": { lat: 51.83762, lng: -2.10089 },
  "cw-27-birdlip": { lat: 51.82817, lng: -2.11223 },
  "cw-28-coopers-hill": { lat: 51.8294, lng: -2.15924 },
  "cw-29-cranham": { lat: 51.81613, lng: -2.17113 },
  "cw-30-painswick-beacon": { lat: 51.80695, lng: -2.18921 },
  "cw-08-painswick": { lat: 51.78919, lng: -2.19485 },
  "cw-31-edge": { lat: 51.7802, lng: -2.21883 },
  "cw-33-standish-church": { lat: 51.77826, lng: -2.26177 },
  "cw-32-haresfield-beacon": { lat: 51.77922, lng: -2.25826 },
  "cw-09-standish-wood": { lat: 51.75085, lng: -2.25753 },
  "cw-10-coaley-peak": { lat: 51.70662, lng: -2.29927 },
  "cw-35-uley-bury": { lat: 51.69118, lng: -2.31406 },
  "cw-34-cam-long-down": { lat: 51.69346, lng: -2.32618 },
  "cw-11-dursley": { lat: 51.68142, lng: -2.35449 },
  "cw-36-stinchcombe-hill": { lat: 51.68071, lng: -2.38195 },
  "cw-37-tyndale-monument": { lat: 51.65893, lng: -2.37241 },
  "cw-38-wotton-hill": { lat: 51.64262, lng: -2.3592 },
  "cw-12-wotton": { lat: 51.63788, lng: -2.35323 },
  "cw-39-hawkesbury-upton": { lat: 51.58123, lng: -2.32776 },
  "cw-40-horton-court": { lat: 51.56226, lng: -2.3356 },
  "cw-41-little-sodbury": { lat: 51.54345, lng: -2.34937 },
  "cw-13-old-sodbury": { lat: 51.53811, lng: -2.35051 },
  "cw-42-dodington-park": { lat: 51.5231, lng: -2.35669 },
  "cw-43-tormarton": { lat: 51.50764, lng: -2.33447 },
  "cw-44-pennsylvania": { lat: 51.4587, lng: -2.3705 },
  "cw-45-dyrham-park": { lat: 51.47689, lng: -2.37626 },
  "cw-46-cold-ashton": { lat: 51.44742, lng: -2.3768 },
  "cw-14-cold-ashton": { lat: 51.43619, lng: -2.3833 },
  "cw-47-grenville-monument": { lat: 51.43128, lng: -2.40147 },
  "cw-48-prospect-stile": { lat: 51.41301, lng: -2.41403 },
  "cw-49-kelston-round-hill": { lat: 51.40484, lng: -2.41641 },
  "cw-50-weston": { lat: 51.39551, lng: -2.38865 },
  "cw-15-bath": { lat: 51.38137, lng: -2.35947 },
};

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

  // 2b. Marker coordinate lock — block changes to marker positions
  for (const marker of markers) {
    const locked = LOCKED_MARKER_COORDS[marker.id];
    if (locked) {
      if (marker.latitude !== locked.lat || marker.longitude !== locked.lng) {
        errors.push(
          `[markers] "${marker.name}" (${marker.id}) coordinates changed! ` +
          `Expected (${locked.lat}, ${locked.lng}) but found (${marker.latitude}, ${marker.longitude}). ` +
          `Marker positions are locked. Update LOCKED_MARKER_COORDS in validate-data.ts if this change is intentional.`
        );
      }
    }
  }

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
