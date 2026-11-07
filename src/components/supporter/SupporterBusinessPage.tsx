import Link from "next/link";
import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import { getDemoSponsor, directionsUrl } from "@/data/demoSponsors";

export function supporterBusinessMetadata(slug: string): Metadata {
  const sponsor = getDemoSponsor(slug);
  return {
    title: `${sponsor.name} | TrailTap local supporter`,
    description: sponsor.message,
    robots: { index: false, follow: false },
  };
}

/** The business's own page, opened from its card on the marker page. */
export default function SupporterBusinessPage({ slug }: { slug: string }) {
  const sponsor = getDemoSponsor(slug);

  return (
    <>
      <TopNav />
      <main className="pt-20 pb-24 max-w-2xl mx-auto space-y-6 overflow-hidden w-full">
        <div className="px-4 mt-4">
          <Link
            href={`/${sponsor.slug}`}
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to the trail
          </Link>
        </div>

        {/* Header */}
        <section className="px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-widest font-label">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            Local supporter
          </span>
          <h1 className="mt-3 text-4xl font-headline font-extrabold tracking-tight text-primary leading-none">
            {sponsor.name}
          </h1>
          <p className="text-sm text-secondary mt-2">{sponsor.typeLabel} · Broadway</p>
        </section>

        {/* Their own line */}
        <section className="mx-4 bg-surface-container-lowest rounded-md shadow-ambient p-5">
          <p className="text-lg text-on-surface leading-snug">&ldquo;{sponsor.message}&rdquo;</p>
          <div className="flex gap-3 mt-5">
            <a
              href={directionsUrl(sponsor.latitude, sponsor.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary rounded-full py-3 font-bold text-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-lg">near_me</span>
              Directions
            </a>
            <a
              href={sponsor.buttonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-primary text-primary rounded-full py-3 font-bold text-sm active:scale-95 transition-transform"
            >
              {sponsor.buttonLabel}
            </a>
          </div>
        </section>

        {/* About */}
        <section className="px-4 space-y-3">
          {sponsor.description.map((para) => (
            <p key={para} className="text-on-surface leading-relaxed">
              {para}
            </p>
          ))}
        </section>

        {/* What walkers come in for */}
        <section className="bg-surface-container-low rounded-md p-6 mx-4">
          <h3 className="font-headline font-bold text-lg mb-4">For walkers</h3>
          <div className="space-y-4">
            {sponsor.highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-lg text-primary">{h.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-sm">{h.title}</p>
                  <p className="text-[13px] text-secondary leading-snug">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Find them */}
        <section className="mx-4 bg-surface-container-lowest rounded-md shadow-ambient p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">location_on</span>
            <p className="text-sm text-on-surface">{sponsor.address}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">language</span>
            <a
              href={sponsor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary font-bold hover:underline"
            >
              {sponsor.websiteLabel}
            </a>
          </div>
        </section>

        <p className="mx-4 text-center text-xs text-secondary leading-relaxed">
          {sponsor.name} helps keep TrailTap free for walkers on the Cotswold Way.
        </p>
      </main>
    </>
  );
}
