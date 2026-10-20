import { NextRequest, NextResponse } from "next/server";
import { invalidateContent } from "@/lib/firestoreRead";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";
import {
  SITE_CONTENT_PAGES,
  siteContentSchemas,
  formatIssues,
} from "@/lib/validation/schemas";
import { getSiteContent, type SiteContentPage } from "@/data/siteContent";

export const dynamic = "force-dynamic";

const DB_UNAVAILABLE =
  "Content database is unavailable — please try again in a moment.";

function dbUnavailable() {
  return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
}

function isContentPage(page: unknown): page is SiteContentPage {
  return (
    typeof page === "string" &&
    (SITE_CONTENT_PAGES as readonly string[]).includes(page)
  );
}

/** Merged content (Firestore over in-code defaults) for the admin editor. */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = new URL(request.url).searchParams.get("page");
  if (!isContentPage(page)) {
    return NextResponse.json(
      { error: `Unknown page — expected one of: ${SITE_CONTENT_PAGES.join(", ")}` },
      { status: 400 }
    );
  }

  const content = await getSiteContent(page);
  return NextResponse.json({ page, content });
}

/** Replace the whole `siteContent/{page}` doc with the submitted content. */
export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { page, content } = await request.json();
  if (!isContentPage(page)) {
    return NextResponse.json(
      { error: `Unknown page — expected one of: ${SITE_CONTENT_PAGES.join(", ")}` },
      { status: 400 }
    );
  }

  const parsed = siteContentSchemas[page].safeParse(content);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatIssues(parsed.error) },
      { status: 400 }
    );
  }

  if (!isFirestoreAvailable()) return dbUnavailable();

  try {
    await getDb().collection("siteContent").doc(page).set(content);
    invalidateContent("siteContent");
    return NextResponse.json({ success: true, page, content });
  } catch (e) {
    console.error("Site content save failed:", e);
    return dbUnavailable();
  }
}
