import Link from "next/link";
import Image from "next/image";
import { getMarkers } from "@/data/markers";
import TopNav from "@/components/TopNav";
import StatsRibbon from "@/components/StatsRibbon";
import CommunityStats from "@/components/CommunityStats";
import ScrollReveal from "@/components/ScrollReveal";
import FeaturedPhoto from "@/components/FeaturedPhoto";
import HeroWeather from "@/components/HeroWeather";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";
import { getSiteContent } from "@/data/siteContent";

export const revalidate = 60;

// Presentational config for the "How It Works" bento cards — fixed by
// position, while the copy itself is editable in /admin/content.
const HOW_IT_WORKS_STYLES = [
  { bg: "bg-surface-container", iconBg: "bg-primary text-on-primary", dark: false },
  { bg: "bg-surface-container-highest", iconBg: "bg-tertiary text-on-tertiary", dark: false },
  { bg: "bg-primary text-on-primary", iconBg: "bg-primary-fixed text-primary", dark: true },
];

// Tag + icon for the Trail Highlights cards — fixed by position.
const HIGHLIGHT_STYLES = [
  { icon: "castle", tag: "Heritage" },
  { icon: "local_florist", tag: "Nature" },
  { icon: "menu_book", tag: "Legend" },
];

interface SiteSettings {
  heroImageUrl: string;
  tagline: string;
  heroSubtitle: string;
  heroDescription: string;
  wanderersImageUrl: string;
  trailLength: string;
  statsLocalStops: string;
  socialLinks: { instagram?: string; facebook?: string; twitter?: string; website?: string };
  rewardsLive: boolean;
  featuredPhoto: { photoUrl: string; userName: string; markerName: string; markerId: string; month: string; caption: string } | null;
}

/**
 * Real total from the `scanCounts/counts` counter doc, which /api/scan
 * increments on every marker tap. Rendered server-side for first paint;
 * StatsRibbon then keeps it live from /api/community.
 */
async function getLiveScanCount(): Promise<number> {
  if (!isFirestoreAvailable()) return 0;
  try {
    const db = getDb();
    const doc = await db.collection("scanCounts").doc("counts").get();
    if (doc.exists) {
      const data = doc.data()!;
      return Object.values(data).reduce((sum: number, v) => sum + (typeof v === "number" ? v : 0), 0);
    }
  } catch {}
  return 0;
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
    socialLinks: {},
    rewardsLive: false,
    featuredPhoto: null,
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
        socialLinks: data.socialLinks || defaults.socialLinks,
        rewardsLive: data.rewardsLive ?? defaults.rewardsLive,
        featuredPhoto: data.featuredPhoto || null,
      };
    }
  } catch {}
  return defaults;
}

export default async function Home() {
  const [markers, settings, liveScanCount, content] = await Promise.all([
    getMarkers(),
    getSiteSettings(),
    getLiveScanCount(),
    getSiteContent("homepage"),
  ]);

  return (
    <>
      <TopNav />
      <main className="pt-16 pb-24 md:pb-0">
        {/* Hero */}
        <section className="relative min-h-[75svh] md:min-h-0 md:h-[60vh] w-full flex flex-col md:flex-row md:items-center overflow-hidden bg-primary">
          <Image
            src={settings.heroImageUrl}
            alt="Cotswold Way rolling hills and stone walls"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-on-surface/80 via-on-surface/30 to-on-surface/20 md:bg-gradient-to-r md:from-on-surface/70 md:via-on-surface/30 md:to-transparent" />

          {/* Content wrapper — mobile: col with text centered + weather at bottom, desktop: single centered row */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex-1 flex flex-col md:flex-row md:items-center md:justify-between md:flex-none md:py-0">
            {/* Text — centered vertically on mobile via flex-1 + mt-auto/mb-auto */}
            <div className="flex-1 flex items-start md:flex-none md:block pt-12 md:pt-0">
              <div className="max-w-xl">
                <p className="font-label text-on-primary text-xs tracking-[0.2em] uppercase mb-4 opacity-80">
                  {settings.heroSubtitle}
                </p>
                <h1 className="font-headline text-[2.5rem] md:text-6xl lg:text-7xl font-extrabold text-on-primary leading-[0.95] tracking-tight mb-5">
                  {settings.tagline.split("\n").map((line: string, i: number) => (
                    <span key={i}>{i > 0 && <br />}{line}</span>
                  ))}
                </h1>
                <p className="text-on-primary/90 text-sm md:text-lg max-w-md mb-6 leading-relaxed font-medium">
                  {settings.heroDescription}
                </p>
                <div className="flex flex-row gap-3 w-full max-w-xs">
                  <Link
                    href="/trail"
                    className="flex-1 text-center bg-primary text-on-primary px-6 py-3.5 rounded-full font-headline font-bold text-sm hover:bg-primary-container transition-colors shadow-lg active:scale-95"
                  >
                    Start Exploring
                  </Link>
                  <Link
                    href="/m/CW01?source=web"
                    className="flex-1 text-center bg-surface/10 backdrop-blur-md border border-white/20 text-on-primary px-6 py-3.5 rounded-full font-headline font-bold text-sm hover:bg-white/20 transition-colors active:scale-95"
                  >
                    Try a Marker
                  </Link>
                </div>
              </div>
            </div>

            {/* Weather card — bottom on mobile, right-aligned on desktop */}
            <div className="py-8 md:pb-0 md:pt-0 w-full md:w-[400px] lg:w-[420px] flex-shrink-0">
              <HeroWeather />
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
            { label: "Scans", value: liveScanCount.toLocaleString("en-GB"), live: "totalScans" as const },
          ]}
        />
        <div className="py-4 px-6">
          <CommunityStats />
        </div>
        </ScrollReveal>

        {/* How It Works — Bento Grid */}
        <ScrollReveal>
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div className="max-w-xl">
              <p className="text-primary font-label font-bold tracking-[0.3em] uppercase mb-4 text-xs">
                {content.howItWorks.sub}
              </p>
              <h2 className="font-headline text-4xl md:text-5xl font-bold leading-tight">
                {content.howItWorks.heading}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {content.howItWorks.steps.map((step, i) => {
              const style = HOW_IT_WORKS_STYLES[i % HOW_IT_WORKS_STYLES.length];
              const isDark = style.dark;
              return (
              <div
                key={i}
                className={`${style.bg} rounded-md p-8 flex flex-col h-full relative overflow-hidden group`}
              >
                <span className={`font-headline text-[10rem] font-black absolute -right-4 -bottom-10 leading-none pointer-events-none ${isDark ? "text-white/10" : "text-on-surface/5"}`}>
                  {i + 1}
                </span>
                <div
                  className={`${style.iconBg} w-12 h-12 rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform`}
                >
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4">
                  {step.title}
                </h3>
                <p className={`leading-relaxed ${isDark ? "text-white/80" : "text-secondary"}`}>{step.body}</p>
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
                  {content.wanderers.imageNote && (
                    <p className="text-[10px] text-secondary">{content.wanderers.imageNote}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="w-full md:w-7/12 pt-8 md:pt-0">
              <p className="font-label text-tertiary font-bold tracking-[0.2em] uppercase mb-4 text-xs">
                For the Wanderers
              </p>
              <h2 className="font-headline text-3xl md:text-5xl font-bold mb-6 leading-tight">
                {content.wanderers.heading}
              </h2>
              {content.wanderers.body.split("\n\n").map((para, i) => (
                <p key={i} className="text-base text-secondary mb-8 leading-relaxed">
                  {para}
                </p>
              ))}
              <div className="space-y-5 mb-8">
                {content.wanderers.features.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full text-lg">
                      {item.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{item.title}</h4>
                      <p className="text-xs text-secondary">{item.body}</p>
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
                {content.trailHighlights.sub}
              </p>
              <h2 className="font-headline text-4xl md:text-5xl font-bold leading-tight">
                {content.trailHighlights.heading}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.trailHighlights.items.map((card, i) => {
                const style = HIGHLIGHT_STYLES[i % HIGHLIGHT_STYLES.length];
                return (
                <Link
                  key={i}
                  href={`/m/${card.markerId}?source=web`}
                  className="bg-surface-container-lowest rounded-md p-6 border border-outline-variant/10 hover:shadow-ambient transition-shadow group"
                >
                  {card.imageUrl && (
                    <div className="relative aspect-[16/9] rounded-md overflow-hidden mb-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full text-secondary">
                      {style.tag}
                    </span>
                    <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">
                      {style.icon}
                    </span>
                  </div>
                  <h3 className="font-headline text-lg font-bold mb-2">{card.name}</h3>
                  <p className="text-secondary leading-relaxed text-sm">{card.blurb}</p>
                </Link>
                );
              })}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/m/CW02?source=web"
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

        {/* Photo of the Month */}
        <FeaturedPhoto photo={settings.featuredPhoto} />
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
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/m/CW01?source=web">Try a Marker</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/blog">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 uppercase tracking-widest text-xs opacity-50">
              Company
            </h5>
            <ul className="space-y-4">
              <li className="hidden"><Link className="text-secondary hover:text-primary transition-colors" href="/sponsors">Partner With Us</Link></li>
              <li><a className="text-secondary hover:text-primary transition-colors" href="https://cotswoldwayassociation.org.uk/fundraising/" target="_blank" rel="noopener noreferrer">Support the Trail ↗</a></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/login">Login</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="text-secondary hover:text-primary transition-colors" href="/terms">Terms of Use</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-20 mt-20 border-t border-outline-variant/10 text-xs text-secondary/60">
          <p>Every marker tells a story. Every step finds a stop.</p>
        </div>
      </footer>


    </>
  );
}
