import Link from "next/link";
import { notFound } from "next/navigation";
import TopNav from "@/components/TopNav";
import RouteMap from "@/components/RouteMap";
import { getRouteBySlug, getRoutes } from "@/data/routes";
import { getPOIs } from "@/data/pois";
import {
  getAccessibilityGradeLabel,
  getDifficultyLabel,
  getPOIEmoji,
  getPOILabel,
} from "@/data/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await getRouteBySlug(slug);
  if (!route) return { title: "TrailTap | Route not found" };
  return {
    title: `TrailTap | ${route.name}`,
    description: route.description,
  };
}

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await getRouteBySlug(slug);
  if (!route) notFound();

  const allPois = await getPOIs();
  const routePois = allPois.filter((p) => route.poiIds.includes(p.id));

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <Link
            href="/routes"
            className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary mb-4"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            All circular routes
          </Link>

          <h1 className="font-headline text-2xl md:text-3xl font-black mb-1">
            {route.name}
          </h1>
          <p className="text-sm text-secondary flex items-center gap-1 mb-4">
            <span className="material-symbols-outlined text-sm">location_on</span>
            Starts: {route.startLocation}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-xs font-bold text-on-surface">
              <span className="material-symbols-outlined text-sm text-primary">route</span>
              {route.distanceMiles} miles
            </span>
            {route.estimatedTime && (
              <span className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-xs font-bold text-on-surface">
                <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                {route.estimatedTime}
              </span>
            )}
            {route.ascentM != null && (
              <span className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-xs font-bold text-on-surface">
                <span className="material-symbols-outlined text-sm text-primary">elevation</span>
                {route.ascentM}m ascent
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-xs font-bold text-on-surface">
              <span className="material-symbols-outlined text-sm text-primary">signal_cellular_alt</span>
              {getDifficultyLabel(route.difficulty)}
            </span>
          </div>

          {/* Map */}
          <div className="rounded-md overflow-hidden shadow-ambient mb-2" style={{ height: "420px" }}>
            <RouteMap
              geometryFile={route.geometryFile}
              startLat={route.latitude}
              startLng={route.longitude}
              pois={routePois}
            />
          </div>
          {!route.geometryFile && (
            <p className="text-[11px] text-on-surface-variant mb-4">
              Route line not yet displayed — use the official map from the link
              below. The marker shows the start point.
            </p>
          )}

          <p className="text-sm text-on-surface leading-relaxed my-5">{route.description}</p>

          {/* Accessibility box */}
          {route.accessibility && (
            <section className="bg-surface-container-low rounded-md p-5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary">accessible</span>
                <h2 className="font-headline font-bold text-base">
                  {getAccessibilityGradeLabel(route.accessibility.grade)}
                </h2>
              </div>
              <p className="text-sm text-secondary leading-relaxed mb-2">
                &ldquo;{route.accessibility.summary}&rdquo;
              </p>
              <p className="text-[11px] text-on-surface-variant">
                Grading by{" "}
                <a
                  href={route.accessibility.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  {route.accessibility.source}
                </a>{" "}
                · checked {route.accessibility.lastVerified}. Conditions change —
                verify with the source before travelling.
              </p>
            </section>
          )}

          {/* POIs along the route */}
          {routePois.length > 0 && (
            <section className="mb-6">
              <h2 className="font-headline font-bold text-lg mb-3">
                {route.geometryFile ? "Along this route" : "Near the start"} ({routePois.length})
              </h2>
              <div className="space-y-1.5">
                {routePois.map((poi) => (
                  <div
                    key={poi.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-low"
                  >
                    <span className="text-base">{getPOIEmoji(poi.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {poi.name}
                        {poi.type === "toilets" && poi.accessibility === "accessible" && (
                          <span className="ml-1.5" title="Accessible toilet" aria-label="Accessible toilet">♿</span>
                        )}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {getPOILabel(poi.type)}
                        {poi.openingHours ? ` · ${poi.openingHours}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Official source */}
          <div className="flex flex-wrap gap-3">
            <a
              href={route.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-on-primary text-xs font-bold px-5 py-3 rounded-full active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Full route guide at {route.source}
            </a>
            {route.gpxUrl && (
              <a
                href={route.gpxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-surface-container text-on-surface text-xs font-bold px-5 py-3 rounded-full active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                GPX (official download)
              </a>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export async function generateStaticParams() {
  const routes = await getRoutes();
  return routes.map((r) => ({ slug: r.slug }));
}
