"use client";

import { getRank, getNextRank, RANKS, XP_VALUES } from "@/lib/xp";

interface XPCardProps {
  xp: number;
}

export default function XPCard({ xp }: XPCardProps) {
  const currentRank = getRank(xp);
  const nextRank = getNextRank(xp);

  // Progress to next rank
  const currentRankIdx = RANKS.findIndex((r) => r.title === currentRank.title);
  const currentMin = currentRank.minXP;
  const nextMin = nextRank ? nextRank.minXP : currentMin;
  const progressToNext = nextRank
    ? Math.round(((xp - currentMin) / (nextMin - currentMin)) * 100)
    : 100;

  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          stars
        </span>
        <h2 className="font-headline font-bold text-primary text-lg">Trail XP</h2>
      </div>

      {/* XP + Rank display */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {currentRank.icon}
          </span>
        </div>
        <div className="flex-1">
          <p className={`font-headline font-extrabold text-xl ${currentRank.colour}`}>
            {xp.toLocaleString()} XP
          </p>
          <p className={`text-sm font-bold ${currentRank.colour}`}>{currentRank.title}</p>
        </div>
      </div>

      {/* Progress to next rank */}
      {nextRank && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-secondary mb-1">
            <span>{currentRank.title}</span>
            <span>{nextRank.title} — {(nextMin - xp).toLocaleString()} XP to go</span>
          </div>
          <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>
      )}

      {nextRank === null && (
        <p className="text-xs text-primary font-bold mb-4">
          Maximum rank achieved! You&apos;re a Cotswold Legend.
        </p>
      )}

      {/* Rank progression */}
      <div className="flex items-center justify-between px-1">
        {RANKS.map((rank, i) => {
          const isActive = i <= currentRankIdx;
          return (
            <div key={rank.title} className="flex items-center gap-0.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive ? "bg-primary text-on-primary" : "bg-surface-variant text-secondary"
                }`}
                title={`${rank.title} (${rank.minXP} XP)`}
              >
                <span
                  className="material-symbols-outlined text-xs"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {rank.icon}
                </span>
              </div>
              {i < RANKS.length - 1 && (
                <div className={`w-3 sm:w-5 h-0.5 ${isActive ? "bg-primary" : "bg-surface-variant"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* How XP is earned */}
      <details className="mt-4">
        <summary className="text-xs text-secondary cursor-pointer hover:text-primary transition-colors">
          How is XP earned?
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="bg-surface-container rounded p-2">
            <span className="font-bold text-primary">+{XP_VALUES.SCAN_NEW_MARKER}</span>
            <span className="text-secondary ml-1">New marker scan</span>
          </div>
          <div className="bg-surface-container rounded p-2">
            <span className="font-bold text-primary">+{XP_VALUES.BONUS_RAIN}</span>
            <span className="text-secondary ml-1">Rain bonus</span>
          </div>
          <div className="bg-surface-container rounded p-2">
            <span className="font-bold text-primary">+{XP_VALUES.BONUS_EARLY_BIRD}</span>
            <span className="text-secondary ml-1">Before 7am</span>
          </div>
          <div className="bg-surface-container rounded p-2">
            <span className="font-bold text-primary">+{XP_VALUES.BONUS_NIGHT_OWL}</span>
            <span className="text-secondary ml-1">After 8pm</span>
          </div>
          <div className="bg-surface-container rounded p-2">
            <span className="font-bold text-primary">+{XP_VALUES.BONUS_WEEKEND}</span>
            <span className="text-secondary ml-1">Weekend walk</span>
          </div>
          <div className="bg-surface-container rounded p-2">
            <span className="font-bold text-primary">+{XP_VALUES.BONUS_STREAK_PER_DAY}</span>
            <span className="text-secondary ml-1">/day streak</span>
          </div>
          <div className="bg-surface-container rounded p-2">
            <span className="font-bold text-primary">+{XP_VALUES.BONUS_SPEED_DEMON}</span>
            <span className="text-secondary ml-1">3+ in one day</span>
          </div>
          <div className="bg-surface-container rounded p-2">
            <span className="font-bold text-primary">+{XP_VALUES.BONUS_PACE_PERFECT}</span>
            <span className="text-secondary ml-1">Perfect pace</span>
          </div>
        </div>
      </details>
    </div>
  );
}
