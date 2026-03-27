"use client";

import { useEffect, useState } from "react";
import { useUserScans } from "@/hooks/useUserScans";
import { BADGES, getBadgeById } from "@/lib/badges";
import { useWeather } from "@/hooks/useWeather";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import ScanToast from "@/components/ScanToast";

interface ScanTrackerProps {
  markerId: string;
  markerName: string;
  shortCode: string;
  trailMile: number;
  elevation: number;
  totalMarkers: number;
  markerLat: number;
  markerLng: number;
  currentSegment?: string;
  segmentMarkerIds?: string[];
  scanSource?: string;
}

const MILESTONE_IDS = [
  "first-steps",
  "getting-started",
  "trail-regular",
  "half-way-hero",
  "almost-there",
  "cotswold-conqueror",
];

export default function ScanTracker({
  markerId,
  markerName,
  shortCode,
  trailMile,
  elevation,
  totalMarkers,
  markerLat,
  markerLng,
  currentSegment,
  segmentMarkerIds = [],
  scanSource,
}: ScanTrackerProps) {
  const { scans, badges, streak, loading, scannedMarkerIds, recordScan } = useUserScans();
  const weather = useWeather(markerLat, markerLng);
  const [justScanned, setJustScanned] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  // Record scan on mount — ONLY when arriving via physical QR/NFC scan
  const isPhysicalScan = scanSource === "qr" || scanSource === "nfc";
  useEffect(() => {
    if (loading) return;
    if (!isPhysicalScan) return;
    if (scannedMarkerIds.includes(markerId)) return;

    recordScan(markerId, weather ? { temp: weather.temperature, code: weather.weatherCode, isRaining: weather.isRaining } : undefined)
      .then((earned) => {
        setJustScanned(true);
        if (earned.length > 0) setNewBadges(earned);
      });
  }, [loading, markerId, isPhysicalScan]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <section className="mx-4">
        <div className="bg-surface-container-low rounded-md p-5 animate-pulse">
          <div className="h-4 bg-surface-variant rounded w-32 mb-4" />
          <div className="h-2 bg-surface-variant rounded w-full" />
        </div>
      </section>
    );
  }

  const uniqueCount = new Set(scannedMarkerIds).size;
  const progress = Math.round((uniqueCount / totalMarkers) * 100);
  const isComplete = uniqueCount >= totalMarkers;

  // Segment progress
  const sectionScanned = segmentMarkerIds.filter((id) => scannedMarkerIds.includes(id)).length;
  const sectionComplete = segmentMarkerIds.length > 1 && sectionScanned === segmentMarkerIds.length;

  // Next milestone
  const nextMilestone = MILESTONE_IDS.find((id) => !badges.includes(id));
  const nextBadge = nextMilestone ? getBadgeById(nextMilestone) : null;
  const milestoneCounts: Record<string, number> = {
    "first-steps": 1, "getting-started": 5, "trail-regular": 10,
    "half-way-hero": 25, "almost-there": 40, "cotswold-conqueror": 50,
  };
  const scansToNext = nextMilestone ? milestoneCounts[nextMilestone] - uniqueCount : 0;

  return (
    <section className="mx-4 space-y-4">
      {newBadges.length > 0 && <ConfettiCelebration />}
      {/* New badge celebration */}
      {newBadges.length > 0 && (
        <div className="bg-primary text-on-primary rounded-md p-6 text-center animate-fade-in-up">
          {newBadges.map((badgeId) => {
            const badge = getBadgeById(badgeId);
            if (!badge) return null;
            return (
              <div key={badgeId}>
                <span
                  className="material-symbols-outlined text-4xl mb-2 block"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {badge.icon}
                </span>
                <p className="font-headline font-extrabold text-xl mb-1">
                  {badge.name}!
                </p>
                <p className="text-sm text-on-primary/80">{badge.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating scan toast */}
      {justScanned && newBadges.length === 0 && (
        <ScanToast markerName={markerName} />
      )}
      {justScanned && newBadges.length > 0 && (
        <ScanToast
          markerName={markerName}
          badgeName={getBadgeById(newBadges[0])?.name}
          badgeIcon={getBadgeById(newBadges[0])?.icon}
        />
      )}

      {/* Segment completion */}
      {currentSegment && segmentMarkerIds.length > 1 && (
        <div className={`rounded-md p-4 flex items-center gap-3 ${
          sectionComplete ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container"
        }`}>
          <span
            className="material-symbols-outlined"
            style={sectionComplete ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {sectionComplete ? "verified" : "route"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{currentSegment}</p>
            <p className="text-[10px] text-secondary">
              {sectionComplete ? "Section complete!" : `${sectionScanned}/${segmentMarkerIds.length} markers scanned`}
            </p>
          </div>
        </div>
      )}

      {/* Progress card */}
      <div className="bg-surface-container-low rounded-md p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isComplete ? "emoji_events" : "hiking"}
            </span>
            <span className="font-headline font-bold text-base">Trail Explorer</span>
          </div>
          {streak.current > 0 && (
            <div className="flex items-center gap-1 bg-primary-fixed text-on-primary-fixed px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-xs">local_fire_department</span>
              <span className="text-[10px] font-bold">{streak.current} day streak</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2.5 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-primary whitespace-nowrap">{uniqueCount}/{totalMarkers}</span>
        </div>

        {/* Milestone badge dots */}
        <div className="flex items-center justify-between mt-4 px-1">
          {MILESTONE_IDS.map((id, i) => {
            const badge = getBadgeById(id);
            if (!badge) return null;
            const earned = badges.includes(id);
            return (
              <div key={id} className="flex items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${
                    earned ? "bg-primary text-on-primary border-primary" : "bg-surface-variant text-secondary border-surface-variant"
                  }`}
                  title={badge.name}
                >
                  <span className="material-symbols-outlined text-sm" style={earned ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {badge.icon}
                  </span>
                </div>
                {i < MILESTONE_IDS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${earned ? "bg-primary" : "bg-surface-variant"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Next milestone hint */}
        {nextBadge && !isComplete && (
          <p className="text-[11px] text-secondary mt-3">
            {scansToNext} more scan{scansToNext !== 1 ? "s" : ""} to earn &ldquo;{nextBadge.name}&rdquo;
          </p>
        )}

        {/* Completion certificate */}
        {isComplete && (
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <p className="font-headline font-bold text-primary mb-2">
              Cotswold Conqueror — Trail Complete!
            </p>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Cotswold Way Complete!",
                    text: "I scanned all 50 markers on the Cotswold Way with TrailTap!",
                    url: window.location.origin,
                  });
                }
              }}
              className="w-full bg-primary text-on-primary py-3 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">share</span>
              Share Achievement
            </button>
          </div>
        )}
      </div>

      {/* Badge collection toggle */}
      <button
        onClick={() => setShowAllBadges(!showAllBadges)}
        className="w-full flex items-center justify-between bg-surface-container-low rounded-md px-5 py-3 text-sm font-bold text-primary"
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base">workspace_premium</span>
          Badges ({badges.length}/{BADGES.length})
        </span>
        <span className="material-symbols-outlined text-base transition-transform" style={{ transform: showAllBadges ? "rotate(180deg)" : "none" }}>
          expand_more
        </span>
      </button>

      {/* All badges grid */}
      {showAllBadges && (
        <div className="bg-surface-container-low rounded-md p-5">
          {(["milestone", "special", "seasonal", "secret"] as const).map((category) => {
            const categoryBadges = BADGES.filter((b) => b.category === category);
            return (
              <div key={category} className="mb-4 last:mb-0">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 capitalize">{category}</p>
                <div className="grid grid-cols-3 gap-2">
                  {categoryBadges.map((badge) => {
                    const earned = badges.includes(badge.id);
                    return (
                      <button
                        key={badge.id}
                        onClick={() => earned && setSelectedBadge(badge.id)}
                        className={`flex flex-col items-center p-3 rounded-md text-center transition-transform ${
                          earned ? "bg-primary-fixed active:scale-95 cursor-pointer" : "bg-surface-container opacity-50 cursor-default"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-xl mb-1 ${earned ? "text-primary" : "text-secondary"}`}
                          style={earned ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {badge.icon}
                        </span>
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
        </div>
      )}

      {/* Badge celebration modal */}
      {selectedBadge && (() => {
        const badge = getBadgeById(selectedBadge);
        if (!badge) return null;
        const scanEntry = scans.find((s) => {
          // Find the scan that earned this badge contextually
          const date = new Date(s.timestamp);
          const hour = date.getHours();
          const day = date.getDay();
          const month = date.getMonth();
          const dayOfMonth = date.getDate();
          if (badge.id === "dawn-walker" && hour < 7) return true;
          if (badge.id === "night-owl" && hour >= 20) return true;
          if (badge.id === "weekend-warrior" && (day === 0 || day === 6)) return true;
          if (badge.id === "rainy-day-hero" && s.weather?.isRaining) return true;
          if (badge.id === "spring-bloom" && month >= 2 && month <= 4) return true;
          if (badge.id === "summer-solstice" && month === 5 && (dayOfMonth === 20 || dayOfMonth === 21)) return true;
          if (badge.id === "autumn-gold" && month >= 9 && month <= 10) return true;
          if (badge.id === "winter-walker" && (month === 11 || month <= 1)) return true;
          return false;
        });
        const earnedDate = scanEntry
          ? new Date(scanEntry.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
          : scans.length > 0
            ? new Date(scans[scans.length - 1].timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
            : null;

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
              <p className="text-sm text-secondary mb-3">{badge.description}</p>
              {earnedDate && (
                <p className="text-xs text-secondary/60 mb-5">
                  Earned {earnedDate}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `TrailTap Badge: ${badge.name}`,
                        text: `I earned the "${badge.name}" badge on the Cotswold Way with TrailTap!`,
                        url: window.location.origin,
                      });
                    }
                  }}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-base">share</span>
                  Share
                </button>
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
    </section>
  );
}
