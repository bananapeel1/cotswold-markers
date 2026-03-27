"use client";

export default function RewardsWallet() {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-base">wallet</span>
        <h2 className="font-headline font-bold text-primary text-lg">Rewards Wallet</h2>
      </div>
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">redeem</span>
        </div>
        <h3 className="font-headline font-bold text-lg text-primary mb-1">Coming Soon</h3>
        <p className="text-sm text-secondary max-w-xs mx-auto">
          Earn rewards from local businesses along the Cotswold Way as you scan markers. Discounts, freebies, and exclusive offers will appear here.
        </p>
        <div className="mt-5 flex items-center justify-center gap-4">
          {[
            { icon: "coffee", label: "Cafes" },
            { icon: "restaurant", label: "Pubs" },
            { icon: "storefront", label: "Shops" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center opacity-40">
              <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-secondary text-xl">{item.icon}</span>
              </div>
              <span className="text-[9px] text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
