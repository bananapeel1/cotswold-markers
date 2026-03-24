import Link from "next/link";
import { Business, getBusinessTypeEmoji } from "@/data/businesses";

export default function SponsorCard({ business }: { business: Business }) {
  return (
    <Link href={`/biz/${business.id}`}>
      <div className="bg-tertiary-fixed rounded-xl p-4 hover:bg-tertiary-fixed-dim transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-lg">
            {getBusinessTypeEmoji(business.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-tertiary-fixed">
              {business.name}
            </p>
            {business.offer && (
              <p className="text-sm text-on-tertiary-fixed-variant font-medium mt-1">
                {business.offer}
              </p>
            )}
            <p className="text-xs text-on-tertiary-fixed-variant mt-1">
              {business.distanceFromTrail_miles} miles from trail ·{" "}
              {business.openingHours}
            </p>
          </div>
          <span className="material-symbols-outlined text-on-tertiary-fixed-variant">
            chevron_right
          </span>
        </div>
      </div>
    </Link>
  );
}
