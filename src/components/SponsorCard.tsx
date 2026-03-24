import { Business } from "@/data/types";

export default function SponsorCard({ business }: { business: Business }) {
  if (!business.offer) return null;

  return (
    <section className="relative overflow-hidden bg-primary-container text-on-primary-container rounded-md p-6 shadow-ambient mx-4">
      {/* Background decoration */}
      <div className="absolute -right-10 -bottom-10 opacity-10">
        <span
          className="material-symbols-outlined text-[160px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          sell
        </span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold bg-primary px-2 py-0.5 rounded text-on-primary uppercase tracking-wider">
            Featured Offer
          </span>
        </div>
        <h4 className="font-headline font-bold text-xl mb-1">
          {business.name}
        </h4>
        <p className="text-sm opacity-90 mb-4">{business.offer}</p>
        <div className="bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 inline-flex items-center gap-3">
          <span className="text-xs font-bold font-label tracking-widest">
            SHOW THIS PAGE
          </span>
          <span className="material-symbols-outlined text-sm">
            qr_code_2
          </span>
        </div>
      </div>
    </section>
  );
}
