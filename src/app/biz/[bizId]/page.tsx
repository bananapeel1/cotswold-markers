import { notFound } from "next/navigation";
import Link from "next/link";
import { getBusinesses, getBusinessById, getBusinessTypeEmoji } from "@/data/businesses";
import { getMarkers } from "@/data/markers";

export async function generateStaticParams() {
  const businesses = await getBusinesses();
  return businesses.map((b) => ({ bizId: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bizId: string }>;
}) {
  const { bizId } = await params;
  const biz = await getBusinessById(bizId);
  if (!biz) return { title: "Business Not Found" };
  return {
    title: `${biz.name} | Cotswold Way Trail Partner`,
    description: biz.description,
  };
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ bizId: string }>;
}) {
  const { bizId } = await params;
  const business = await getBusinessById(bizId);
  if (!business) notFound();

  const allMarkers = await getMarkers();
  const associatedMarkers = allMarkers.filter((m) =>
    business.markerIds.includes(m.id)
  );

  return (
    <main className="max-w-lg mx-auto w-full min-h-screen bg-surface">
      {/* Back link */}
      <div className="px-4 pt-4">
        <Link
          href="/trail"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
          Back to trail
        </Link>
      </div>

      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-2xl">
            {getBusinessTypeEmoji(business.type)}
          </div>
          <div>
            <h1 className="font-headline text-2xl font-bold text-primary">
              {business.name}
            </h1>
            <p className="text-sm text-on-surface-variant capitalize">
              {business.type} · {business.distanceFromTrail_miles} miles from trail
            </p>
          </div>
        </div>
      </div>

      {/* Offer */}
      {business.offer && (
        <div className="px-4 pb-4">
          <div className="bg-tertiary-fixed rounded-xl p-4">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-1">
              Trail walker offer
            </p>
            <p className="font-semibold text-on-tertiary-fixed text-lg">
              {business.offer}
            </p>
            {business.offerExpiry && (
              <p className="text-xs text-on-tertiary-fixed-variant mt-2">
                Valid until {new Date(business.offerExpiry).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="px-4 pb-4">
        <p className="text-on-surface leading-relaxed">{business.description}</p>
      </div>

      {/* Details */}
      <div className="px-4 pb-4">
        <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">
              location_on
            </span>
            <p className="text-sm text-on-surface">{business.address}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">
              schedule
            </span>
            <p className="text-sm text-on-surface">{business.openingHours}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">
              call
            </span>
            <a
              href={`tel:${business.phone}`}
              className="text-sm text-tertiary font-semibold"
            >
              {business.phone}
            </a>
          </div>
          {business.website && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">
                language
              </span>
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-tertiary font-semibold hover:underline"
              >
                Visit website
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Associated markers */}
      {associatedMarkers.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide mb-2">
            Featured at these markers
          </p>
          <div className="space-y-2">
            {associatedMarkers.map((m) => (
              <Link
                key={m.id}
                href={`/m/${m.shortCode}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container transition-colors"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">
                  {m.shortCode.replace("CW", "")}
                </span>
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    Mile {m.trailMile}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-outline-variant">
        <Link
          href="/"
          className="text-sm text-primary font-semibold hover:underline"
        >
          ← Cotswold Way Trail Markers
        </Link>
      </footer>
    </main>
  );
}
