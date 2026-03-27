import Link from "next/link";
import Image from "next/image";
import { getMarkers } from "@/data/markers";
import TopNav from "@/components/TopNav";
import StatsRibbon from "@/components/StatsRibbon";
import CommunityStats from "@/components/CommunityStats";
import ScrollReveal from "@/components/ScrollReveal";
import WeatherStrip from "@/components/WeatherStrip";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export const revalidate = 60;

interface SiteSettings {
  heroImageUrl: string;
  tagline: string;
  heroSubtitle: string;
  heroDescription: string;
  wanderersImageUrl: string;
  trailLength: string;
  statsLocalStops: string;
  statsScans: string;
  socialLinks: { instagram?: string; facebook?: string; twitter?: string; website?: string };
  rewardsLive: boolean;
}

function formatScanCount(count: number): string {
  if (count >= 10000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  if (count >= 1000) {
    return count.toLocaleString("en-GB");
  }
  return String(count);
}

async function getLiveScanCount(): Promise<number | null> {
  if (!isFirestoreAvailable()) return null;
  try {
    const db = getDb();
    const doc = await db.collection("scanCounts").doc("counts").get();
    if (doc.exists) {
      const data = doc.data()!;
      return Object.values(data).reduce((sum: number, v) => sum + (typeof v === "number" ? v : 0), 0);
    }
  } catch {}
  return null;
}

async function getSiteSettings(): Promise<SiteSettings> {
  const defaults: SiteSettings = {
    heroImageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80",
    tagline: "Tap the trail.\nDiscover what's next.",
    heroSubtitle: "The Modern Pathfinder",
    heroDescription: "TrailTap connects you to local stories, hidden gems, and essential stops at every marker along the Cotswold Way.",
    wanderersImageUrl: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80",
    trailLength: "102",
    statsLocalStops: "56",
    statsScans: "10k+",
    socialLinks: {},
    rewardsLive: false,
  };
  if (!isFirestoreAvailable()) return defaults;
  try {
    const db = getDb();
    const doc = await db.collection("siteSettings").doc("global").get();
    if (doc.exists) {
      const data = doc.data()!;
      return {
        heroImageUrl: data.heroImageUrl || defaults.heroImageUrl,
        tagline: data.tagline || defaults.tagline,
        heroSubtitle: data.heroSubtitle || defaults.heroSubtitle,
        heroDescription: data.heroDescription || defaults.heroDescription,
        wanderersImageUrl: data.wanderersImageUrl || defaults.wanderersImageUrl,
        trailLength: data.trailLength || defaults.trailLength,
        statsLocalStops: data.statsLocalStops || defaults.statsLocalStops,
        statsScans: data.statsScans || defaults.statsScans,
        socialLinks: data.socialLinks || defaults.socialLinks,
        rewardsLive: data.rewardsLive ?? defaults.rewardsLive,
      };
    }
  } catch {}
  return defaults;
}

export default async function Home() {
  const [markers, settings, liveScanCount] = await Promise.all([getMarkers(), getSiteSettings(), getLiveScanCount()]);
  const scansDisplay = liveScanCount !== null ? formatScanCount(liveScanCount) : settings.statsScans;

  return (
    <>
      <TopNav />
      <main className="pt-16 pb-24 md:pb-0">
        {/* Hero */}
        <section className="relative h-[700px] w-full flex items-end overflow-hidden bg-primary">
          <Image
            src={settings.heroImageUrl}
            alt="Cotswold Way rolling hills and stone walls"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/20 to-transparent" />
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-20">
            <p className="font-label text-on-primary text-xs tracking-[0.2em] uppercase mb-4 opacity-80">
              {settings.heroSubtitle}
            </p>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-primary leading-[1.1] tracking-tight mb-6">
              {settings.tagline.split("\n").map((line: string, i: number) => (
                <span key={i}>{i > 0 && <br />}{line}</span>
              ))}
            </h1>
            <p className="text-on-primary/90 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-medium">
              {settings.heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              <Link
                href="/trail"
                className="flex-1 text-center bg-primary text-on-primary px-8 py-4 rounded-full font-headline font-bold hover:bg-primary-container transition-colors shadow-lg active:scale-95"
              >
                Start Exploring
              </Link>
              <Link
                href="/m/CW01"
                className="flex-1 text-center bg-surface/10 backdrop-blur-md border border-white/20 text-on-primary px-8 py-4 rounded-full font-headline font-bold hover:bg-white/20 transition-colors active:scale-95"
              >
                Try a Marker
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Ribbon */}
        <ScrollReveal>
        <StatsRibbon
          stats={[
            { label: "Trail Length", value: settings.trailLength, unit: "Miles" },
            { label: "Active Markers", value: String(markers.length) },
            { label: "Local Stops", value: settings.statsLocalStops },
            { label: "Scans", value: scansDisplay },
          ]}
        />
        <div className="py-4 px-6">
          <CommunityStats />
        </div>
        </ScrollReveal>

        {/* Trail Weather */}
        <WeatherStrip />

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
                desc: "Find a TrailTap marker along the Cotswold Way. Tap with NFC or scan the QR code.",
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
        <section className="py-20 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
            {/* Image with floating card */}
            <div className="w-full md:w-5/12 relative">
              <div className="relative z-10 rounded-md overflow-hidden shadow-2xl aspect-[3/4]">
                <Image
                  src={settings.wanderersImageUrl}
                  alt="Walker on a countryside trail"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Floating info card */}
              <div className="absolute -bottom-6 -right-4 md:right-auto md:-left-6 z-20 bg-surface-container-lowest rounded-md p-4 shadow-xl flex items-center gap-3 border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  location_on
                </span>
                <div>
                  <p className="font-bold text-sm">{settings.statsLocalStops} Local Stops</p>
                  <p className="text-[10px] text-secondary">Pubs, cafes &amp; rest points</p>
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="w-full md:w-7/12 pt-8 md:pt-0">
              <p className="font-label text-tertiary font-bold tracking-[0.2em] uppercase mb-4 text-xs">
                For the Wanderers
              </p>
              <h2 className="font-headline text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Explore the Cotswold Way. Find food, water, and rest.
              </h2>
              <p className="text-base text-secondary mb-8 leading-relaxed">
                Never worry about where the trail ends or when the next refill
                station appears. Our real-time marker system updates with
                community reports on trail conditions and local business
                availability.
              </p>
              <div className="space-y-5 mb-8">
                {[
                  { icon: "restaurant", title: "Curated Rest Stops", desc: "The best local pubs, cafes, and inns along the Cotswold Way." },
                  { icon: "water_drop", title: "Verified Water Points", desc: "Community-verified fountain and spring status reports." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full text-lg">
                      {item.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{item.title}</h4>
                      <p className="text-xs text-secondary">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/trail"
                className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-headline font-bold shadow-lg hover:translate-y-[-2px] transition-all inline-flex items-center gap-2"
              >
                Explore the Trail
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
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
                  href: "/m/CW04",
                },
                {
                  icon: "local_florist",
                  title: "Cleeve Common",
                  desc: "The largest area of unimproved limestone grassland in the Cotswolds, home to rare orchids and skylarks.",
                  tag: "Nature",
                  href: "/m/CW13",
                },
                {
                  icon: "menu_book",
                  title: "The Devil's Chimney",
                  desc: "A natural limestone pinnacle with a folklore legend — the devil himself is said to have climbed it.",
                  tag: "Legend",
                  href: "/m/CW16",
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="bg-surface-container-lowest rounded-md p-6 border border-outline-variant/10 hover:shadow-ambient transition-shadow group"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full text-secondary">
                      {card.tag}
                    </span>
                    <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">
                      {card.icon}
                    </span>
                  </div>
                  <h3 className="font-headline text-lg font-bold mb-2">{card.title}</h3>
                  <p className="text-secondary leading-relaxed text-sm">{card.desc}</p>
                </Link>
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
              Smart trail markers connecting walkers to local stories, hidden
              gems, and essential stops along the Cotswold Way.
            </p>
            {/* Social links */}
            {(settings.socialLinks.instagram || settings.socialLinks.facebook || settings.socialLinks.twitter || settings.socialLinks.website) && (
              <div className="flex items-center gap-4">
                {settings.socialLinks.instagram && (
                  <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-primary transition-colors" aria-label="Instagram">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {settings.socialLinks.facebook && (
                  <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-primary transition-colors" aria-label="Facebook">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {settings.socialLinks.twitter && (
                  <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-primary transition-colors" aria-label="X / Twitter">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
                {settings.socialLinks.website && (
                  <a href={settings.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-primary transition-colors" aria-label="Website">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>
          <div>
            <h5 className="font-bold mb-6 uppercase tracking-widest text-xs opacity-50">
              App
            </h5>
            <ul className="space-y-4">
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/trail">Cotswold Way Map</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/trail">All Markers</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/m/CW01">Try a Marker</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 uppercase tracking-widest text-xs opacity-50">
              Company
            </h5>
            <ul className="space-y-4">
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/sponsors">Partner With Us</Link></li>
              <li><a className="text-secondary hover:text-primary transition-colors" href="https://cotswoldwayassociation.org.uk/fundraising/" target="_blank" rel="noopener noreferrer">Support the Trail ↗</a></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/login">Login</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/terms">Terms of Use</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-20 mt-20 border-t border-outline-variant/10 flex justify-between items-center text-xs text-secondary/60">
          <p>Every marker tells a story. Every step finds a stop.</p>
          <a href="https://startupfa.me/s/trailtap?utm_source=trail.thecotswoldsway.com" target="_blank" rel="noopener noreferrer">
            <img src="https://startupfa.me/badges/featured/default-small.webp" alt="Cotswolds TrailTap - Featured on Startup Fame" width={224} height={36} />
          </a>
        </div>
      </footer>


    </>
  );
}
