import Link from "next/link";
import { getMarkers } from "@/data/markers";

export default async function Home() {
  const markers = await getMarkers();

  return (
    <main className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="bg-primary text-on-primary px-6 pt-12 pb-16">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-3xl">hiking</span>
            <span className="font-headline text-xl font-bold">
              Cotswold Way Markers
            </span>
          </div>
          <h1 className="font-headline text-4xl font-bold leading-tight mb-4">
            Scan. Explore.
            <br />
            Walk.
          </h1>
          <p className="text-on-primary/80 text-lg leading-relaxed mb-8">
            Smart trail markers connecting you to local offers, information, and
            stories along the 102-mile Cotswold Way.
          </p>
          <div className="flex gap-3">
            <Link
              href="/trail"
              className="inline-flex items-center gap-2 px-6 py-3 bg-tertiary text-on-tertiary rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined">map</span>
              View trail map
            </Link>
            <Link
              href="/m/CW01"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined">qr_code_scanner</span>
              Try a marker
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-12">
        <div className="max-w-lg mx-auto">
          <h2 className="font-headline text-2xl font-bold text-primary mb-8 text-center">
            How it works
          </h2>
          <div className="space-y-6">
            {[
              {
                icon: "nfc",
                title: "1. Tap or scan",
                desc: "Find a trail marker at a gate, stile, or viewpoint. Tap with your phone or scan the QR code.",
              },
              {
                icon: "location_on",
                title: "2. See where you are",
                desc: "Instantly see your position on the trail, how far you've walked, and what's coming next.",
              },
              {
                icon: "explore",
                title: "3. Discover what's nearby",
                desc: "Find food, water, accommodation, local offers, and fascinating stories about where you're standing.",
              },
            ].map((step) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-tertiary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-2xl">
                    {step.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{step.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marker preview grid */}
      <section className="px-6 py-12 bg-surface-container-low">
        <div className="max-w-lg mx-auto">
          <h2 className="font-headline text-2xl font-bold text-primary mb-2">
            {markers.length} markers along the way
          </h2>
          <p className="text-on-surface-variant mb-6">
            From Chipping Campden to Bath — 102 miles of stories, scenery, and
            support.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {markers.slice(0, 5).map((m) => (
              <Link
                key={m.id}
                href={`/m/${m.shortCode}`}
                className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
                  {m.shortCode.replace("CW", "")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface truncate">
                    {m.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Mile {m.trailMile} · {m.subtitle}
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/trail"
              className="text-tertiary font-semibold hover:underline"
            >
              View all {markers.length} markers →
            </Link>
          </div>
        </div>
      </section>

      {/* For businesses */}
      <section className="px-6 py-12">
        <div className="max-w-lg mx-auto text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-4">
            storefront
          </span>
          <h2 className="font-headline text-2xl font-bold text-primary mb-3">
            For local businesses
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-6">
            Reach walkers at exactly the right moment. Sponsor a trail marker to
            showcase your offers to thousands of annual Cotswold Way walkers.
          </p>
          <Link
            href="mailto:hello@cotswoldmarkers.co.uk"
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">mail</span>
            Get in touch
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-primary text-on-primary/60 text-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <p>Cotswold Way Trail Markers</p>
          <Link href="/admin" className="hover:text-on-primary transition-colors">
            Admin
          </Link>
        </div>
      </footer>
    </main>
  );
}
