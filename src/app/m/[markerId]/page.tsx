export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkers, getMarkerById } from "@/data/markers";
import { getBusinessesForMarker } from "@/data/businesses";
import { getStoriesForMarker } from "@/data/stories";
import { getPOIsForMarker } from "@/data/pois";
import TopNav from "@/components/TopNav";
import MarkerHeader from "@/components/MarkerHeader";
import MarkerMap from "@/components/MarkerMap";
import TrailProgress from "@/components/TrailProgress";
import ContextualPrompts from "@/components/ContextualPrompts";
import RewardCard from "@/components/RewardCard";
import StoryTabs from "@/components/StoryTabs";
import ScanTracker from "@/components/ScanTracker";
import MarkerPageClient from "@/components/MarkerPageClient";
import SeasonalNotes from "@/components/SeasonalNotes";
import TrailConditions from "@/components/TrailConditions";
import ImageCompare from "@/components/ImageCompare";
import JournalEntry from "@/components/JournalEntry";
import { SEASONAL_NOTES } from "@/data/seasonal";

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
}: {
  params: Promise<{ markerId: string }>;
}) {
  const { markerId } = await params;
  const marker = await getMarkerById(markerId);
  if (!marker) notFound();

  const [businesses, stories, allMarkers, pois] = await Promise.all([
    getBusinessesForMarker(marker.id),
    getStoriesForMarker(marker.id),
    getMarkers(),
    getPOIsForMarker(marker.id),
  ]);

  const nextMarker = marker.nextMarkerId
    ? allMarkers.find((m) => m.id === marker.nextMarkerId) || null
    : null;

  const prevMarker = marker.prevMarkerId
    ? allMarkers.find((m) => m.id === marker.prevMarkerId) || null
    : null;

  const upcomingMarkers = [];
  let current = nextMarker;
  const visited = new Set<string>();
  while (current && upcomingMarkers.length < 2 && !visited.has(current.id)) {
    visited.add(current.id);
    upcomingMarkers.push(current);
    current = current.nextMarkerId
      ? allMarkers.find((m) => m.id === current!.nextMarkerId) || null
      : null;
  }


  return (
    <>
      <TopNav />
      <main className="pt-20 pb-24 max-w-2xl mx-auto space-y-6 overflow-hidden w-full">
        {/* 1. Marker Title */}
        <MarkerHeader marker={marker} />

        {/* 2. Mini Map */}
        <section className="relative h-40 mx-4 rounded-md overflow-hidden">
          <MarkerMap
            latitude={marker.latitude}
            longitude={marker.longitude}
            name={marker.name}
            nextMarker={nextMarker}
            prevMarker={prevMarker}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="w-4 h-4 bg-primary rounded-full pulsar border-2 border-surface-container-lowest shadow-lg" />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-on-primary text-[10px] font-bold py-1 px-3 rounded-full shadow-xl">
                You are here
              </div>
            </div>
          </div>
        </section>

        {/* 3. Rewards — above the fold */}
        <RewardCard />

        {/* 4. What's Next */}
        <TrailProgress currentMarker={marker} upcomingMarkers={upcomingMarkers} />

        {/* 5. Discovery — weather-aware (client wrapper provides weather) */}
        <MarkerPageClient lat={marker.latitude} lng={marker.longitude}>
          <ContextualPrompts
            markerLat={marker.latitude}
            markerLng={marker.longitude}
            pois={pois}
          />
        </MarkerPageClient>

        {/* 6. Stories (tabbed) */}
        <StoryTabs stories={stories} />

        {/* 7. Image comparison */}
        {stories.length > 0 && (
          <ImageCompare title="Then & Now" />
        )}

        {/* 8. Seasonal & Wildlife Notes */}
        <SeasonalNotes notes={SEASONAL_NOTES[marker.id] || []} />

        {/* 9. Trail Conditions */}
        <TrailConditions markerId={marker.id} />

        {/* 10. My Journal */}
        <JournalEntry markerId={marker.id} />

        {/* 11. Trail Progress & Badges */}
        <ScanTracker
          markerId={marker.id}
          markerName={marker.name}
          shortCode={marker.shortCode}
          trailMile={marker.trailMile}
          elevation={marker.elevation_m}
          totalMarkers={allMarkers.length}
          markerLat={marker.latitude}
          markerLng={marker.longitude}
          currentSegment={marker.segment}
          segmentMarkerIds={allMarkers
            .filter((m) => m.segment === marker.segment)
            .map((m) => m.id)}
        />
      </main>

      {/* Floating action buttons — side by side */}
      <div className="fixed bottom-8 right-6 z-40 md:hidden flex gap-3 items-center">
        <Link
          href="/my-trail"
          className="bg-surface-container-lowest text-primary shadow-[0px_12px_32px_rgba(28,28,24,0.15)] h-12 w-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">person</span>
        </Link>
        <Link
          href="/trail"
          className="bg-primary text-on-primary shadow-[0px_12px_32px_rgba(28,28,24,0.15)] h-12 w-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">map</span>
        </Link>
      </div>
    </>
  );
}
