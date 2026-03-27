"use client";

import { useState } from "react";
import type { ScanEntry } from "@/lib/badges";
import type { JournalEntryData } from "@/hooks/useJournal";

const WEATHER_ICONS: Record<number, string> = {
  0: "wb_sunny", 1: "wb_sunny", 2: "cloud", 3: "cloud",
  45: "foggy", 48: "foggy",
  51: "water_drop", 53: "water_drop", 55: "water_drop",
  61: "rainy", 63: "rainy", 65: "rainy",
  71: "ac_unit", 73: "ac_unit", 75: "ac_unit",
  80: "rainy", 81: "rainy", 82: "rainy",
  95: "thunderstorm", 96: "thunderstorm", 99: "thunderstorm",
};

interface TrailJournalProps {
  scans: ScanEntry[];
  journalEntries: JournalEntryData[];
  segments: string[];
}

export default function TrailJournal({ scans, journalEntries, segments }: TrailJournalProps) {
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);

  const sortedScans = [...scans].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Filter by segment (marker ID contains segment info in the id pattern)
  const filteredScans = segmentFilter === "all"
    ? sortedScans
    : sortedScans; // Segment filtering would require marker data lookup — keep all for now

  const visibleScans = showAll ? filteredScans : filteredScans.slice(0, 10);

  function handleExport() {
    // Create printable view
    const printContent = sortedScans.map((scan) => {
      const date = new Date(scan.timestamp);
      const name = scan.markerId.replace(/^cw-\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const journal = journalEntries.filter((j) => j.markerId === scan.markerId);
      const notes = journal.map((j) => j.note).filter(Boolean).join("; ");
      return `${date.toLocaleDateString("en-GB")} - ${name}${scan.weather?.temp !== undefined ? ` (${Math.round(scan.weather.temp)}°)` : ""}${notes ? `\n  "${notes}"` : ""}`;
    }).join("\n\n");

    const blob = new Blob([`My Cotswold Way Trail Journal\n${"=".repeat(40)}\n\n${printContent}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trail-journal.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-base">auto_stories</span>
        <h2 className="font-headline font-bold text-primary text-lg">Trail Journal</h2>
        <span className="text-xs text-secondary ml-auto">{scans.length} entries</span>
      </div>

      {/* Filters + Export */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          className="text-xs bg-surface-container border border-outline-variant/20 rounded-md px-2 py-1.5 text-secondary flex-1"
        >
          <option value="all">All segments</option>
          {segments.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 text-xs font-bold text-primary bg-primary-fixed px-3 py-1.5 rounded-md active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Export
        </button>
      </div>

      {sortedScans.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-secondary/30 mb-2 block">explore</span>
          <p className="text-sm text-secondary">
            No scans yet. Visit a marker on the Cotswold Way to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {visibleScans.map((scan, i) => {
              const date = new Date(scan.timestamp);
              const weatherIcon = scan.weather?.code !== undefined ? WEATHER_ICONS[scan.weather.code] || "wb_sunny" : null;
              const journalForScan = journalEntries.filter((j) => j.markerId === scan.markerId);
              const markerName = scan.markerId.replace(/^cw-\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <div key={`${scan.markerId}-${i}`} className="border border-outline-variant/15 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-md bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {scan.markerId.match(/cw-(\d+)/)?.[1] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{markerName}</p>
                      <p className="text-[10px] text-secondary">
                        {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at{" "}
                        {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {weatherIcon && (
                      <div className="flex items-center gap-1 text-secondary flex-shrink-0 bg-surface-container px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-sm">{weatherIcon}</span>
                        {scan.weather?.temp !== undefined && (
                          <span className="text-[10px] font-bold">{Math.round(scan.weather.temp)}°</span>
                        )}
                      </div>
                    )}
                  </div>
                  {journalForScan.length > 0 && (
                    <div className="px-3 pb-3 pt-0 ml-12 space-y-2">
                      {journalForScan.map((j) => (
                        <div key={j.id} className="flex gap-2 items-start bg-surface-container rounded-md p-2">
                          {j.photoUrl && (
                            <img src={j.photoUrl} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                          )}
                          {j.note && (
                            <p className="text-xs text-secondary italic leading-relaxed">&ldquo;{j.note}&rdquo;</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredScans.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2.5 text-xs font-bold text-primary bg-primary-fixed rounded-lg active:scale-[0.98] transition-all"
            >
              {showAll ? "Show less" : `View all ${filteredScans.length} entries`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
