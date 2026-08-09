/**
 * Shared zod schemas for all admin-editable content. Used by both the admin
 * forms (inline pre-submit errors) and the API routes (server-side gate), so
 * the two can never drift apart.
 *
 * Validation only — API routes persist their own merged objects rather than
 * the parsed output, so unknown legacy fields are never silently stripped.
 */

import { z } from "zod";
import { CORRIDOR, inCorridor } from "./geometry";

export const POI_TYPES = [
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
] as const;

export const POI_ACCESSIBILITY = ["accessible", "standard", "unknown"] as const;

export const HISTORIC_SITE_TYPES = [
  "prehistoric",
  "roman",
  "medieval",
  "civil-war",
  "other",
] as const;

export const ROUTE_DIFFICULTIES = ["easy", "moderate", "challenging"] as const;
export const ROUTE_SECTIONS = ["north", "middle", "south"] as const;
export const ACCESSIBILITY_GRADES = [
  "for-all",
  "for-many",
  "for-some",
  "ungraded",
] as const;

export const STORY_CATEGORIES = [
  "history",
  "nature",
  "legend",
  "local",
  "geology",
  "culture",
  "heritage",
  "folklore",
] as const;

export const BUSINESS_TYPES = [
  "pub",
  "cafe",
  "shop",
  "accommodation",
  "transport",
  "gear",
  "spa",
] as const;

export const FACILITY_TYPES = [
  "pub",
  "cafe",
  "water",
  "toilets",
  "shop",
  "parking",
  "bus",
  "campsite",
  "accommodation",
] as const;

export const VERIFICATION_STATUSES = [
  "verified",
  "unverified",
  "needs-recheck",
] as const;

const latitude = z
  .number()
  .min(CORRIDOR.LAT_MIN, `Latitude must be at least ${CORRIDOR.LAT_MIN} (Cotswold Way corridor)`)
  .max(CORRIDOR.LAT_MAX, `Latitude must be at most ${CORRIDOR.LAT_MAX} (Cotswold Way corridor)`);

const longitude = z
  .number()
  .min(CORRIDOR.LNG_MIN, `Longitude must be at least ${CORRIDOR.LNG_MIN} (Cotswold Way corridor)`)
  .max(CORRIDOR.LNG_MAX, `Longitude must be at most ${CORRIDOR.LNG_MAX} (Cotswold Way corridor)`);

/** Provenance record used on POIs; mirrors the AccessibleSection pattern. */
export const verificationSchema = z.object({
  status: z.enum(VERIFICATION_STATUSES),
  source: z.string(),
  sourceUrl: z.string().optional(),
  lastVerified: z.string(),
  notes: z.string().optional(),
});

export const poiSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    type: z.enum(POI_TYPES),
    description: z.string().optional().default(""),
    latitude,
    longitude,
    openingHours: z.string().nullable().optional(),
    nearestMarkerIds: z.array(z.string()).optional().default([]),
    accessibility: z.enum(POI_ACCESSIBILITY).optional(),
    siteType: z.enum(HISTORIC_SITE_TYPES).optional(),
    access: z.string().optional(),
    nhle: z.string().optional(),
    verification: verificationSchema.optional(),
  })
  .superRefine((poi, ctx) => {
    if (poi.type === "historic" && !poi.siteType) {
      ctx.addIssue({
        code: "custom",
        path: ["siteType"],
        message: "Historic sites must have a site type (prehistoric, roman, …)",
      });
    }
  });

export const markerSchema = z.object({
  id: z.string().optional(),
  shortCode: z.string().min(1, "Short code is required"),
  name: z.string().min(1, "Name is required"),
  subtitle: z.string().optional().default(""),
  latitude,
  longitude,
  trailMile: z.number().min(0),
  elevation_m: z.number(),
  segment: z.string().optional().default(""),
  dayOnTrail: z.number().int().min(1),
  description: z.string().optional().default(""),
  facilities: z.array(z.enum(FACILITY_TYPES)).optional().default([]),
  emergencyInfo: z
    .object({
      nearestRoad: z.string().optional().default(""),
      gridReference: z.string().optional().default(""),
      what3words: z.string().optional().default(""),
      nearestPhone: z.string().optional().default(""),
      mountainRescue: z.string().optional().default(""),
    })
    .optional(),
  storyIds: z.array(z.string()).optional().default([]),
  businessIds: z.array(z.string()).optional().default([]),
  nextMarkerId: z.string().nullable().optional(),
  prevMarkerId: z.string().nullable().optional(),
  distanceToNext_miles: z.number().optional(),
  walkingTimeToNext: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  imageUrl: z.string().optional().default(""),
  hintPhoto: z.string().optional(),
  hintText: z.string().optional(),
  seasonBeforeLabel: z.string().optional(),
  seasonAfterLabel: z.string().optional(),
  seasonBeforeImage: z.string().optional(),
  seasonAfterImage: z.string().optional(),
  seasonalNotes: z
    .array(
      z.object({
        icon: z.string().min(1, "Icon is required (Material Symbols name)"),
        text: z.string().min(1, "Text is required"),
        months: z
          .string()
          .min(1, 'Months is required — a range like "May-Jul" or "Year-round"'),
      })
    )
    .optional(),
});

export const storySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  summary: z.string().min(1, "Summary is required — it becomes the page description"),
  body: z.string().min(1, "Body is required"),
  category: z.enum(STORY_CATEGORIES),
  imageUrl: z.string().nullable().optional(),
  attribution: z.string().nullable().optional(),
  markerIds: z.array(z.string()).optional().default([]),
  audioUrl: z.string().optional(),
  isHidden: z.boolean().optional(),
  trailSecret: z.string().optional(),
});

export const businessSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    type: z.enum(BUSINESS_TYPES),
    description: z.string().optional().default(""),
    offer: z.string().nullable().optional(),
    offerExpiry: z.string().nullable().optional(),
    address: z.string().optional().default(""),
    latitude: z.number(),
    longitude: z.number(),
    phone: z.string().optional().default(""),
    website: z.string().nullable().optional(),
    openingHours: z.string().optional().default(""),
    distanceFromTrail_miles: z.number().min(0).optional().default(0),
    imageUrl: z.string().optional().default(""),
    isSponsor: z.boolean().optional().default(false),
    markerIds: z.array(z.string()).optional().default([]),
    discountCode: z.string().optional(),
  })
  .superRefine((biz, ctx) => {
    // 0,0 means "not yet placed on the map"; anything else must be local
    const unplaced = biz.latitude === 0 && biz.longitude === 0;
    if (!unplaced && !inCorridor(biz.latitude, biz.longitude)) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Coordinates are outside the Cotswold Way corridor",
      });
    }
  });

export const routeAccessibilitySchema = z.object({
  grade: z.enum(ACCESSIBILITY_GRADES),
  summary: z.string(),
  source: z.string(),
  sourceUrl: z.string(),
  lastVerified: z.string(),
});

export const routeSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  startLocation: z.string().optional().default(""),
  latitude,
  longitude,
  nearestMarkerIds: z.array(z.string()).optional().default([]),
  poiIds: z.array(z.string()).optional().default([]),
  distanceMiles: z.number().positive("Distance must be greater than 0"),
  ascentM: z.number().nullable().optional(),
  estimatedTime: z.string().nullable().optional(),
  difficulty: z.enum(ROUTE_DIFFICULTIES),
  accessibility: routeAccessibilitySchema.nullable().optional(),
  officialUrl: z.string().optional().default(""),
  gpxUrl: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  geometryFile: z.string().nullable().optional(),
  geometryUrl: z.string().nullable().optional(),
  geometrySource: z.enum(["official-gpx", "admin-upload"]).optional(),
  source: z.string().min(1, "Source (publisher) is required"),
  section: z.enum(ROUTE_SECTIONS),
  area: z.string().min(1, "Area (start hub) is required"),
});

export const accessibleSectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  startLocation: z.string().optional().default(""),
  latitude,
  longitude,
  distanceMiles: z.number().nullable().optional(),
  nearestMarkerIds: z.array(z.string()).optional().default([]),
  source: z.string().min(1, "Source is required"),
  sourceUrl: z.string().optional().default(""),
  lastVerified: z.string().optional().default(""),
});

// ---------------------------------------------------------------------------
// Site content ("Pages & Copy") — one schema per `siteContent/{page}` doc.
// Doc shapes and seeds live in src/data/siteContent.ts; keep the two in sync.
// ---------------------------------------------------------------------------

export const SITE_CONTENT_PAGES = [
  "homepage",
  "privacy",
  "terms",
  "sponsors",
  "misc",
] as const;

const iconStepSchema = z.object({
  icon: z.string().min(1, "Icon is required (material symbol name)"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export const homepageContentSchema = z.object({
  howItWorks: z.object({
    heading: z.string().min(1, "Heading is required"),
    sub: z.string().optional().default(""),
    // Card colours/numbering are positional — the section needs exactly 3
    steps: z.array(iconStepSchema).length(3, "How It Works needs exactly 3 steps"),
  }),
  wanderers: z.object({
    heading: z.string().min(1, "Heading is required"),
    body: z.string().min(1, "Body is required"),
    features: z
      .array(iconStepSchema)
      .length(2, "For the Wanderers needs exactly 2 features"),
    imageNote: z.string().optional(),
  }),
  trailHighlights: z.object({
    heading: z.string().min(1, "Heading is required"),
    sub: z.string().optional().default(""),
    // Tag/icon styling is positional — the grid needs exactly 3 cards
    items: z
      .array(
        z.object({
          name: z.string().min(1, "Name is required"),
          markerId: z.string().min(1, "Marker is required (shortCode, e.g. CW02)"),
          blurb: z.string().min(1, "Blurb is required"),
          imageUrl: z.string().optional().default(""),
        })
      )
      .length(3, "Trail Highlights needs exactly 3 items"),
  }),
});

/** Privacy and Terms share one shape: dated list of heading+body sections. */
export const legalContentSchema = z.object({
  lastUpdated: z.string().min(1, "Last updated date is required"),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1, "Section heading is required"),
        body: z.string().min(1, "Section body is required"),
      })
    )
    .min(1, "At least one section is required"),
});

export const sponsorsContentSchema = z.object({
  heroBadge: z.string().optional().default(""),
  heroHeading: z.string().min(1, "Hero heading is required"),
  heroBody: z.string().min(1, "Hero body is required"),
  pricingHeading: z.string().min(1, "Pricing heading is required"),
  pricingSub: z.string().optional().default(""),
  tiers: z
    .array(
      z.object({
        name: z.string().min(1, "Tier name is required"),
        price: z.string().min(1, "Price is required"),
        period: z.string().optional().default(""),
        features: z.array(z.string().min(1, "Feature lines cannot be empty")),
        highlighted: z.boolean().optional(),
      })
    )
    .min(1, "At least one tier is required"),
});

export const miscContentSchema = z.object({
  rewardsTeaser: z.string().min(1, "Rewards teaser is required"),
});

export const siteContentSchemas: Record<
  (typeof SITE_CONTENT_PAGES)[number],
  z.ZodTypeAny
> = {
  homepage: homepageContentSchema,
  privacy: legalContentSchema,
  terms: legalContentSchema,
  sponsors: sponsorsContentSchema,
  misc: miscContentSchema,
};

/** Format zod issues as short human-readable lines for API 400 responses. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const where = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${where}${issue.message}`;
  });
}
