"use client";

import { useState, useEffect } from "react";

interface SegmentLeaderboardEntry {
  name: string;
  actualMinutes: number;
  estimatedMinutes: number;
  accuracy: number;
  timestamp: string;
}

interface SegmentInfo {
  fromMarkerId: string;
  fromMarkerName: string;
  toMarkerId: string;
  toMarkerName: string;
  distanceMiles: number;
  estimatedMinutes: number;
  elevationChange: number;
  leaderboard: SegmentLeaderboardEntry[];
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export default function SegmentChallenges() {
  const [segments, setSegments] = useState<SegmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/segments")
      .then((r) => r.json())
      .then((data) => {
        setSegments(data.segments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient animate-pulse">
        <div className="h-5 bg-surface-variant rounded w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface-variant rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Only show segments that have at least one entry
  const activeSegments = segments.filter((s) => s.leaderboard.length > 0);
  const emptySegments = segments.filter((s) => s.leaderboard.length === 0);

  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          timer
        </span>
        <h2 className="font-headline font-bold text-primary text-lg">Segment Challenges</h2>
      </div>
      <p className="text-xs text-secondary mb-4">
        Walk between consecutive markers and match the estimated pace to earn bonus XP. The closer to the estimate, the higher you rank!
      </p>

      {/* Active segments with leaderboards */}
      {activeSegments.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Active Segments</p>
          {activeSegments.map((seg, idx) => {
            const isExpanded = expandedSegment === idx;
            const topEntry = seg.leaderboard[0];
            return (
              <div key={`${seg.fromMarkerId}-${seg.toMarkerId}`}>
                <button
                  onClick={() => setExpandedSegment(isExpanded ? null : idx)}
                  className="w-full bg-surface-container rounded-lg p-3 text-left active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">
                        {seg.fromMarkerName.split(",")[0]} → {seg.toMarkerName.split(",")[0]}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-secondary">{seg.distanceMiles} mi</span>
                        <span className="text-[10px] text-secondary/50">·</span>
                        <span className="text-[10px] text-secondary">Est. {formatTime(seg.estimatedMinutes)}</span>
                        <span className="text-[10px] text-secondary/50">·</span>
                        <span className={`text-[10px] ${seg.elevationChange > 0 ? "text-red-500" : seg.elevationChange < 0 ? "text-green-600" : "text-secondary"}`}>
                          {seg.elevationChange > 0 ? "↑" : seg.elevationChange < 0 ? "↓" : "→"}{Math.abs(seg.elevationChange)}m
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-yellow-500 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                        <span className="text-[10px] font-bold">{topEntry.name}</span>
                      </div>
                      <p className="text-[10px] text-primary font-medium">{topEntry.accuracy}% accuracy</p>
                    </div>
                  </div>
                </button>

                {/* Expanded leaderboard */}
                {isExpanded && (
                  <div className="bg-surface-container rounded-b-lg mx-1 p-3 -mt-1 border-t border-outline-variant/10">
                    <div className="space-y-1.5">
                      {seg.leaderboard.map((entry, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            i === 0 ? "bg-yellow-500 text-white" :
                            i === 1 ? "bg-gray-400 text-white" :
                            i === 2 ? "bg-amber-700 text-white" :
                            "bg-surface-variant text-secondary"
                          }`}>
                            {i + 1}
                          </span>
                          <span className="flex-1 truncate font-medium">{entry.name}</span>
                          <span className="text-secondary">{formatTime(entry.actualMinutes)}</span>
                          <span className={`font-bold min-w-[40px] text-right ${
                            entry.accuracy >= 90 ? "text-green-600" :
                            entry.accuracy >= 75 ? "text-primary" :
                            "text-secondary"
                          }`}>
                            {entry.accuracy}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-secondary/60 mt-2 text-center">
                      Ranked by pace accuracy — closest to {formatTime(seg.estimatedMinutes)} estimated wins
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty segments — ready to be conquered */}
      {emptySegments.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
            Unclaimed Segments ({emptySegments.length})
          </p>
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
            {emptySegments.slice(0, 10).map((seg) => (
              <div
                key={`${seg.fromMarkerId}-${seg.toMarkerId}`}
                className="flex items-center gap-2 bg-surface-container/50 rounded-lg p-2.5"
              >
                <span className="material-symbols-outlined text-secondary text-sm">lock_open</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold truncate">
                    {seg.fromMarkerName.split(",")[0]} → {seg.toMarkerName.split(",")[0]}
                  </p>
                  <p className="text-[9px] text-secondary">
                    {seg.distanceMiles} mi · Est. {formatTime(seg.estimatedMinutes)} · Be the first!
                  </p>
                </div>
              </div>
            ))}
            {emptySegments.length > 10 && (
              <p className="text-[10px] text-secondary text-center py-1">
                + {emptySegments.length - 10} more segments
              </p>
            )}
          </div>
        </div>
      )}

      {segments.length === 0 && (
        <div className="text-center py-6">
          <span className="material-symbols-outlined text-secondary text-3xl mb-2 block">directions_walk</span>
          <p className="text-sm text-secondary">
            Scan consecutive markers on the trail to start competing!
          </p>
          <p className="text-xs text-secondary/60 mt-1">
            Walk from one marker to the next and scan both to record your segment time.
          </p>
        </div>
      )}
    </div>
  );
}
