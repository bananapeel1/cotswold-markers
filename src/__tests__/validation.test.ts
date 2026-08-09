import { describe, it, expect } from "vitest";
import {
  poiSchema,
  storySchema,
  routeSchema,
  businessSchema,
  markerSchema,
  formatIssues,
} from "@/lib/validation/schemas";
import {
  checkRouteGeometry,
  geometryCoords,
  inCorridor,
} from "@/lib/validation/geometry";

const validPoi = {
  id: "poi-test",
  name: "Test Pub",
  type: "pub",
  description: "A pub",
  latitude: 51.75,
  longitude: -2.07,
  openingHours: null,
  nearestMarkerIds: ["cw-01-chipping-campden"],
};

describe("poiSchema", () => {
  it("accepts a valid POI", () => {
    expect(poiSchema.safeParse(validPoi).success).toBe(true);
  });

  it("rejects coordinates outside the Cotswold corridor", () => {
    const result = poiSchema.safeParse({ ...validPoi, latitude: 53.5 });
    expect(result.success).toBe(false);
  });

  it("rejects a 0,0 unplaced POI", () => {
    const result = poiSchema.safeParse({
      ...validPoi,
      latitude: 0,
      longitude: 0,
    });
    expect(result.success).toBe(false);
  });

  it("requires siteType on historic POIs", () => {
    const result = poiSchema.safeParse({ ...validPoi, type: "historic" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatIssues(result.error).join(" ")).toContain("siteType");
    }
  });

  it("accepts historic POIs with siteType, access and nhle", () => {
    const result = poiSchema.safeParse({
      ...validPoi,
      type: "historic",
      siteType: "prehistoric",
      access: "Open access",
      nhle: "1003324",
      verification: {
        status: "verified",
        source: "Historic England (NHLE)",
        lastVerified: "2026-07-28",
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("storySchema", () => {
  const validStory = {
    id: "story-test",
    title: "A Story",
    summary: "Summary",
    body: "Body text",
    category: "history",
    imageUrl: null,
    attribution: null,
    markerIds: ["cw-01-chipping-campden"],
  };

  it("accepts a valid story", () => {
    expect(storySchema.safeParse(validStory).success).toBe(true);
  });

  it("requires a summary", () => {
    expect(
      storySchema.safeParse({ ...validStory, summary: "" }).success
    ).toBe(false);
  });

  it("accepts the newer culture/heritage/folklore categories", () => {
    for (const category of ["culture", "heritage", "folklore"]) {
      expect(
        storySchema.safeParse({ ...validStory, category }).success
      ).toBe(true);
    }
  });

  it("rejects unknown categories", () => {
    expect(
      storySchema.safeParse({ ...validStory, category: "gossip" }).success
    ).toBe(false);
  });
});

describe("routeSchema", () => {
  const validRoute = {
    id: "route-test-loop",
    slug: "test-loop",
    name: "Test Loop",
    description: "A loop",
    startLocation: "Somewhere",
    latitude: 51.75,
    longitude: -2.07,
    nearestMarkerIds: [],
    poiIds: [],
    distanceMiles: 4.5,
    ascentM: 120,
    estimatedTime: "2 hrs",
    difficulty: "moderate",
    accessibility: null,
    officialUrl: "https://example.org/walk",
    gpxUrl: null,
    pdfUrl: null,
    geometryFile: null,
    source: "Cotswolds National Landscape",
    section: "middle",
    area: "Painswick",
  };

  it("accepts a valid route", () => {
    expect(routeSchema.safeParse(validRoute).success).toBe(true);
  });

  it("rejects invalid difficulty", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, difficulty: "brutal" }).success
    ).toBe(false);
  });

  it("rejects an uppercase slug", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, slug: "Test Loop" }).success
    ).toBe(false);
  });

  it("rejects zero distance", () => {
    expect(
      routeSchema.safeParse({ ...validRoute, distanceMiles: 0 }).success
    ).toBe(false);
  });

  it("requires accessibility grade provenance when graded", () => {
    const result = routeSchema.safeParse({
      ...validRoute,
      accessibility: { grade: "for-many" },
    });
    expect(result.success).toBe(false);
  });
});

describe("businessSchema", () => {
  const validBiz = {
    id: "biz-test",
    name: "Test Inn",
    type: "pub",
    description: "",
    offer: null,
    offerExpiry: null,
    address: "",
    latitude: 51.75,
    longitude: -2.07,
    phone: "",
    website: null,
    openingHours: "",
    distanceFromTrail_miles: 0.2,
    imageUrl: "",
    isSponsor: true,
    markerIds: [],
  };

  it("accepts a valid business", () => {
    expect(businessSchema.safeParse(validBiz).success).toBe(true);
  });

  it("allows 0,0 as 'not yet placed'", () => {
    expect(
      businessSchema.safeParse({ ...validBiz, latitude: 0, longitude: 0 })
        .success
    ).toBe(true);
  });

  it("rejects non-zero coords outside the corridor", () => {
    expect(
      businessSchema.safeParse({ ...validBiz, latitude: 48.8, longitude: 2.35 })
        .success
    ).toBe(false);
  });
});

describe("markerSchema", () => {
  it("accepts a marker with season and walking-time fields", () => {
    const result = markerSchema.safeParse({
      id: "cw-99-test",
      shortCode: "CW99",
      name: "Test Marker",
      latitude: 51.75,
      longitude: -2.07,
      trailMile: 10,
      elevation_m: 200,
      dayOnTrail: 2,
      walkingTimeToNext: "45min",
      seasonBeforeLabel: "Summer",
      seasonAfterImage: "https://example.org/x.jpg",
    });
    expect(result.success).toBe(true);
  });
});

// ---- Geometry rules ----

/** Closed 12-point loop around the trail centre, with elevation. */
function makeLoop(withElevation = true): number[][] {
  const cLat = 51.75;
  const cLng = -2.07;
  const r = 0.008;
  const coords: number[][] = [];
  for (let i = 0; i <= 12; i++) {
    const angle = (i / 12) * 2 * Math.PI;
    const point = [cLng + r * Math.cos(angle), cLat + r * Math.sin(angle)];
    if (withElevation) point.push(100 + 10 * Math.sin(angle));
    coords.push(point);
  }
  return coords;
}

describe("checkRouteGeometry", () => {
  it("passes a closed loop whose length matches the published distance", () => {
    const coords = makeLoop();
    const probe = checkRouteGeometry(coords, 1);
    const result = checkRouteGeometry(coords, probe.lengthMiles);
    expect(result.errors).toEqual([]);
    expect(result.hasElevation).toBe(true);
  });

  it("rejects too few points", () => {
    const result = checkRouteGeometry(makeLoop().slice(0, 5), 1);
    expect(result.errors.join(" ")).toContain("too few points");
  });

  it("rejects an open (non-loop) line", () => {
    const open = makeLoop().slice(0, 10); // drop the closing points
    const result = checkRouteGeometry(open, checkRouteGeometry(open, 1).lengthMiles);
    expect(result.errors.join(" ")).toContain("closed loop");
  });

  it("rejects length differing >25% from published distance", () => {
    const coords = makeLoop();
    const result = checkRouteGeometry(coords, 100);
    expect(result.errors.join(" ")).toContain("differs from published");
  });

  it("warns (not errors) when elevation is missing", () => {
    const coords = makeLoop(false);
    const probe = checkRouteGeometry(coords, 1);
    const result = checkRouteGeometry(coords, probe.lengthMiles);
    expect(result.errors).toEqual([]);
    expect(result.hasElevation).toBe(false);
    expect(result.warnings.join(" ")).toContain("elevation");
  });
});

describe("geometryCoords", () => {
  it("extracts coordinates from a Feature", () => {
    const coords = geometryCoords({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [[-2.07, 51.75, 100], [-2.08, 51.76, 110]] },
    });
    expect(coords).toHaveLength(2);
    expect(coords[0][2]).toBe(100);
  });

  it("extracts coordinates from a FeatureCollection with MultiLineString", () => {
    const coords = geometryCoords({
      type: "FeatureCollection",
      features: [
        {
          geometry: {
            type: "MultiLineString",
            coordinates: [[[-2.07, 51.75]], [[-2.08, 51.76]]],
          },
        },
      ],
    });
    expect(coords).toHaveLength(2);
  });
});

describe("inCorridor", () => {
  it("accepts trail coordinates and rejects distant ones", () => {
    expect(inCorridor(51.75, -2.07)).toBe(true);
    expect(inCorridor(48.85, 2.35)).toBe(false);
  });
});
