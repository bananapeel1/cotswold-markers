export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getMarkerById } from "@/data/markers";
import MarkerPageView from "@/components/MarkerPageView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ markerId: string }>;
}) {
  const { markerId } = await params;
  const marker = await getMarkerById(markerId);
  if (!marker) return { title: "Marker Not Found" };
  return {
    title: `TrailTap - ${marker.name}`,
    description: marker.description,
  };
}

export default async function MarkerPage({
  params,
  searchParams,
}: {
  params: Promise<{ markerId: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { markerId } = await params;
  const { source } = await searchParams;
  const marker = await getMarkerById(markerId);
  if (!marker) notFound();

  return <MarkerPageView marker={marker} source={source} />;
}
