import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkers, getMarkerById } from "@/data/markers";
import { getBusinessesForMarker } from "@/data/businesses";
import { getStoriesForMarker } from "@/data/stories";
import { getPOIsForMarker } from "@/data/pois";
import { getScanCountForMarker } from "@/data/scanCounts";
import { haversineDistance } from "@/lib/geo";
import MarkerHeader from "@/components/MarkerHeader";
import ContextualPrompts from "@/components/ContextualPrompts";
import TrailProgress from "@/components/TrailProgress";
import MarkerMap from "@/components/MarkerMap";
import WhatsAhead from "@/components/WhatsAhead";
import SponsorCard from "@/components/SponsorCard";
import StoryCard from "@/components/StoryCard";
import NearbyPOIs from "@/components/NearbyPOIs";
import EmergencyBanner from "@/components/EmergencyBanner";
import ScanCounter from "@/components/ScanCounter";

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
    title: `${marker.name} — Mile ${marker.trailMile} | Cotswold Way Markers`,
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

  const [businesses, stories, allMarkers, pois, scanCount] = await Promise.all([
    getBusinessesForMarker(marker.id),
    getStoriesForMarker(marker.id),
    getMarkers(),
    getPOIsForMarker(marker.id),
    getScanCountForMarker(marker.id),
  ]);

  const nextMarker = marker.nextMarkerId
    ? allMarkers.find((m) => m.id === marker.nextMarkerId) || null
    : null;

  const prevMarker = marker.prevMarkerId
    ? allMarkers.find((m) => m.id === marker.prevMarkerId) || null
    : null;

  // Build upcoming markers list (next 3)
  const upcomingMarkers = [];
  let current = nextMarker;
  const visited = new Set<string>();
  while (current && upcomingMarkers.length < 3 && !visited.has(current.id)) {
    visited.add(current.id);
    upcomingMarkers.push(current);
    current = current.nextMarkerId
      ? allMarkers.find((m) => m.id === current!.nextMarkerId) || null
      : null;
  }

  // Compute nearest distances for header
  const waterPOIs = pois.filter((p) => p.type === "water");
  const nearestWater =
    waterPOIs.length > 0
      ? Math.round(
          Math.min(
            ...waterPOIs.map((p) =>
              haversineDistance(marker.latitude, marker.longitude, p.latitude, p.longitude)
            )
          ) * 10
        ) / 10
      : null;

  const foodPOIs = pois.filter((p) => p.type === "pub" || p.type === "cafe");
  const nearestFood =
    foodPOIs.length > 0
      ? Math.round(
          Math.min(
            ...foodPOIs.map((p) =>
              haversineDistance(marker.latitude, marker.longitude, p.latitude, p.longitude)
            )
          ) * 10
        ) / 10
      : null;

  return (
    <main className="max-w-lg mx-auto w-full min-h-screen bg-surface pb-8">
      {/* 1. Header with conversational distance text */}
      <MarkerHeader
        marker={marker}
        nextVillageName={nextMarker?.name.split(",")[0]}
        distanceToNextVillage={marker.distanceToNext_miles}
        nearestWaterDistance={nearestWater}
        nearestFoodDistance={nearestFood}
      />

      {/* Description */}
      <div className="px-4 pb-4">
        <p className="text-sm text-on-surface leading-relaxed">
          {marker.description}
        </p>
      </div>

      {/* 2. Contextual Prompts — "Hungry? Thirsty? Tired?" */}
      <ContextualPrompts
        markerLat={marker.latitude}
        markerLng={marker.longitude}
        pois={pois}
        businesses={businesses}
        storyCount={stories.length}
      />

      {/* 3. Trail Progress */}
      <TrailProgress trailMile={marker.trailMile} />

      {/* 4. Map */}
      <MarkerMap
        latitude={marker.latitude}
        longitude={marker.longitude}
        name={marker.name}
        nextMarker={nextMarker}
        prevMarker={prevMarker}
      />

      {/* 5. What's Ahead — next 3 markers */}
      <WhatsAhead currentMarker={marker} upcomingMarkers={upcomingMarkers} />

      {/* 6. Sponsored Offers */}
      {businesses.length > 0 && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
            Trail partner offers
          </p>
          {businesses.map((biz) => (
            <SponsorCard key={biz.id} business={biz} />
          ))}
        </div>
      )}

      {/* 7. Stories */}
      {stories.length > 0 && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
            Discover this place
          </p>
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {/* 8. All Nearby POIs (full list with distances) */}
      <NearbyPOIs
        markerLat={marker.latitude}
        markerLng={marker.longitude}
        pois={pois}
        businesses={businesses}
      />

      {/* 9. Emergency Info */}
      <EmergencyBanner info={marker.emergencyInfo} />

      {/* 10. Scan Counter */}
      <ScanCounter count={scanCount} />

      {/* 11. Footer */}
      <footer className="px-4 pt-4 border-t border-outline-variant">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">
              Cotswold Way Trail Markers
            </p>
            <p className="text-xs text-on-surface-variant">
              Marker {marker.shortCode}
            </p>
          </div>
          <Link
            href="/trail"
            className="inline-flex items-center gap-1 text-sm text-tertiary font-semibold hover:underline"
          >
            <span className="material-symbols-outlined text-base">map</span>
            Full trail map
          </Link>
        </div>

        {/* Navigation links */}
        <div className="flex justify-between mt-4 text-sm">
          {prevMarker ? (
            <Link
              href={`/m/${prevMarker.shortCode}`}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">
                arrow_back
              </span>
              {prevMarker.shortCode}
            </Link>
          ) : (
            <span />
          )}
          {nextMarker && (
            <Link
              href={`/m/${nextMarker.shortCode}`}
              className="text-primary hover:underline flex items-center gap-1"
            >
              {nextMarker.shortCode}
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </Link>
          )}
        </div>
      </footer>
    </main>
  );
}
