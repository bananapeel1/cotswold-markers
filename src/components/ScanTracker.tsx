"use client";

import { useEffect, useState } from "react";

interface ScanTrackerProps {
  markerId: string;
  markerName: string;
  totalMarkers: number;
}

export default function ScanTracker({
  markerId,
  markerName,
  totalMarkers,
}: ScanTrackerProps) {
  const [scannedMarkers, setScannedMarkers] = useState<string[]>([]);
  const [justScanned, setJustScanned] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("trailtap-scanned");
    const parsed: string[] = stored ? JSON.parse(stored) : [];

    if (!parsed.includes(markerId)) {
      parsed.push(markerId);
      localStorage.setItem("trailtap-scanned", JSON.stringify(parsed));
      setJustScanned(true);

      // Record scan timestamp
      const timestamps = JSON.parse(localStorage.getItem("trailtap-scan-times") || "{}");
      timestamps[markerId] = new Date().toISOString();
      localStorage.setItem("trailtap-scan-times", JSON.stringify(timestamps));
    }

    setScannedMarkers(parsed);
  }, [markerId]);

  const progress = Math.round((scannedMarkers.length / totalMarkers) * 100);
  const isComplete = scannedMarkers.length >= totalMarkers;

  return (
    <section className="bg-surface-container-low rounded-md p-6 mx-4">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isComplete ? "emoji_events" : "hiking"}
        </span>
        <span className="font-headline font-bold text-lg">Your Trail Progress</span>
      </div>

      {justScanned && (
        <div className="bg-primary-fixed text-on-primary-fixed rounded-full px-4 py-2 text-sm font-bold mb-4 flex items-center gap-2 animate-fade-in-up">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Scanned! &ldquo;{markerName}&rdquo; added to your collection.
        </div>
      )}

      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-bold text-primary whitespace-nowrap">
          {scannedMarkers.length}/{totalMarkers}
        </span>
      </div>

      <p className="text-[11px] text-secondary">
        {isComplete
          ? "You've scanned every marker on the Cotswold Way!"
          : `${totalMarkers - scannedMarkers.length} more to complete the trail.`}
      </p>
    </section>
  );
}
