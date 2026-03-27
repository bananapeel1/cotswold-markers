"use client";

import { getRank, getNextRank, RANKS, XP_VALUES } from "@/lib/xp";

interface XPCardProps {
  xp: number;
}

export default function XPCard({ xp }: XPCardProps) {
  const currentRank = getRank(xp);
  const nextRank = getNextRank(xp);

  const currentRankIdx = RANKS.findIndex((r) => r.title === currentRank.title);
  const currentMin = currentRank.minXP;
  const nextMin = nextRank ? nextRank.minXP : currentMin;
  const progressToNext = nextRank
    ? Math.round(((xp - currentMin) / (nextMin - currentMin)) * 100)
    : 100;

  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
      {/* Header row: rank icon + XP + rank title */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {currentRank.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-extrabold text-lg leading-tight">
            {xp.toLocaleString()} XP
          </p>
          <p className="text-xs text-secondary">{currentRank.title}</p>
        </div>
        {nextRank && (
          <p className="text-[10px] text-secondary text-right flex-shrink-0">
            {(nextMin - xp).toLocaleString()} XP<br />to {nextRank.title}
          </p>
        )}
      </div>

      {/* Progress bar */}
      {nextRank && (
        <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressToNext}%` }}
          />
        </div>
      )}

      {nextRank === null && (
        <p className="text-xs text-primary font-bold mb-5">
          Maximum rank achieved!
        </p>
      )}

      {/* Rank progression — evenly spaced */}
      <div className="flex items-center">
        {RANKS.map((rank, i) => {
          const isActive = i <= currentRankIdx;
          return (
            <div key={rank.title} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isActive ? "bg-primary text-on-primary" : "bg-surface-variant text-secondary"
                }`}
                title={`${rank.title} (${rank.minXP} XP)`}
              >
                <span
                  className="material-symbols-outlined text-sm"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {rank.icon}
                </span>
              </div>
              {i < RANKS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${isActive ? "bg-primary" : "bg-surface-variant"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* How XP is earned */}
      <details className="mt-5 border-t border-outline-variant/15 pt-4">
        <summary className="text-xs text-secondary cursor-pointer hover:text-primary transition-colors">
          How is XP earned?
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px]">
          {[
            { value: XP_VALUES.SCAN_NEW_MARKER, label: "New marker" },
            { value: XP_VALUES.BONUS_RAIN, label: "Rain bonus" },
            { value: XP_VALUES.BONUS_EARLY_BIRD, label: "Before 7am" },
            { value: XP_VALUES.BONUS_NIGHT_OWL, label: "After 8pm" },
            { value: XP_VALUES.BONUS_WEEKEND, label: "Weekend" },
            { value: XP_VALUES.BONUS_STREAK_PER_DAY, label: "/day streak" },
            { value: XP_VALUES.BONUS_SPEED_DEMON, label: "3+ in a day" },
            { value: XP_VALUES.BONUS_PACE_PERFECT, label: "Perfect pace" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 py-1.5">
              <span className="font-bold text-primary">+{item.value}</span>
              <span className="text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
