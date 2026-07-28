import TopNav from "@/components/TopNav";
import RoutesList from "@/components/RoutesList";
import { getRoutes, getAccessibleSections } from "@/data/routes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TrailTap | Circular Routes",
  description:
    "Official circular walks connected to the Cotswold Way, with verified accessibility information from the bodies that publish it.",
};

export default async function RoutesPage() {
  const [routes, accessibleSections] = await Promise.all([
    getRoutes(),
    getAccessibleSections(),
  ]);

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary">laps</span>
              <h1 className="font-headline text-2xl md:text-3xl font-black">
                Circular Routes
              </h1>
            </div>
            <p className="text-sm text-secondary max-w-2xl">
              Official loop walks connected to the Cotswold Way — every route
              comes from its publisher (the National Trail or Cotswolds National
              Landscape), and every accessibility grading is theirs, not ours.
            </p>
          </div>

          {/* Accessible sections of the Cotswold Way */}
          {accessibleSections.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-lg">
                  accessible_forward
                </span>
                <h2 className="font-headline font-bold text-lg">
                  Accessible sections of the Cotswold Way
                </h2>
              </div>
              <div className="space-y-2">
                {accessibleSections.map((s) => (
                  <div
                    key={s.id}
                    className="bg-surface-container-low rounded-md p-4 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-sm text-on-surface">{s.name}</p>
                      {s.distanceMiles != null && (
                        <span className="text-xs font-semibold text-on-surface-variant flex-shrink-0">
                          {s.distanceMiles} mi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary leading-snug">{s.description}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      Source:{" "}
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        {s.source}
                      </a>{" "}
                      · checked {s.lastVerified}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Circular routes */}
          <RoutesList routes={routes} />

          {/* Provenance note */}
          <div className="mt-10 bg-surface-container-low rounded-md p-4 flex gap-3">
            <span className="material-symbols-outlined text-primary">verified</span>
            <p className="text-xs text-secondary leading-relaxed">
              <span className="font-bold text-on-surface">How this list is built:</span>{" "}
              routes are ingested only from official publishers — we never draw
              our own lines. Accessibility gradings follow the Miles Without
              Stiles convention and are shown with their source and the date we
              last checked it. A route without a grading isn&apos;t inaccessible —
              it just hasn&apos;t been formally assessed yet.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
