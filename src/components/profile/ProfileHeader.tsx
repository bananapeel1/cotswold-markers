"use client";

import type { User } from "firebase/auth";
import { getRank, getNextRank, RANKS } from "@/lib/xp";

interface ProfileHeaderProps {
  user: User;
  scanCount: number;
  badgeCount: number;
  streak: number;
  joinDate: string | null;
  xp: number;
}

export default function ProfileHeader({ user, scanCount, streak, joinDate, xp }: ProfileHeaderProps) {
  const rank = getRank(xp);
  const nextRank = getNextRank(xp);
  const progressPct = Math.round((scanCount / 50) * 100);
  const initial = (user.displayName || user.email || "W")[0].toUpperCase();

  // XP progress to next rank
  const currentRankIdx = RANKS.findIndex((r) => r.title === rank.title);
  const nextMin = nextRank ? nextRank.minXP : rank.minXP;
  const xpProgress = nextRank
    ? Math.round(((xp - rank.minXP) / (nextMin - rank.minXP)) * 100)
    : 100;

  return (
    <div className="bg-primary text-on-primary px-6 pt-6 pb-20 relative overflow-hidden">
      {/* Background decoration */}
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

        {/* Row 1: Avatar + Name + Progress Ring */}
        <div className="flex items-center gap-4">
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

          {/* Name + Rank */}
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-extrabold text-2xl leading-none truncate">
              {user.displayName || "Trail Walker"}
            </h1>
            <p className="text-xs opacity-60 mt-0.5">{user.email}</p>
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

        {/* Row 2: XP + Rank bar */}
        <div className="mt-4 bg-on-primary/10 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            {/* Rank badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-on-primary/20 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-base text-on-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {rank.icon}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold leading-none">{rank.title}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{xp.toLocaleString()} XP</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <div className="flex items-center gap-1 text-[10px] opacity-80">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  {streak}d streak
                </div>
              )}
            </div>
          </div>

          {/* XP progress bar */}
          {nextRank ? (
            <div>
              <div className="h-1.5 bg-on-primary/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-on-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] opacity-50">{rank.title}</span>
                <span className="text-[9px] opacity-50">{nextRank.title} — {(nextMin - xp).toLocaleString()} XP</span>
              </div>
            </div>
          ) : (
            <p className="text-[10px] opacity-70 text-center">Maximum rank achieved</p>
          )}

          {/* Rank dots */}
          <div className="flex items-center justify-center gap-1 mt-2">
            {RANKS.map((r, i) => (
              <div
                key={r.title}
                className={`w-2 h-2 rounded-full transition-all ${
                  i <= currentRankIdx ? "bg-on-primary" : "bg-on-primary/20"
                }`}
                title={r.title}
              />
            ))}
          </div>
        </div>

        {/* Join date */}
        {joinDate && (
          <p className="text-[10px] opacity-50 mt-3">
            Walking since {new Date(joinDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}
