import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import LaunchSite from "@/components/launch/LaunchSite";
import { PREVIEW_DAYS, type Moment } from "@/content/launch";

/**
 * Review pages for the homepage's three moments: now, 15 March and June.
 * Only on preview deployments and local runs; the live site 404s them.
 */
const LABELS: Record<Moment, string> = {
  before: "the site as it is now, before 15 March",
  first: "the site from 15 March 2027, when the first stretch opens",
  whole: "the site from June 2027, when the whole Way opens",
};

export const metadata: Metadata = {
  title: "Launch site preview · TrailTap",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { maximumScale: 5, themeColor: "#f8f4ea" };

export function generateStaticParams() {
  return Object.keys(PREVIEW_DAYS).map((moment) => ({ moment }));
}

export default async function LaunchPreview({ params }: { params: Promise<{ moment: string }> }) {
  const { moment } = await params;
  if (process.env.VERCEL_ENV === "production" || !(moment in PREVIEW_DAYS)) notFound();
  const m = moment as Moment;
  return <LaunchSite moment={m} day={PREVIEW_DAYS[m]} preview={{ label: LABELS[m] }} />;
}
