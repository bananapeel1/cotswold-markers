export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkers, getMarkerById, getFacilityLabel } from "@/data/markers";
import { getBusinessesForMarker } from "@/data/businesses";
import { getStoriesForMarker } from "@/data/stories";
import QRPreview from "@/components/QRPreview";

export async function generateStaticParams() {
  const markers = await getMarkers();
  return markers.map((m) => ({ markerId: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ markerId: string }>;
}) {
  const { markerId } = await params;
  const marker = await getMarkerById(markerId);
  if (!marker) return { title: "Marker Not Found" };
  return { title: `Edit ${marker.shortCode} | Admin` };
}

export default async function AdminMarkerPage({
  params,
}: {
  params: Promise<{ markerId: string }>;
}) {
  const { markerId } = await params;
  const marker = await getMarkerById(markerId);
  if (!marker) notFound();

  const [businesses, stories] = await Promise.all([
    getBusinessesForMarker(marker.id),
    getStoriesForMarker(marker.id),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cotswoldmarkers.co.uk";
  const markerUrl = `${baseUrl}/m/${marker.shortCode}`;

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">
              Edit {marker.shortCode}
            </h1>
          </div>
          <Link
            href={`/m/${marker.shortCode}`}
            className="text-sm hover:underline opacity-80"
          >
            View marker →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Marker Details */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Marker Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Short Code
              </label>
              <p className="text-on-surface font-mono mt-1">{marker.shortCode}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Status
              </label>
              <p className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    marker.isActive
                      ? "bg-primary-fixed text-on-primary-fixed"
                      : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {marker.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Name
              </label>
              <p className="text-on-surface mt-1">{marker.name}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Subtitle
              </label>
              <p className="text-on-surface mt-1 italic">{marker.subtitle}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Description
              </label>
              <p className="text-on-surface mt-1 text-sm leading-relaxed">
                {marker.description}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Trail Mile
              </label>
              <p className="text-on-surface mt-1">{marker.trailMile}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Elevation
              </label>
              <p className="text-on-surface mt-1">{marker.elevation_m}m</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Coordinates
              </label>
              <p className="text-on-surface font-mono text-sm mt-1">
                {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Day on Trail
              </label>
              <p className="text-on-surface mt-1">{marker.dayOnTrail}</p>
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Facilities ({marker.facilities.length})
          </h2>
          {marker.facilities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {marker.facilities.map((f) => (
                <span
                  key={f}
                  className="px-3 py-1 rounded-full bg-surface-container-high text-sm"
                >
                  {getFacilityLabel(f)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant italic">
              No facilities at this marker
            </p>
          )}
        </section>

        {/* Businesses */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Linked Businesses ({businesses.length})
          </h2>
          {businesses.length > 0 ? (
            <div className="space-y-2">
              {businesses.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-sm">{b.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {b.type} · {b.isSponsor ? "Sponsor" : "Listing"}
                    </p>
                  </div>
                  <Link
                    href={`/biz/${b.id}`}
                    className="text-xs text-tertiary font-semibold"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant italic">
              No businesses linked
            </p>
          )}
        </section>

        {/* Stories */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Stories ({stories.length})
          </h2>
          {stories.length > 0 ? (
            <div className="space-y-2">
              {stories.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-surface-container-low rounded-lg"
                >
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {s.category} · {s.summary.slice(0, 80)}...
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant italic">
              No stories linked
            </p>
          )}
        </section>

        {/* QR Code */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            QR Code
          </h2>
          <QRPreview url={markerUrl} />
          <div className="mt-4 text-center">
            <p className="text-xs text-on-surface-variant">
              Print this QR code and attach to the physical marker at{" "}
              {marker.name}
            </p>
          </div>
        </section>

        {/* Emergency Info */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Emergency Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase">
                Nearest Road
              </label>
              <p className="mt-1">{marker.emergencyInfo.nearestRoad}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase">
                Grid Reference
              </label>
              <p className="font-mono mt-1">{marker.emergencyInfo.gridReference}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase">
                what3words
              </label>
              <p className="font-mono mt-1">
                ///{marker.emergencyInfo.what3words}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase">
                Mountain Rescue
              </label>
              <p className="mt-1">{marker.emergencyInfo.mountainRescue}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
