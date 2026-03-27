"use client";

import { useState } from "react";
import type { ScanEntry } from "@/lib/badges";
import type { JournalEntryData } from "@/hooks/useJournal";

interface TrailJournalProps {
  scans: ScanEntry[];
  journalEntries: JournalEntryData[];
  segments: string[];
}

export default function TrailJournal({ scans, journalEntries, segments }: TrailJournalProps) {
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Build timeline: merge scans with their journal entries
  const sortedScans = [...scans].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const visibleScans = showAll ? sortedScans : sortedScans.slice(0, 10);

  function getMarkerName(markerId: string): string {
    return markerId.replace(/^cw-\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getMarkerNumber(markerId: string): string {
    return markerId.match(/cw-(\d+)/)?.[1] || "?";
  }

  function handleExport() {
    const printContent = sortedScans.map((scan) => {
      const date = new Date(scan.timestamp);
      const name = getMarkerName(scan.markerId);
      const journal = journalEntries.filter((j) => j.markerId === scan.markerId);
      const notes = journal.map((j) => j.note).filter(Boolean).join("; ");
      return `${date.toLocaleDateString("en-GB")} - ${name}${notes ? `\n  "${notes}"` : ""}`;
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
    <div className="space-y-5">
      {/* Journal Entries section */}
      {journalEntries.length > 0 && (
        <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <h2 className="font-headline font-bold text-primary text-lg">Journal Entries</h2>
            <span className="text-xs text-secondary ml-auto">{journalEntries.length} {journalEntries.length === 1 ? "entry" : "entries"}</span>
          </div>

          <div className="space-y-3">
            {journalEntries.map((entry) => {
              const date = new Date(entry.timestamp);
              return (
                <div key={entry.id} className="border border-outline-variant/15 rounded-lg overflow-hidden">
                  {entry.photoUrl && (
                    <button onClick={() => setViewingPhoto(entry.photoUrl)} className="w-full block">
                      <img src={entry.photoUrl} alt="Journal photo" className="h-40 w-full object-cover" />
                    </button>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-primary text-on-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                        {getMarkerNumber(entry.markerId)}
                      </div>
                      <p className="text-xs font-bold flex-1 truncate">{getMarkerName(entry.markerId)}</p>
                      <p className="text-[10px] text-secondary flex-shrink-0">
                        {date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-on-surface leading-relaxed">{entry.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scan Timeline */}
      <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>timeline</span>
          <h2 className="font-headline font-bold text-primary text-lg">Scan Timeline</h2>
          <span className="text-xs text-secondary ml-auto">{scans.length} scans</span>
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
            <div className="space-y-1">
              {visibleScans.map((scan, i) => {
                const date = new Date(scan.timestamp);
                const hasJournal = journalEntries.some((j) => j.markerId === scan.markerId);

                return (
                  <div key={`${scan.markerId}-${i}`} className="flex items-center gap-3 py-2.5 border-b border-outline-variant/10 last:border-0">
                    <div className="w-8 h-8 rounded-md bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {getMarkerNumber(scan.markerId)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{getMarkerName(scan.markerId)}</p>
                      <p className="text-[10px] text-secondary">
                        {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {hasJournal && (
                      <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                    )}
                  </div>
                );
              })}
            </div>

            {sortedScans.length > 10 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full mt-3 py-2.5 text-xs font-bold text-primary bg-primary-fixed rounded-lg active:scale-[0.98] transition-all"
              >
                {showAll ? "Show less" : `View all ${sortedScans.length} scans`}
              </button>
            )}
          </>
        )}
      </div>

      {/* No journal entries yet message */}
      {journalEntries.length === 0 && sortedScans.length > 0 && (
        <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient text-center">
          <span className="material-symbols-outlined text-3xl text-secondary/30 mb-2 block">edit_note</span>
          <p className="text-sm text-secondary">No journal entries yet.</p>
          <p className="text-xs text-secondary/60 mt-1">Visit a scanned marker to write about your experience.</p>
        </div>
      )}

      {/* Full-size photo viewer */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 w-10 h-10 rounded-full flex items-center justify-center"
            onClick={() => setViewingPhoto(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={viewingPhoto} alt="Full size" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
