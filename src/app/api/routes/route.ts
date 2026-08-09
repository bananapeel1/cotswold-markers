import { NextRequest, NextResponse } from "next/server";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import {
  routeSchema,
  accessibleSectionSchema,
  formatIssues,
} from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

function validationFailed(issues: string[]) {
  return NextResponse.json(
    { error: "Validation failed", issues },
    { status: 400 }
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** All entity ids in a collection (the `id` field, falling back to doc id). */
async function collectionIds(collection: string): Promise<Set<string>> {
  const snapshot = await getDb().collection(collection).select("id").get();
  return new Set(snapshot.docs.map((d) => (d.get("id") as string) ?? d.id));
}

/**
 * Cross-reference checks: every linked marker/POI id must point at a real
 * document, so a route can never reference content that does not exist.
 */
async function crossReferenceIssues(route: {
  nearestMarkerIds?: string[];
  poiIds?: string[];
}): Promise<string[]> {
  const [markerIds, poiIds] = await Promise.all([
    collectionIds("markers"),
    collectionIds("pois"),
  ]);
  const issues: string[] = [];
  for (const id of route.nearestMarkerIds ?? []) {
    if (!markerIds.has(id)) issues.push(`nearestMarkerIds: no marker with id "${id}"`);
  }
  for (const id of route.poiIds ?? []) {
    if (!poiIds.has(id)) issues.push(`poiIds: no POI with id "${id}"`);
  }
  return issues;
}

/** A slug must be unique across all other route docs. */
async function slugTaken(slug: string, ownId: string): Promise<boolean> {
  const snapshot = await getDb().collection("routes").select("slug").get();
  return snapshot.docs.some((d) => d.id !== ownId && d.get("slug") === slug);
}

function isSectionRequest(request: NextRequest, body?: { section?: unknown }): boolean {
  return (
    new URL(request.url).searchParams.get("kind") === "section" || !!body?.section
  );
}

export async function GET() {
  const { getRoutes, getAccessibleSections } = await import("@/data/routes");
  const [routes, accessibleSections] = await Promise.all([
    getRoutes(),
    getAccessibleSections(),
  ]);
  return NextResponse.json({ routes, accessibleSections });
}

export async function POST(request: NextRequest) {
  const session = await verifyAdmin(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // ── Accessible section create ──
  if (isSectionRequest(request, body)) {
    const { section } = body;
    if (!section?.name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const id: string =
      typeof section.id === "string" && section.id.trim()
        ? section.id.trim()
        : `section-${slugify(section.name)}`;
    const newSection = {
      description: "",
      startLocation: "",
      distanceMiles: null,
      nearestMarkerIds: [],
      sourceUrl: "",
      lastVerified: "",
      ...section,
      id,
    };

    const parsed = accessibleSectionSchema.safeParse(newSection);
    if (!parsed.success) return validationFailed(formatIssues(parsed.error));

    if (!isFirestoreAvailable()) return dbUnavailable();

    try {
      const docRef = getDb().collection("accessibleSections").doc(id);
      if ((await docRef.get()).exists) {
        return NextResponse.json(
          { error: `A section with id "${id}" already exists` },
          { status: 400 }
        );
      }
      await docRef.set(newSection);
      return NextResponse.json({ success: true, section: newSection });
    } catch (e) {
      console.error("Accessible section create failed:", e);
      return dbUnavailable();
    }
  }

  // ── Route create ──
  const { route } = body;
  if (!route?.name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const slug: string =
    typeof route.slug === "string" && route.slug.trim()
      ? route.slug.trim()
      : slugify(route.name);
  const id: string =
    typeof route.id === "string" && route.id.trim() ? route.id.trim() : `route-${slug}`;
  const newRoute = {
    description: "",
    startLocation: "",
    nearestMarkerIds: [],
    poiIds: [],
    ascentM: null,
    estimatedTime: null,
    accessibility: null,
    officialUrl: "",
    gpxUrl: null,
    pdfUrl: null,
    geometryFile: null,
    ...route,
    id,
    slug,
    updatedAt: new Date().toISOString(),
    ...(session.email ? { updatedBy: session.email } : {}),
  };

  const parsed = routeSchema.safeParse(newRoute);
  if (!parsed.success) return validationFailed(formatIssues(parsed.error));

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("routes").doc(id);
    if ((await docRef.get()).exists) {
      return NextResponse.json(
        { error: `A walk with id "${id}" already exists` },
        { status: 400 }
      );
    }

    const issues: string[] = [];
    if (await slugTaken(slug, id)) {
      issues.push(`slug: "${slug}" is already used by another walk`);
    }
    issues.push(...(await crossReferenceIssues(newRoute)));
    if (issues.length > 0) return validationFailed(issues);

    await docRef.set(newRoute);
    return NextResponse.json({ success: true, route: newRoute });
  } catch (e) {
    console.error("Route create failed:", e);
    return dbUnavailable();
  }
}

export async function PUT(request: NextRequest) {
  const session = await verifyAdmin(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // ── Accessible section update ──
  if (isSectionRequest(request, body)) {
    const { section } = body;
    if (!section?.id) {
      return NextResponse.json({ error: "Section ID required" }, { status: 400 });
    }

    if (!isFirestoreAvailable()) return dbUnavailable();

    try {
      const docRef = getDb().collection("accessibleSections").doc(section.id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      const updated = { ...doc.data(), ...section };

      const parsed = accessibleSectionSchema.safeParse(updated);
      if (!parsed.success) return validationFailed(formatIssues(parsed.error));

      await docRef.set(updated);
      return NextResponse.json({ success: true, section: updated });
    } catch (e) {
      console.error("Accessible section update failed:", e);
      return dbUnavailable();
    }
  }

  // ── Route update ──
  const { route } = body;
  if (!route?.id) {
    return NextResponse.json({ error: "Route ID required" }, { status: 400 });
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db.collection("routes").doc(route.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }
    const updated = {
      ...doc.data(),
      ...route,
      updatedAt: new Date().toISOString(),
      ...(session.email ? { updatedBy: session.email } : {}),
    };

    const parsed = routeSchema.safeParse(updated);
    if (!parsed.success) return validationFailed(formatIssues(parsed.error));

    const issues: string[] = [];
    if (await slugTaken(updated.slug, route.id)) {
      issues.push(`slug: "${updated.slug}" is already used by another walk`);
    }
    issues.push(...(await crossReferenceIssues(updated)));
    if (issues.length > 0) return validationFailed(issues);

    await docRef.set(updated);
    return NextResponse.json({ success: true, route: updated });
  } catch (e) {
    console.error("Route update failed:", e);
    return dbUnavailable();
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const isSection = params.get("kind") === "section";
  if (!id) {
    return NextResponse.json(
      { error: isSection ? "Section ID required" : "Route ID required" },
      { status: 400 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    const db = getDb();
    const docRef = db
      .collection(isSection ? "accessibleSections" : "routes")
      .doc(id);
    if (!(await docRef.get()).exists) {
      return NextResponse.json(
        { error: isSection ? "Section not found" : "Route not found" },
        { status: 404 }
      );
    }
    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Route delete failed:", e);
    return dbUnavailable();
  }
}
