import { readFile } from "fs/promises";
import path from "path";
import type { CircularRoute, AccessibleSection } from "./types";

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
