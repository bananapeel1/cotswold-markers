"use client";

import Link from "next/link";
import { BADGES, Badge } from "@/lib/badges";

const CATEGORY_LABELS: Record<Badge["category"], string> = {
  milestone: "Milestone Badges",
  special: "Special Badges",
  seasonal: "Seasonal Badges",
  secret: "Secret Badges",
};

const CATEGORY_ORDER: Badge["category"][] = ["milestone", "special", "seasonal", "secret"];

export default function BadgesPage() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    badges: BADGES.filter((b) => b.category === cat),
  }));

  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="bg-primary text-on-primary px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Badge Reference</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Info banner */}
        <div className="bg-tertiary-container text-on-tertiary-container rounded-2xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-xl mt-0.5">info</span>
          <p className="text-sm">
            Badge definitions are managed in code. Contact developer to modify.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-surface rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{BADGES.length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Total Badges</p>
        </div>

        {/* Badge groups */}
        {grouped.map((group) => (
          <section key={group.category} className="bg-surface rounded-2xl p-6">
            <h2 className="font-headline font-bold text-primary text-lg mb-4">
              {group.label}
            </h2>
            <div className="space-y-3">
              {group.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-start gap-4 p-3 bg-surface-container-low rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {badge.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{badge.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-secondary bg-surface-container px-2 py-1 rounded-full flex-shrink-0">
                    {badge.category}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
