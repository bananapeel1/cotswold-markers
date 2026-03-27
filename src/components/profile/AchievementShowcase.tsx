"use client";

import { useState, useEffect } from "react";
import { BADGES, getBadgeById, type ScanEntry } from "@/lib/badges";
import ConfettiCelebration from "@/components/ConfettiCelebration";

const PINNED_KEY = "trailtap-pinned-badges";

interface AchievementShowcaseProps {
  badges: string[];
  scans: ScanEntry[];
}

export default function AchievementShowcase({ badges: earnedBadges, scans }: AchievementShowcaseProps) {
  const [pinned, setPinned] = useState<string[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PINNED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      // Only keep badges that are still earned
      setPinned(parsed.filter((id) => earnedBadges.includes(id)));
    }
  }, [earnedBadges]);

  function togglePin(badgeId: string) {
    setPinned((prev) => {
      const next = prev.includes(badgeId)
        ? prev.filter((id) => id !== badgeId)
        : prev.length < 3
          ? [...prev, badgeId]
          : prev;
      localStorage.setItem(PINNED_KEY, JSON.stringify(next));
      return next;
    });
  }

  const pinnedBadges = pinned.map((id) => getBadgeById(id)).filter(Boolean);

  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-base">military_tech</span>
        <h2 className="font-headline font-bold text-primary text-lg">Achievements</h2>
        <span className="text-xs text-secondary ml-auto">{earnedBadges.length}/{BADGES.length}</span>
      </div>

      {/* Pinned badges — showcase */}
      {pinnedBadges.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Showcase</p>
          <div className="flex gap-3 justify-center">
            {pinnedBadges.map((badge) => badge && (
              <div
                key={badge.id}
                className="flex flex-col items-center bg-primary-fixed rounded-lg p-4 flex-1 max-w-[120px]"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <span
                    className="material-symbols-outlined text-primary text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {badge.icon}
                  </span>
                </div>
                <span className="text-xs font-bold text-primary text-center">{badge.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-secondary text-center mt-2">Tap any badge below to pin/unpin (max 3)</p>
        </div>
      )}

      {/* Full badge grid */}
      {(["milestone", "special", "seasonal", "secret"] as const).map((category) => {
        const categoryBadges = BADGES.filter((b) => b.category === category);
        return (
          <div key={category} className="mb-5 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{category}</p>
              <div className="flex-1 h-px bg-outline-variant/20" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {categoryBadges.map((badge) => {
                const earned = earnedBadges.includes(badge.id);
                const isPinned = pinned.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    onClick={() => {
                      if (earned) {
                        setSelectedBadge(badge.id);
                      }
                    }}
                    className={`flex flex-col items-center p-3 rounded-md text-center transition-all relative ${
                      earned
                        ? "bg-primary-fixed border border-primary/10 active:scale-95 cursor-pointer"
                        : "bg-surface-container opacity-50 cursor-default"
                    }`}
                  >
                    {isPinned && (
                      <div className="absolute top-1 right-1">
                        <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                      </div>
                    )}
                    {earned && !isPinned && (
                      <div className="absolute top-1 right-1">
                        <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-1.5 ${
                      earned ? "bg-primary/10" : "bg-surface-variant/50"
                    }`}>
                      <span
                        className={`material-symbols-outlined text-xl ${earned ? "text-primary" : "text-secondary"}`}
                        style={earned ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {badge.icon}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold leading-tight">{badge.name}</span>
                    {earned && (
                      <span className="text-[8px] text-primary/70 mt-0.5 leading-tight">{badge.description}</span>
                    )}
                    {!earned && badge.category !== "secret" && (
                      <span className="text-[8px] text-secondary mt-0.5 leading-tight">{badge.description}</span>
                    )}
                    {!earned && badge.category === "secret" && (
                      <span className="text-[8px] text-secondary mt-0.5">???</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Badge detail modal */}
      {selectedBadge && (() => {
        const badge = getBadgeById(selectedBadge);
        if (!badge) return null;
        const earned = earnedBadges.includes(selectedBadge);
        const isPinned = pinned.includes(selectedBadge);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/60 backdrop-blur-sm animate-fade-in-up"
            onClick={() => setSelectedBadge(null)}
          >
            <ConfettiCelebration />
            <div
              className="bg-surface-container-lowest rounded-xl p-8 mx-6 max-w-sm w-full text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
                <span
                  className="material-symbols-outlined text-primary text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {badge.icon}
                </span>
              </div>
              <h3 className="font-headline font-extrabold text-2xl text-primary mb-1">
                {badge.name}
              </h3>
              <p className="text-sm text-secondary mb-4">{badge.description}</p>

              <div className="flex gap-2">
                {earned && (
                  <button
                    onClick={() => { togglePin(selectedBadge); setSelectedBadge(null); }}
                    className={`flex-1 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform ${
                      isPinned ? "bg-surface-container text-on-surface" : "bg-primary text-on-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">push_pin</span>
                    {isPinned ? "Unpin" : "Pin"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="flex-1 bg-surface-container text-on-surface py-3 rounded-full font-bold text-sm active:scale-95 transition-transform"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
