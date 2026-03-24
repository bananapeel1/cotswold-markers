import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkers, getMarkerById } from "@/data/markers";
import { getBusinessesForMarker } from "@/data/businesses";
import { getStoriesForMarker } from "@/data/stories";
import MarkerHeader from "@/components/MarkerHeader";
import TrailProgress from "@/components/TrailProgress";
import MarkerMap from "@/components/MarkerMap";
import NextMarkerCard from "@/components/NextMarkerCard";
import NearbyFacilities from "@/components/NearbyFacilities";
import SponsorCard from "@/components/SponsorCard";
import StoryCard from "@/components/StoryCard";
import EmergencyBanner from "@/components/EmergencyBanner";

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

  const [businesses, stories, allMarkers] = await Promise.all([
    getBusinessesForMarker(marker.id),
    getStoriesForMarker(marker.id),
    getMarkers(),
  ]);

  const nextMarker = marker.nextMarkerId
    ? allMarkers.find((m) => m.id === marker.nextMarkerId) || null
    : null;

  const prevMarker = marker.prevMarkerId
    ? allMarkers.find((m) => m.id === marker.prevMarkerId) || null
    : null;

  return (
    <main className="max-w-lg mx-auto w-full min-h-screen bg-surface pb-8">
      {/* Header */}
      <MarkerHeader marker={marker} />

      {/* Description */}
      <div className="px-4 pb-4">
        <p className="text-sm text-on-surface leading-relaxed">
          {marker.description}
        </p>
      </div>

      {/* Trail Progress */}
      <TrailProgress trailMile={marker.trailMile} />

      {/* Map */}
      <MarkerMap
        latitude={marker.latitude}
        longitude={marker.longitude}
        name={marker.name}
        nextMarker={nextMarker}
        prevMarker={prevMarker}
      />

      {/* Next Marker */}
      {nextMarker && (
        <NextMarkerCard
          nextMarker={nextMarker}
          distanceToNext={marker.distanceToNext_miles}
        />
      )}

      {/* Nearby Facilities */}
      <NearbyFacilities facilities={marker.facilities} />

      {/* Sponsored Offers */}
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

      {/* Stories */}
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

      {/* Emergency Info */}
      <EmergencyBanner info={marker.emergencyInfo} />

      {/* Footer */}
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
