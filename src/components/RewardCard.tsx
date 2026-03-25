"use client";

import { useState } from "react";
import { Business } from "@/data/types";

interface RewardCardProps {
  businesses: Business[];
  markerLat: number;
  markerLng: number;
}

function getTypeBadge(type: string): string {
  const badges: Record<string, string> = {
    pub: "Pub",
    cafe: "Cafe",
    shop: "Shop",
    accommodation: "Stay",
    transport: "Transport",
    gear: "Gear",
    spa: "Spa",
  };
  return badges[type] || type;
}

export default function RewardCard({
  businesses,
  markerLat,
  markerLng,
}: RewardCardProps) {
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());

  const offers = businesses.filter((b) => b.offer);
  if (offers.length === 0) return null;

  function handleRedeem(id: string) {
    setRedeemed((prev) => new Set(prev).add(id));
    // Track redemption in localStorage
    const stored = JSON.parse(
      localStorage.getItem("trailtap-redemptions") || "[]"
    );
    stored.push({ id, timestamp: new Date().toISOString() });
    localStorage.setItem("trailtap-redemptions", JSON.stringify(stored));
  }

  return (
    <section className="space-y-4 px-4">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          loyalty
        </span>
        <h3 className="font-headline font-bold text-lg">Rewards</h3>
      </div>

      {offers.map((biz) => {
        const isRedeemed = redeemed.has(biz.id);

        return (
          <div
            key={biz.id}
            className="relative overflow-hidden bg-primary-container rounded-md p-5"
          >
            {/* Background decoration */}
            <div className="absolute -right-8 -bottom-8 opacity-5">
              <span className="material-symbols-outlined text-[120px]">
                sell
              </span>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest bg-primary/20 text-on-primary-container px-2 py-0.5 rounded-full">
                  {getTypeBadge(biz.type)}
                </span>
                {biz.distanceFromTrail_miles < 0.5 && (
                  <span className="text-[9px] font-bold text-on-primary-container opacity-70">
                    Nearby
                  </span>
                )}
              </div>

              <h4 className="font-headline font-bold text-lg text-on-primary-container mb-1">
                {biz.name}
              </h4>

              <p className="text-sm text-on-primary-container/80 mb-3">
                {biz.offer}
              </p>

              {biz.openingHours && (
                <p className="text-[10px] text-on-primary-container/60 flex items-center gap-1 mb-4">
                  <span className="material-symbols-outlined text-xs">
                    schedule
                  </span>
                  {biz.openingHours}
                </p>
              )}

              <button
                onClick={() => handleRedeem(biz.id)}
                className={`w-full py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${
                  isRedeemed
                    ? "bg-on-primary-container/10 text-on-primary-container"
                    : "bg-primary text-on-primary shadow-lg"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isRedeemed ? "check_circle" : "qr_code_2"}
                </span>
                {isRedeemed ? "Show this screen to redeem" : "Tap to Redeem"}
              </button>

              {biz.offerExpiry && (
                <p className="text-[9px] text-on-primary-container/50 text-center mt-2">
                  Valid until{" "}
                  {new Date(biz.offerExpiry).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
