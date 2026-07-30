import { readFile } from "fs/promises";
import path from "path";
import type { CircularRoute, AccessibleSection, ElevationPoint } from "./types";

export type { CircularRoute, AccessibleSection } from "./types";

interface RoutesData {
  routes: CircularRoute[];
  accessibleSections: AccessibleSection[];
}

// Routes are showcase content served straight from the repo JSON —
// no Firestore collection, unlike POIs/markers.
async function getRoutesData(): Promise<RoutesData> {
  const filePath = path.join(process.cwd(), "public/data/routes.json");
  const data = await readFile(filePath, "utf-8");
  return JSON.parse(data) as RoutesData;
}

export async function getRoutes(): Promise<CircularRoute[]> {
  const { routes } = await getRoutesData();
  return routes;
}

export async function getRouteBySlug(slug: string): Promise<CircularRoute | null> {
  const { routes } = await getRoutesData();
  return routes.find((r) => r.slug === slug) ?? null;
}

export async function getAccessibleSections(): Promise<AccessibleSection[]> {
  const { accessibleSections } = await getRoutesData();
  return accessibleSections;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 3958.8;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/**
 * Build an elevation profile from a route's GeoJSON, whose coordinates carry
 * the elevation values from the publisher's official GPX. Returns null when
 * the route has no geometry or its geometry has no elevation data.
 */
export async function getElevationProfile(
  geometryFile: string | null,
  maxPoints = 90
): Promise<ElevationPoint[] | null> {
  if (!geometryFile) return null;
  try {
    const filePath = path.join(process.cwd(), "public", geometryFile.replace(/^\//, ""));
    const raw = await readFile(filePath, "utf-8");
    const gj = JSON.parse(raw) as {
      geometry?: { coordinates: number[][] };
      coordinates?: number[][];
    };
    const coords = gj.geometry?.coordinates ?? gj.coordinates;
    if (!coords || coords.length < 2) return null;
    if (!coords.some((c) => c.length > 2)) return null;

    const points: ElevationPoint[] = [];
    let cumulative = 0;
    for (let i = 0; i < coords.length; i++) {
      if (i > 0) {
        cumulative += haversineMiles(
          coords[i - 1][1],
          coords[i - 1][0],
          coords[i][1],
          coords[i][0]
        );
      }
      const ele = coords[i][2];
      if (ele == null) continue;
      points.push({ distanceMi: Math.round(cumulative * 100) / 100, elevationM: Math.round(ele) });
    }
    if (points.length < 2) return null;

    // Downsample evenly, always keeping first and last
    if (points.length <= maxPoints) return points;
    const step = (points.length - 1) / (maxPoints - 1);
    const sampled: ElevationPoint[] = [];
    for (let i = 0; i < maxPoints; i++) {
      sampled.push(points[Math.round(i * step)]);
    }
    return sampled;
  } catch {
    return null;
  }
}
