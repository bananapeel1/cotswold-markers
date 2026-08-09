/**
 * Validate all JSON data files before build.
 *
 * Checks:
 * 1. POI/marker coords within Cotswold Way corridor
 * 2. No duplicate IDs in any collection
 * 3. All nearestMarkerIds reference valid markers
 * 4. All POI types are valid
 * 5. No two POIs share identical coordinates
 * 6. Circular routes: valid fields, geometry files exist and form closed
 *    loops, computed length within tolerance of published distance,
 *    poiIds reference real POIs
 *
 * Usage: tsx scripts/validate-data.ts
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import {
  CORRIDOR,
  haversineMiles,
  geometryCoords,
} from "../src/lib/validation/geometry";

const DATA_DIR = path.join(__dirname, "..", "public", "data");

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

const { LAT_MIN, LAT_MAX, LNG_MIN, LNG_MAX } = CORRIDOR;

const VALID_POI_TYPES = [
  "pub",
  "cafe",
  "water",
  "shop",
  "accommodation",
  "campsite",
  "toilets",
  "pharmacy",
  "medical",
  "historic",
];

const VALID_ACCESSIBILITY = ["accessible", "standard", "unknown"];
const VALID_SITE_TYPES = ["prehistoric", "roman", "medieval", "civil-war", "other"];

interface POI {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  nearestMarkerIds: string[];
  accessibility?: string;
  siteType?: string;
  access?: string;
  nhle?: string;
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

// NOTE: marker coordinates were previously locked here (LOCKED_MARKER_COORDS).
// That guard now lives in the admin flow instead: /api/markers PUT rejects
// coordinate changes unless the editor explicitly confirms them
// (confirmCoordinateChange), since Firestore — not this JSON — is the live
// source of truth.

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

interface CircularRoute {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  difficulty: string;
  accessibility: { grade: string } | null;
  geometryFile: string | null;
  poiIds: string[];
  nearestMarkerIds: string[];
  section?: string;
  area?: string;
  pdfUrl?: string | null;
}

interface AccessibleSection {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  nearestMarkerIds: string[];
}

const VALID_DIFFICULTIES = ["easy", "moderate", "challenging"];
const VALID_SECTIONS = ["north", "middle", "south"];
const VALID_GRADES = ["for-all", "for-many", "for-some", "ungraded"];

function checkRoutes(
  routes: CircularRoute[],
  sections: AccessibleSection[],
  poiIds: Set<string>,
  markerIds: Set<string>
) {
  checkDuplicateIds("routes", routes);
  checkDuplicateIds("accessibleSections", sections);
  const slugs = new Set<string>();

  for (const r of routes) {
    if (slugs.has(r.slug)) errors.push(`[routes] Duplicate slug: "${r.slug}"`);
    slugs.add(r.slug);
    if (!VALID_DIFFICULTIES.includes(r.difficulty)) {
      errors.push(`[routes] "${r.name}" has invalid difficulty: "${r.difficulty}"`);
    }
    if (r.accessibility && !VALID_GRADES.includes(r.accessibility.grade)) {
      errors.push(`[routes] "${r.name}" has invalid accessibility grade: "${r.accessibility.grade}"`);
    }
    if (!r.section || !VALID_SECTIONS.includes(r.section)) {
      errors.push(`[routes] "${r.name}" has missing or invalid section: "${r.section}"`);
    }
    if (!r.area) {
      errors.push(`[routes] "${r.name}" has no area (start hub) set`);
    }
    for (const pid of r.poiIds) {
      if (!poiIds.has(pid)) errors.push(`[routes] "${r.name}" references unknown POI: "${pid}"`);
    }
    for (const mid of r.nearestMarkerIds) {
      if (!markerIds.has(mid)) errors.push(`[routes] "${r.name}" references unknown marker: "${mid}"`);
    }

    if (r.geometryFile) {
      const filePath = path.join(__dirname, "..", "public", r.geometryFile.replace(/^\//, ""));
      if (!existsSync(filePath)) {
        errors.push(`[routes] "${r.name}" geometry file missing: ${r.geometryFile}`);
        continue;
      }
      try {
        const coords = geometryCoords(JSON.parse(readFileSync(filePath, "utf-8")));
        if (coords.length < 10) {
          errors.push(`[routes] "${r.name}" geometry has too few points (${coords.length})`);
          continue;
        }
        // Loop closure: start and end within ~250m
        const [sLng, sLat] = coords[0];
        const [eLng, eLat] = coords[coords.length - 1];
        const gapMiles = haversineMiles(sLat, sLng, eLat, eLng);
        if (gapMiles > 0.16) {
          errors.push(
            `[routes] "${r.name}" is not a closed loop: start/end gap ${(gapMiles * 1609).toFixed(0)}m`
          );
        }
        // Length within 25% of published distance
        let lenMiles = 0;
        for (let i = 1; i < coords.length; i++) {
          lenMiles += haversineMiles(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
        }
        const ratio = lenMiles / r.distanceMiles;
        if (ratio < 0.75 || ratio > 1.25) {
          errors.push(
            `[routes] "${r.name}" geometry length ${lenMiles.toFixed(1)}mi differs from published ${r.distanceMiles}mi by >25%`
          );
        }
      } catch {
        errors.push(`[routes] "${r.name}" geometry file is not valid JSON: ${r.geometryFile}`);
      }
    }
  }
}

function main() {
  console.log("Validating data files...\n");

  // Load data
  const pois = readJson<POI[]>("pois.json");
  const markers = readJson<Marker[]>("markers.json");
  const stories = readJson<WithId[]>("stories.json");
  const businesses = readJson<WithId[]>("businesses.json");
  const routesData = readJson<{ routes: CircularRoute[]; accessibleSections: AccessibleSection[] }>(
    "routes.json"
  );

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
    if (poi.accessibility !== undefined && !VALID_ACCESSIBILITY.includes(poi.accessibility)) {
      errors.push(
        `[pois] "${poi.name}" (${poi.id}) has invalid accessibility: "${poi.accessibility}"`
      );
    }
    if (poi.siteType !== undefined && !VALID_SITE_TYPES.includes(poi.siteType)) {
      errors.push(
        `[pois] "${poi.name}" (${poi.id}) has invalid siteType: "${poi.siteType}"`
      );
    }
    if (poi.type === "historic" && !poi.siteType) {
      errors.push(
        `[pois] "${poi.name}" (${poi.id}) is historic but has no siteType`
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

  // 6. Circular routes + accessible sections
  const poiIdSet = new Set(pois.map((p) => p.id));
  checkCoords("routes", routesData.routes as unknown as POI[]);
  checkCoords("accessibleSections", routesData.accessibleSections as unknown as POI[]);
  checkRoutes(routesData.routes, routesData.accessibleSections, poiIdSet, markerIds);

  // Report
  if (errors.length === 0) {
    console.log(`  ✓ pois: ${pois.length} entries valid`);
    console.log(`  ✓ markers: ${markers.length} entries valid`);
    console.log(`  ✓ stories: ${stories.length} entries valid`);
    console.log(`  ✓ businesses: ${businesses.length} entries valid`);
    console.log(
      `  ✓ routes: ${routesData.routes.length} routes + ${routesData.accessibleSections.length} accessible sections valid`
    );
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
