"use client";

import type { User } from "firebase/auth";

function getTrailTitle(scanCount: number): { title: string; icon: string } {
  if (scanCount >= 50) return { title: "Cotswold Conqueror", icon: "emoji_events" };
  if (scanCount >= 40) return { title: "Almost There", icon: "flag" };
  if (scanCount >= 25) return { title: "Seasoned Walker", icon: "military_tech" };
  if (scanCount >= 10) return { title: "Trail Regular", icon: "landscape" };
  if (scanCount >= 5) return { title: "Explorer", icon: "hiking" };
  if (scanCount >= 1) return { title: "Beginner Walker", icon: "footprint" };
  return { title: "New Walker", icon: "person" };
}

interface ProfileHeaderProps {
  user: User;
  scanCount: number;
  badgeCount: number;
  streak: number;
  joinDate: string | null;
  liveWalkers?: number;
}

export default function ProfileHeader({ user, scanCount, badgeCount, streak, joinDate, liveWalkers }: ProfileHeaderProps) {
  const { title, icon } = getTrailTitle(scanCount);
  const progressPct = Math.round((scanCount / 50) * 100);
  const initial = (user.displayName || user.email || "W")[0].toUpperCase();

  return (
    <div className="bg-primary text-on-primary px-6 pt-6 pb-14 relative overflow-hidden">
      <div className="absolute -right-12 -bottom-12 opacity-5">
        <span className="material-symbols-outlined text-[200px]">hiking</span>
      </div>
      <div className="max-w-2xl mx-auto relative z-10">
        <button
          onClick={() => window.history.back()}
          className="text-sm opacity-80 hover:opacity-100 mb-5 block bg-transparent border-none text-on-primary cursor-pointer p-0"
        >
          ← Back
        </button>

        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-14 h-14 rounded-full border-2 border-on-primary/30 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-on-primary/20 flex items-center justify-center text-xl font-bold">
              {initial}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-extrabold text-xl leading-none truncate">
              {user.displayName || "Trail Walker"}
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {icon}
              </span>
              <span className="text-xs font-bold opacity-90">{title}</span>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                className="text-on-primary/20"
                strokeWidth="2.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                className="text-on-primary"
                strokeWidth="2.5"
                strokeDasharray={`${progressPct}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold leading-none">{scanCount}</span>
              <span className="text-[8px] opacity-60">/50</span>
            </div>
          </div>
        </div>

        {/* Inline stats row */}
        <div className="flex items-center gap-4 text-[11px] opacity-80">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
            {badgeCount} badges
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            {streak} day streak
          </span>
          {joinDate && (
            <span className="flex items-center gap-1">
              Since {new Date(joinDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Live walkers */}
        {liveWalkers !== undefined && liveWalkers > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] opacity-70">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            {liveWalkers} {liveWalkers === 1 ? "walker" : "walkers"} on trail right now
          </div>
        )}
      </div>
    </div>
  );
}
