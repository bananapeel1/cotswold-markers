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
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export default function SegmentChallenges() {
  const [segments, setSegments] = useState<SegmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);
  const [showAllUnclaimed, setShowAllUnclaimed] = useState(false);

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
            <div key={i} className="h-20 bg-surface-variant rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const activeSegments = segments.filter((s) => s.leaderboard.length > 0);
  const emptySegments = segments.filter((s) => s.leaderboard.length === 0);
  const visibleUnclaimed = showAllUnclaimed ? emptySegments : emptySegments.slice(0, 4);

  return (
    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          timer
        </span>
        <h2 className="font-headline font-bold text-primary text-lg">Segment Challenges</h2>
      </div>
      <p className="text-xs text-secondary mb-5">
        Walk between consecutive markers and match the estimated pace to earn bonus XP. The closer to the estimate, the higher you rank!
      </p>

      {/* Active segments with leaderboards */}
      {activeSegments.length > 0 && (
        <div className="space-y-3 mb-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Active Segments</p>
          {activeSegments.map((seg, idx) => {
            const isExpanded = expandedSegment === idx;
            const topEntry = seg.leaderboard[0];
            return (
              <div key={`${seg.fromMarkerId}-${seg.toMarkerId}`}>
                <button
                  onClick={() => setExpandedSegment(isExpanded ? null : idx)}
                  className="w-full border border-outline-variant/20 rounded-lg p-4 text-left active:scale-[0.99] transition-all hover:bg-surface-container/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        hiking
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">
                        {seg.fromMarkerName.split(",")[0]} → {seg.toMarkerName.split(",")[0]}
                      </p>
                      <p className="text-[11px] text-secondary mt-0.5">
                        {seg.distanceMiles} mi  ·  Est. {formatTime(seg.estimatedMinutes)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                        <span className="text-xs font-bold">{topEntry.name}</span>
                      </div>
                      <p className="text-[10px] text-primary font-bold mt-0.5">{topEntry.accuracy}%</p>
                    </div>
                  </div>
                </button>

                {/* Expanded leaderboard */}
                {isExpanded && (
                  <div className="border border-t-0 border-outline-variant/20 rounded-b-lg mx-1 p-3 -mt-px">
                    <div className="space-y-1.5">
                      {seg.leaderboard.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
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

      {/* Unclaimed segments */}
      {emptySegments.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">
            Unclaimed Segments ({emptySegments.length})
          </p>
          <div className="space-y-2">
            {visibleUnclaimed.map((seg) => (
              <div
                key={`${seg.fromMarkerId}-${seg.toMarkerId}`}
                className="border border-outline-variant/15 rounded-lg p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary-fixed/50 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary/60 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    hiking
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">
                    {seg.fromMarkerName.split(",")[0]} → {seg.toMarkerName.split(",")[0]}
                  </p>
                  <p className="text-[11px] text-secondary mt-0.5">
                    {seg.distanceMiles} mi  ·  Est. {formatTime(seg.estimatedMinutes)}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide flex-shrink-0">
                  Be the first!
                </span>
              </div>
            ))}
          </div>
          {emptySegments.length > 4 && (
            <button
              onClick={() => setShowAllUnclaimed(!showAllUnclaimed)}
              className="w-full mt-3 py-2.5 text-xs font-bold text-primary bg-primary-fixed rounded-lg active:scale-[0.98] transition-all"
            >
              {showAllUnclaimed ? "Show less" : `View all ${emptySegments.length} segments`}
            </button>
          )}
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
