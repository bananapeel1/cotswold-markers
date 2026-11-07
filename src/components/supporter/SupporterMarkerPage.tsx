import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMarkerById } from "@/data/markers";
import { DEMO_MARKER_ID, getDemoSponsor } from "@/data/demoSponsors";
import MarkerPageView from "@/components/MarkerPageView";

export function supporterMarkerMetadata(slug: string): Metadata {
  const sponsor = getDemoSponsor(slug);
  return {
    title: `TrailTap - ${sponsor.name} on the Cotswold Way`,
    robots: { index: false, follow: false },
  };
}

/** A real marker page with the business shown as its local supporter. */
export default async function SupporterMarkerPage({ slug }: { slug: string }) {
  const sponsor = getDemoSponsor(slug);
  const marker = await getMarkerById(DEMO_MARKER_ID);
  if (!marker) notFound();

  return <MarkerPageView marker={marker} supporter={sponsor} preview />;
}
