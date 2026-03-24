import { readFile } from "fs/promises";
import path from "path";
import type { Marker } from "./types";

export type { Marker, FacilityType, EmergencyInfo } from "./types";
export { getFacilityEmoji, getFacilityLabel } from "./types";

let cachedMarkers: Marker[] | null = null;

export async function getMarkers(): Promise<Marker[]> {
  if (cachedMarkers) return cachedMarkers;
  const filePath = path.join(process.cwd(), "public/data/markers.json");
  const data = await readFile(filePath, "utf-8");
  cachedMarkers = JSON.parse(data) as Marker[];
  return cachedMarkers;
}

export async function getMarkerById(
  idOrShortCode: string
): Promise<Marker | undefined> {
  const markers = await getMarkers();
  const normalized = idOrShortCode.toUpperCase();
  return markers.find(
    (m) =>
      m.id === idOrShortCode ||
      m.shortCode === normalized ||
      m.shortCode.toLowerCase() === idOrShortCode.toLowerCase()
  );
}

export async function getMarkerByShortCode(
  shortCode: string
): Promise<Marker | undefined> {
  const markers = await getMarkers();
  return markers.find(
    (m) => m.shortCode.toLowerCase() === shortCode.toLowerCase()
  );
}
