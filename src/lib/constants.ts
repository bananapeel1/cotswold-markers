export const TRAIL = {
  name: "Cotswold Way",
  totalMiles: 102,
  start: "Chipping Campden",
  end: "Bath",
  center: [-2.07, 51.75] as [number, number],
  zoom: 8.5,
  mapStyle: "mapbox://styles/mapbox/outdoors-v12",
  trailColor: "#541600",
  markerColor: "#173124",
  activeMarkerColor: "#541600",
} as const;

export const WALKING_SPEED_MPH = 2.5;

export function estimateWalkingTime(miles: number): string {
  const hours = miles / WALKING_SPEED_MPH;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
