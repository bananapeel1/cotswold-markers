import Link from "next/link";
import { DemoSponsor, directionsUrl } from "@/data/demoSponsors";
import { haversineDistance } from "@/lib/geo";

function formatDist(miles: number): string {
  if (miles < 0.1) return "Right here";
  if (miles < 1) return `${(miles * 1760).toFixed(0)} yards`;
  return `${miles.toFixed(1)} mi`;
}

export default function SupporterCard({
  sponsor,
  markerLat,
  markerLng,
}: {
  sponsor: DemoSponsor;
  markerLat: number;
  markerLng: number;
}) {
  const dist = haversineDistance(markerLat, markerLng, sponsor.latitude, sponsor.longitude);

  return (
    <section className="mx-4 bg-surface-container-lowest rounded-md shadow-ambient p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-widest font-label">
          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          Partner
        </span>
        <Link href={`/${sponsor.slug}/business`} className="text-xs font-bold text-primary hover:underline">
          More
        </Link>
      </div>
      <Link href={`/${sponsor.slug}/business`}>
        <h3 className="font-headline font-extrabold text-2xl text-primary leading-tight">{sponsor.name}</h3>
      </Link>
      <p className="text-sm text-secondary mt-1">
        {sponsor.typeLabel} · {formatDist(dist)}, in Broadway
      </p>
      <p className="text-[15px] text-on-surface mt-3 bg-surface-container-low rounded-md px-4 py-3 leading-snug">
        &ldquo;{sponsor.message}&rdquo;
      </p>
      <div className="flex gap-3 mt-4">
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
  );
}
