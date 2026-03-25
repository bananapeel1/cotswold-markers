"use client";

export default function RewardCard() {
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
            card_giftcard
          </span>
          <h4 className="font-headline font-bold text-xl text-on-primary-container mb-2">
            Coming Soon
          </h4>
          <p className="text-sm text-on-primary-container/70 max-w-xs mx-auto mb-4">
            Exclusive discounts and rewards from local businesses along the
            Cotswold Way. Scan markers to unlock deals.
          </p>
          <div className="bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-5 py-2.5 inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-on-primary-container text-sm">
              notifications_active
            </span>
            <span className="text-xs font-bold text-on-primary-container tracking-wide">
              Launching Summer 2026
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
