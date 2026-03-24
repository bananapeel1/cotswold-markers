import Link from "next/link";
import { getMarkers } from "@/data/markers";
import { getStories } from "@/data/stories";

export default async function Home() {
  const markers = await getMarkers();
  const stories = await getStories();
  const featuredStories = stories.slice(0, 3);

  return (
    <main className="min-h-screen bg-surface">
      {/* Hero — full viewport, immersive */}
      <section className="relative min-h-[85vh] flex flex-col justify-end bg-primary text-on-primary overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/95 to-primary" />

        {/* Decorative trail line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-on-primary/10 to-transparent" style={{ right: "15%" }} />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-tertiary/20 to-transparent" style={{ right: "30%" }} />

        <div className="relative z-10 px-6 pb-12 pt-16 max-w-lg mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 animate-fade-in-up">
            <div className="w-10 h-10 rounded-xl bg-tertiary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-xl">hiking</span>
            </div>
            <span className="font-headline text-lg font-bold text-on-primary/90">
              TrailTap
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-headline text-5xl md:text-6xl font-bold leading-[1.05] mb-5 animate-fade-in-up animate-delay-100">
            Tap.
            <br />
            <span className="italic text-primary-fixed-dim">Discover.</span>
            <br />
            Walk.
          </h1>

          <p className="text-on-primary/70 text-lg leading-relaxed mb-8 animate-fade-in-up animate-delay-200 max-w-sm">
            Smart trail markers that connect you to everything you need along the Cotswold Way.
          </p>

          {/* Stats */}
          <div className="flex gap-6 mb-8 animate-fade-in-up animate-delay-300">
            <div>
              <p className="text-3xl font-bold font-headline">102</p>
              <p className="text-xs text-on-primary/50 uppercase tracking-wide">miles</p>
            </div>
            <div className="w-px bg-on-primary/10" />
            <div>
              <p className="text-3xl font-bold font-headline">{markers.length}</p>
              <p className="text-xs text-on-primary/50 uppercase tracking-wide">markers</p>
            </div>
            <div className="w-px bg-on-primary/10" />
            <div>
              <p className="text-3xl font-bold font-headline">10</p>
              <p className="text-xs text-on-primary/50 uppercase tracking-wide">days</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3 animate-fade-in-up animate-delay-400">
            <Link
              href="/trail"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-on-primary text-primary rounded-full font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <span className="material-symbols-outlined text-lg">map</span>
              Explore trail
            </Link>
            <Link
              href="/m/CW01"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-on-primary/10 text-on-primary rounded-full font-semibold hover:bg-on-primary/15 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">nfc</span>
              Try a marker
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — clean 3-step */}
      <section className="px-6 py-16">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tertiary mb-2">
            How it works
          </p>
          <h2 className="font-headline text-3xl font-bold text-primary mb-10">
            Three taps to trail magic
          </h2>

          <div className="space-y-8">
            {[
              {
                num: "01",
                icon: "nfc",
                title: "Tap or scan the marker",
                desc: "Find a trail marker at a gate, stile, or viewpoint. Tap with your phone or scan the QR code.",
              },
              {
                num: "02",
                icon: "my_location",
                title: "See exactly where you are",
                desc: "Your position on the trail, how far you've walked, what's ahead, and how long until the next stop.",
              },
              {
                num: "03",
                icon: "explore",
                title: "Find what you need",
                desc: "Hungry? Thirsty? Curious? Get nearby food, water, accommodation, local offers, and stories.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center relative">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      {step.icon}
                    </span>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center text-[10px] font-bold">
                      {step.num}
                    </span>
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-primary text-lg">{step.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured stories */}
      <section className="px-6 py-16 bg-surface-container-low">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-2">
            Trail stories
          </p>
          <h2 className="font-headline text-3xl font-bold text-primary mb-8">
            Discover the path
          </h2>

          <div className="space-y-4">
            {featuredStories.map((s) => (
              <Link
                key={s.id}
                href={`/story/${s.id}`}
                className="block group"
              >
                <div className="bg-surface rounded-2xl p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-container/50 flex items-center justify-center text-xl">
                      {s.category === "history" ? "🏛️" : s.category === "nature" ? "🌿" : s.category === "legend" ? "🐉" : s.category === "geology" ? "🪨" : "📖"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                        {s.category}
                      </p>
                      <p className="font-headline font-bold text-primary text-lg group-hover:text-tertiary transition-colors">
                        {s.title}
                      </p>
                      <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                        {s.summary}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-tertiary group-hover:translate-x-1 transition-all mt-2">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Marker grid */}
      <section className="px-6 py-16">
        <div className="max-w-lg mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tertiary mb-2">
                The route
              </p>
              <h2 className="font-headline text-3xl font-bold text-primary">
                {markers.length} markers
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Chipping Campden to Bath
              </p>
            </div>
            <Link
              href="/trail"
              className="text-sm text-tertiary font-semibold hover:underline flex items-center gap-1"
            >
              View map
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          <div className="space-y-2">
            {markers.slice(0, 6).map((m, i) => (
              <Link
                key={m.id}
                href={`/m/${m.shortCode}`}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-container-low active:scale-[0.99] transition-all"
              >
                <span className="flex-shrink-0 w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
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
                {i === 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-tertiary-fixed text-tertiary">
                    Start
                  </span>
                )}
                <span className="material-symbols-outlined text-on-surface-variant/30">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/trail"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors"
            >
              See all {markers.length} markers
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* For businesses */}
      <section className="px-6 py-16 bg-primary">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-on-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-on-primary/70 text-3xl">
              storefront
            </span>
          </div>
          <h2 className="font-headline text-3xl font-bold text-on-primary mb-4">
            For local businesses
          </h2>
          <p className="text-on-primary/60 leading-relaxed mb-8 max-w-sm mx-auto">
            Reach walkers at exactly the right moment. Sponsor a trail marker to showcase your offers to thousands of annual Cotswold Way walkers.
          </p>
          <Link
            href="mailto:hello@cotswoldmarkers.co.uk"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-on-primary text-primary rounded-full font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined">mail</span>
            Partner with us
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 bg-primary text-on-primary/40 text-sm border-t border-on-primary/5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-primary/30">hiking</span>
              <span className="font-headline font-bold text-on-primary/60">TrailTap</span>
            </div>
            <div className="flex gap-4">
              <Link href="/admin" className="hover:text-on-primary/60 transition-colors">
                Admin
              </Link>
              <Link href="/trail" className="hover:text-on-primary/60 transition-colors">
                Map
              </Link>
            </div>
          </div>
          <p className="text-on-primary/30 text-xs">
            Smart trail markers for the Cotswold Way. 102 miles of discovery.
          </p>
        </div>
      </footer>
    </main>
  );
}
