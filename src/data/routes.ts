import { readFile } from "fs/promises";
import path from "path";
import type { CircularRoute, AccessibleSection, ElevationPoint } from "./types";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export type { CircularRoute, AccessibleSection } from "./types";

interface RoutesData {
  routes: CircularRoute[];
  accessibleSections: AccessibleSection[];
}

// Repo JSON is the first-boot seed / emergency fallback; Firestore holds the
// live, dashboard-editable copy (collections: routes, accessibleSections).
async function getRoutesDataFromFile(): Promise<RoutesData> {
  const filePath = path.join(process.cwd(), "public/data/routes.json");
  const data = await readFile(filePath, "utf-8");
  return JSON.parse(data) as RoutesData;
}

export async function getRoutes(): Promise<CircularRoute[]> {
  if (isFirestoreAvailable()) {
    try {
      const snapshot = await getDb().collection("routes").get();
      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => doc.data() as CircularRoute);
      }
    } catch (e) {
      console.warn("Firestore read failed for routes, falling back to JSON:", e);
    }
  }

  const { routes } = await getRoutesDataFromFile();
  return routes;
}

export async function getRouteBySlug(slug: string): Promise<CircularRoute | null> {
  const routes = await getRoutes();
  return routes.find((r) => r.slug === slug) ?? null;
}

export async function getAccessibleSections(): Promise<AccessibleSection[]> {
  if (isFirestoreAvailable()) {
    try {
      const snapshot = await getDb().collection("accessibleSections").get();
      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => doc.data() as AccessibleSection);
      }
    } catch (e) {
      console.warn(
        "Firestore read failed for accessibleSections, falling back to JSON:",
        e
      );
    }
  }

  const { accessibleSections } = await getRoutesDataFromFile();
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

async function readGeometry(source: string): Promise<string | null> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const res = await fetch(source);
    if (!res.ok) return null;
    return res.text();
  }
  const filePath = path.join(process.cwd(), "public", source.replace(/^\//, ""));
  return readFile(filePath, "utf-8");
}

/**
 * Build an elevation profile from a route's GeoJSON, whose coordinates carry
 * the elevation values from the publisher's official GPX. Accepts a local
 * /data/routes/*.geojson path or an absolute URL (admin-uploaded geometry in
 * Firebase Storage). Returns null when the route has no geometry or its
 * geometry has no elevation data.
 */
export async function getElevationProfile(
  geometrySource: string | null,
  maxPoints = 90
): Promise<ElevationPoint[] | null> {
  if (!geometrySource) return null;
  try {
    const raw = await readGeometry(geometrySource);
    if (!raw) return null;
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
