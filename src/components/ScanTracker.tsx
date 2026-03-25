"use client";

import { useEffect, useState } from "react";

interface ScanTrackerProps {
  markerId: string;
  markerName: string;
  totalMarkers: number;
}

const MILESTONES = [
  { count: 3, badge: "Trail Explorer", icon: "hiking" },
  { count: 7, badge: "Half Way Hero", icon: "landscape" },
  { count: 10, badge: "Cotswold Veteran", icon: "military_tech" },
  { count: 15, badge: "Trail Master", icon: "emoji_events" },
];

export default function ScanTracker({
  markerId,
  markerName,
  totalMarkers,
}: ScanTrackerProps) {
  const [scannedMarkers, setScannedMarkers] = useState<string[]>([]);
  const [justScanned, setJustScanned] = useState(false);
  const [newMilestone, setNewMilestone] = useState<(typeof MILESTONES)[0] | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("trailtap-scanned");
    const parsed: string[] = stored ? JSON.parse(stored) : [];
    const prevCount = parsed.length;

    if (!parsed.includes(markerId)) {
      parsed.push(markerId);
      localStorage.setItem("trailtap-scanned", JSON.stringify(parsed));
      setJustScanned(true);

      // Check if we hit a new milestone
      const milestone = MILESTONES.find(
        (m) => parsed.length >= m.count && prevCount < m.count
      );
      if (milestone) setNewMilestone(milestone);

      // Record scan timestamp
      const timestamps = JSON.parse(
        localStorage.getItem("trailtap-scan-times") || "{}"
      );
      timestamps[markerId] = new Date().toISOString();
      localStorage.setItem("trailtap-scan-times", JSON.stringify(timestamps));
    }

    setScannedMarkers(parsed);
  }, [markerId]);

  const progress = Math.round((scannedMarkers.length / totalMarkers) * 100);
  const isComplete = scannedMarkers.length >= totalMarkers;
  const currentMilestone = [...MILESTONES]
    .reverse()
    .find((m) => scannedMarkers.length >= m.count);
  const nextMilestone = MILESTONES.find(
    (m) => scannedMarkers.length < m.count
  );

  function shareCertificate() {
    if (navigator.share) {
      navigator.share({
        title: "Cotswold Way Trail Master",
        text: "I completed all 15 markers on the Cotswold Way with TrailTap!",
        url: window.location.origin,
      });
    }
  }

  return (
    <section className="mx-4 space-y-4">
      {/* Milestone celebration */}
      {newMilestone && (
        <div className="bg-primary text-on-primary rounded-md p-6 text-center animate-fade-in-up">
          <span
            className="material-symbols-outlined text-4xl mb-2 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {newMilestone.icon}
          </span>
          <p className="font-headline font-extrabold text-xl mb-1">
            {newMilestone.badge}!
          </p>
          <p className="text-sm text-on-primary/80">
            You&apos;ve scanned {newMilestone.count} markers on the Cotswold Way.
          </p>
        </div>
      )}

      {/* Progress card */}
      <div className="bg-surface-container-low rounded-md p-5">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isComplete ? "emoji_events" : "hiking"}
          </span>
          <span className="font-headline font-bold text-base">
            {currentMilestone ? currentMilestone.badge : "Trail Progress"}
          </span>
        </div>

        {justScanned && !newMilestone && (
          <div className="bg-primary-fixed text-on-primary-fixed rounded-full px-4 py-2 text-xs font-bold mb-4 flex items-center gap-2 animate-fade-in-up">
            <span className="material-symbols-outlined text-sm">
              check_circle
            </span>
            &ldquo;{markerName}&rdquo; added
          </div>
        )}

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-primary whitespace-nowrap">
            {scannedMarkers.length}/{totalMarkers}
          </span>
        </div>

        {/* Milestone dots */}
        <div className="flex items-center gap-1 mt-3">
          {MILESTONES.map((m) => (
            <div key={m.count} className="flex items-center gap-1">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  scannedMarkers.length >= m.count
                    ? "bg-primary text-on-primary"
                    : "bg-surface-variant text-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-[10px]">
                  {m.icon}
                </span>
              </div>
              {m.count < totalMarkers && (
                <div className="w-6 h-0.5 bg-surface-variant" />
              )}
            </div>
          ))}
        </div>

        {/* Next milestone hint */}
        {nextMilestone && !isComplete && (
          <p className="text-[11px] text-secondary mt-3">
            {nextMilestone.count - scannedMarkers.length} more scan
            {nextMilestone.count - scannedMarkers.length !== 1 ? "s" : ""} to
            earn &ldquo;{nextMilestone.badge}&rdquo;
          </p>
        )}

        {/* Completion certificate */}
        {isComplete && (
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <p className="font-headline font-bold text-primary mb-2">
              Trail Master — Cotswold Way Complete!
            </p>
            <button
              onClick={shareCertificate}
              className="w-full bg-primary text-on-primary py-3 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">share</span>
              Share Achievement
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
