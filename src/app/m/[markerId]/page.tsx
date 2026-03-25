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
import SponsorCard from "@/components/SponsorCard";
import StoryCard from "@/components/StoryCard";
import EmergencyBanner from "@/components/EmergencyBanner";
import ScanTracker from "@/components/ScanTracker";
import DirectionToggle from "@/components/DirectionToggle";
import AudioPlayer from "@/components/AudioPlayer";

export async function generateStaticParams() {
  const markers = await getMarkers();
  const params: { markerId: string }[] = [];
  for (const m of markers) {
    params.push({ markerId: m.id });
    params.push({ markerId: m.shortCode });
  }
  return params;
}

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

  // Build upcoming markers (next 2)
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

  const firstStory = stories[0] || null;
  const firstSponsor = businesses.find((b) => b.offer) || null;

  return (
    <>
      <TopNav showBack backHref="/" />
      <main className="pt-20 pb-24 max-w-2xl mx-auto space-y-8">
        {/* 1. Marker Title */}
        <MarkerHeader marker={marker} />

        {/* Direction toggle */}
        <DirectionToggle />

        {/* 2. Mini Map */}
        <section className="relative h-48 mx-4 rounded-md overflow-hidden">
          <MarkerMap
            latitude={marker.latitude}
            longitude={marker.longitude}
            name={marker.name}
            nextMarker={nextMarker}
            prevMarker={prevMarker}
          />
          {/* Pulsing "You are here" overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="w-4 h-4 bg-primary rounded-full pulsar border-2 border-surface-container-lowest shadow-lg" />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-on-primary text-[10px] font-bold py-1 px-3 rounded-full shadow-xl">
                You are here
              </div>
            </div>
          </div>
        </section>

        {/* 3. What's Next Progress */}
        <TrailProgress currentMarker={marker} upcomingMarkers={upcomingMarkers} />

        {/* 4. Discovery Bento Grid */}
        <ContextualPrompts
          markerLat={marker.latitude}
          markerLng={marker.longitude}
          pois={pois}
        />

        {/* 5. Featured Offer */}
        {firstSponsor && <SponsorCard business={firstSponsor} />}

        {/* 6. Local Story */}
        {firstStory && (
          <>
            <StoryCard story={firstStory} />
            <div className="px-4">
              <AudioPlayer storyTitle={firstStory.title} />
            </div>
          </>
        )}

        {/* 7. Scan Progress & Badges */}
        <ScanTracker
          markerId={marker.id}
          markerName={marker.name}
          totalMarkers={allMarkers.length}
        />

        {/* 8. Emergency Info */}
        <EmergencyBanner info={marker.emergencyInfo} />
      </main>

      {/* Floating Trail Map FAB */}
      <div className="fixed bottom-8 right-6 z-40 md:hidden">
        <Link
          href="/trail"
          className="bg-primary text-on-primary shadow-[0px_12px_32px_rgba(28,28,24,0.15)] h-14 px-6 rounded-full flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">map</span>
          <span className="font-bold text-sm tracking-tight">Trail Map</span>
        </Link>
      </div>


    </>
  );
}
