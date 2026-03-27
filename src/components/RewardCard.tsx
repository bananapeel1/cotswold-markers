"use client";

import { useState, useEffect } from "react";

export default function RewardCard() {
  const [rewardsLive, setRewardsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setRewardsLive(data.rewardsLive === true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

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

      <div className="relative overflow-hidden bg-primary-container rounded-md p-6">
        {/* Background decoration */}
        <div className="absolute -right-8 -bottom-8 opacity-5">
          <span className="material-symbols-outlined text-[120px]">sell</span>
        </div>

        <div className="relative z-10 text-center">
          <span
            className="material-symbols-outlined text-on-primary-container text-4xl mb-3 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {rewardsLive ? "redeem" : "card_giftcard"}
          </span>
          <h4 className="font-headline font-bold text-xl text-on-primary-container mb-2">
            {rewardsLive ? "Trail Rewards" : "Coming Soon"}
          </h4>
          <p className="text-sm text-on-primary-container/70 max-w-xs mx-auto mb-4">
            {rewardsLive
              ? "Scan markers to unlock exclusive discounts and rewards from local businesses along the Cotswold Way."
              : "Exclusive discounts and rewards from local businesses along the Cotswold Way. Scan markers to unlock deals."}
          </p>
          <div className="bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-5 py-2.5 inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-on-primary-container text-sm">
              {rewardsLive ? "check_circle" : "notifications_active"}
            </span>
            <span className="text-xs font-bold text-on-primary-container tracking-wide">
              {rewardsLive ? "Rewards Active" : "Launching Summer 2026"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
