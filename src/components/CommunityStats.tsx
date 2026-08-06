"use client";

import { useCommunityStats } from "@/hooks/useCommunityStats";

export default function CommunityStats() {
  const stats = useCommunityStats();

  if (!stats || (stats.totalWalkers === 0 && stats.activeNow === 0)) return null;

  return (
    <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-secondary">
      {stats.totalWalkers > 0 && (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">group</span>
          <span>
            <strong className="text-primary">{stats.totalWalkers.toLocaleString("en-GB")}</strong> walkers
          </span>
        </div>
      )}
      {stats.activeNow > 0 && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span>
            <strong className="text-primary">{stats.activeNow}</strong> on the trail now
          </span>
        </div>
      )}
    </div>
  );
}
