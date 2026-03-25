import Link from "next/link";
import Image from "next/image";
import { getMarkers } from "@/data/markers";
import TopNav from "@/components/TopNav";
import StatsRibbon from "@/components/StatsRibbon";
import ScrollReveal from "@/components/ScrollReveal";

export default async function Home() {
  const markers = await getMarkers();

  return (
    <>
      <TopNav desktopLinks />
      <main className="pt-16 pb-24 md:pb-0">
        {/* Hero */}
        <section className="relative h-[700px] w-full flex items-end px-6 pb-20 overflow-hidden bg-primary">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80"
            alt="Cotswold Way rolling hills and stone walls"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/20 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto md:mx-0">
            <p className="font-label text-on-primary text-xs tracking-[0.2em] uppercase mb-4 opacity-80">
              The Modern Pathfinder
            </p>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-primary leading-[1.1] tracking-tight mb-6">
              Tap the trail.
              <br />
              Discover what&apos;s next.
            </h1>
            <p className="text-on-primary/90 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-medium">
              TrailTap connects you to local stories, hidden gems, and essential
              stops at every marker along the Cotswold Way.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/trail"
                className="bg-primary text-on-primary px-8 py-4 rounded-full font-headline font-bold hover:bg-primary-container transition-colors shadow-lg active:scale-95"
              >
                Start Exploring
              </Link>
              <Link
                href="/m/CW01"
                className="bg-surface/10 backdrop-blur-md border border-white/20 text-on-primary px-8 py-4 rounded-full font-headline font-bold hover:bg-white/20 transition-colors active:scale-95"
              >
                Try a Marker
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Ribbon */}
        <StatsRibbon
          stats={[
            { label: "Trail Length", value: "102", unit: "Miles" },
            { label: "Active Markers", value: String(markers.length) },
            { label: "Local Stops", value: "56" },
            { label: "Scans", value: "10k+" },
          ]}
        />

        {/* How It Works — Bento Grid */}
        <ScrollReveal>
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div className="max-w-xl">
              <p className="text-primary font-label font-bold tracking-[0.3em] uppercase mb-4 text-xs">
                The Methodology
              </p>
              <h2 className="font-headline text-4xl md:text-5xl font-bold leading-tight">
                Your digital guide to the physical world.
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "1",
                icon: "qr_code_scanner",
                title: "Tap/Scan Marker",
                desc: "Locate any TrailTap marker post. Simply tap with NFC or scan the QR code.",
                bg: "bg-surface-container",
                iconBg: "bg-primary text-on-primary",
              },
              {
                num: "2",
                icon: "explore",
                title: "Discover Local Context",
                desc: "Instant access to trail history, nearby stops, and live information for your location.",
                bg: "bg-surface-container-highest",
                iconBg: "bg-tertiary text-on-tertiary",
              },
              {
                num: "3",
                icon: "hiking",
                title: "Enjoy Your Journey",
                desc: "Continue walking with confidence, knowing where the nearest water, food, or rest is.",
                bg: "bg-primary text-on-primary",
                iconBg: "bg-primary-fixed text-primary",
                dark: true,
              },
            ].map((step) => {
              const isDark = "dark" in step && step.dark;
              return (
              <div
                key={step.num}
                className={`${step.bg} rounded-md p-8 flex flex-col h-full relative overflow-hidden group`}
              >
                <span className={`font-headline text-[10rem] font-black absolute -right-4 -bottom-10 leading-none pointer-events-none ${isDark ? "text-white/10" : "text-on-surface/5"}`}>
                  {step.num}
                </span>
                <div
                  className={`${step.iconBg} w-12 h-12 rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform`}
                >
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4">
                  {step.title}
                </h3>
                <p className={`leading-relaxed ${isDark ? "text-white/80" : "text-secondary"}`}>{step.desc}</p>
              </div>
              );
            })}
          </div>
        </section>
        </ScrollReveal>

        {/* For the Wanderers */}
        <ScrollReveal delay={100}>
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 relative">
              <div className="relative z-10 rounded-md overflow-hidden shadow-2xl aspect-[4/5]">
                <Image
                  src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80"
                  alt="Walker on a countryside trail"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl" />
            </div>
            <div className="w-full md:w-1/2">
              <p className="font-label text-tertiary font-bold tracking-[0.2em] uppercase mb-4 text-xs">
                For the Wanderers
              </p>
              <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Explore your surroundings. Find food, water, and rest.
              </h2>
              <p className="text-lg text-secondary mb-10 leading-relaxed">
                Never worry about where the trail ends or when the next refill
                station appears. Our real-time marker system updates with
                community reports on trail conditions and local business
                availability.
              </p>
              <div className="space-y-6 mb-10">
                {[
                  { icon: "restaurant", title: "Curated Rest Stops", desc: "Only the best local pubs, cafes, and inns right on your path." },
                  { icon: "water_drop", title: "Verified Water Points", desc: "Community-verified fountain and spring status reports." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full">
                      {item.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-on-surface">{item.title}</h4>
                      <p className="text-sm text-secondary">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/trail"
                className="bg-primary text-on-primary px-10 py-4 rounded-full font-headline font-bold text-lg shadow-xl hover:translate-y-[-2px] transition-all inline-block"
              >
                Explore Trails
              </Link>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* Trail Highlights */}
        <ScrollReveal delay={100}>
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="font-label text-tertiary font-bold tracking-[0.3em] uppercase mb-4 text-xs">
                Collected Along the Way
              </p>
              <h2 className="font-headline text-4xl md:text-5xl font-bold leading-tight">
                Stories, legends &amp; local secrets.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: "castle",
                  title: "Broadway Tower",
                  desc: "A folly perched at 1,024 feet with views across 16 counties. Built for Lady Coventry in the 1790s.",
                  tag: "Heritage",
                },
                {
                  icon: "local_florist",
                  title: "Cleeve Common",
                  desc: "The largest area of unimproved limestone grassland in the Cotswolds, home to rare orchids and skylarks.",
                  tag: "Nature",
                },
                {
                  icon: "menu_book",
                  title: "The Devil's Chimney",
                  desc: "A natural limestone pinnacle with a folklore legend — the devil himself is said to have climbed it.",
                  tag: "Legend",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-surface-container-lowest rounded-md p-8 shadow-ambient hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full text-secondary">
                      {card.tag}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-primary text-3xl mb-4 block group-hover:scale-110 transition-transform">
                    {card.icon}
                  </span>
                  <h3 className="font-headline text-xl font-bold mb-3">{card.title}</h3>
                  <p className="text-secondary leading-relaxed text-sm">{card.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/m/CW02"
                className="inline-flex items-center gap-2 text-primary font-bold group"
              >
                Explore all markers
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>
        </ScrollReveal>
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block py-20 bg-surface-container border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <span className="text-3xl font-black text-primary tracking-tighter font-headline mb-6 block">
              TrailTap
            </span>
            <p className="text-secondary max-w-sm mb-8 leading-relaxed">
              Elevating the outdoor experience through thoughtful digital
              integration. Every marker is a story waiting to be told.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-6 uppercase tracking-widest text-xs opacity-50">
              App
            </h5>
            <ul className="space-y-4">
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/trail">Find Trails</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/trail">Marker Map</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/m/CW01">Try a Marker</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 uppercase tracking-widest text-xs opacity-50">
              Company
            </h5>
            <ul className="space-y-4">
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/sponsors">Partner With Us</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/admin">Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-20 mt-20 border-t border-outline-variant/10 flex justify-between items-center text-xs text-secondary/60">
          <p>Built for the modern pathfinder.</p>
        </div>
      </footer>


    </>
  );
}
