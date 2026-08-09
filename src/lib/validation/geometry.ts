/**
 * Geometry rules shared by the admin route editor, the routes API, and the
 * prebuild data validator. Ported from scripts/validate-data.ts so every
 * surface enforces the same constraints.
 */

// Cotswold Way corridor bounds (with generous margin)
export const CORRIDOR = {
  LAT_MIN: 51.3,
  LAT_MAX: 52.1,
  LNG_MIN: -2.5,
  LNG_MAX: -1.7,
} as const;

export function inCorridor(latitude: number, longitude: number): boolean {
  return (
    latitude >= CORRIDOR.LAT_MIN &&
    latitude <= CORRIDOR.LAT_MAX &&
    longitude >= CORRIDOR.LNG_MIN &&
    longitude <= CORRIDOR.LNG_MAX
  );
}

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
 * Flatten any GeoJSON shape (Feature, FeatureCollection, bare geometry) into
 * an ordered coordinate list. Positions keep their third ordinate (elevation)
 * when present.
 */
export function geometryCoords(geojson: unknown): number[][] {
  const coords: number[][] = [];
  const collect = (geom: { type: string; coordinates: unknown }) => {
    if (geom.type === "LineString") coords.push(...(geom.coordinates as number[][]));
    else if (geom.type === "MultiLineString")
      (geom.coordinates as number[][][]).forEach((l) => coords.push(...l));
  };
  const gj = geojson as {
    type: string;
    geometry?: { type: string; coordinates: unknown };
    features?: Array<{ geometry: { type: string; coordinates: unknown } }>;
    coordinates?: unknown;
  };
  if (gj.type === "FeatureCollection") gj.features?.forEach((f) => collect(f.geometry));
  else if (gj.type === "Feature" && gj.geometry) collect(gj.geometry);
  else collect(gj as { type: string; coordinates: unknown });
  return coords;
}

export interface GeometryCheck {
  errors: string[];
  warnings: string[];
  lengthMiles: number;
  hasElevation: boolean;
}

/**
 * Validate a circular route's geometry: enough points, a closed loop
 * (start/end within ~250m), computed length within 25% of the published
 * distance, and every point inside the Cotswold Way corridor. Missing
 * elevation is a warning, not an error — the route simply won't get an
 * elevation profile.
 */
export function checkRouteGeometry(
  coords: number[][],
  publishedDistanceMiles: number
): GeometryCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (coords.length < 10) {
    errors.push(`Geometry has too few points (${coords.length}, need at least 10)`);
    return { errors, warnings, lengthMiles: 0, hasElevation: false };
  }

  const [sLng, sLat] = coords[0];
  const [eLng, eLat] = coords[coords.length - 1];
  const gapMiles = haversineMiles(sLat, sLng, eLat, eLng);
  if (gapMiles > 0.16) {
    errors.push(
      `Not a closed loop: start/end gap is ${(gapMiles * 1609).toFixed(0)}m (max ~250m)`
    );
  }

  let lengthMiles = 0;
  for (let i = 1; i < coords.length; i++) {
    lengthMiles += haversineMiles(
      coords[i - 1][1],
      coords[i - 1][0],
      coords[i][1],
      coords[i][0]
    );
  }
  if (publishedDistanceMiles > 0) {
    const ratio = lengthMiles / publishedDistanceMiles;
    if (ratio < 0.75 || ratio > 1.25) {
      errors.push(
        `Geometry length ${lengthMiles.toFixed(1)}mi differs from published ${publishedDistanceMiles}mi by more than 25%`
      );
    }
  }

  const outOfBounds = coords.some(([lng, lat]) => !inCorridor(lat, lng));
  if (outOfBounds) {
    errors.push("Geometry has points outside the Cotswold Way corridor");
  }

  const hasElevation = coords.some((c) => c.length > 2 && c[2] != null);
  if (!hasElevation) {
    warnings.push(
      "Geometry has no elevation data — the route will render without an elevation profile"
    );
  }

  return { errors, warnings, lengthMiles, hasElevation };
}
