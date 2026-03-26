"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUserScans } from "@/hooks/useUserScans";
import { BADGES } from "@/lib/badges";
import CompletionCertificate from "@/components/CompletionCertificate";
import FriendProgress from "@/components/FriendProgress";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useJournal, type JournalEntryData } from "@/hooks/useJournal";

const WEATHER_ICONS: Record<number, string> = {
  0: "wb_sunny", 1: "wb_sunny", 2: "cloud", 3: "cloud",
  45: "foggy", 48: "foggy",
  51: "water_drop", 53: "water_drop", 55: "water_drop",
  61: "rainy", 63: "rainy", 65: "rainy",
  71: "ac_unit", 73: "ac_unit", 75: "ac_unit",
  80: "rainy", 81: "rainy", 82: "rainy",
  95: "thunderstorm", 96: "thunderstorm", 99: "thunderstorm",
};

export default function MyTrailPage() {
  const { scans, badges, streak, loading } = useUserScans();
  const { entries: journalEntries } = useJournal();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<{ rank: number; name: string; scanCount: number; badgeCount: number; isComplete: boolean; isCurrentUser?: boolean }[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/leaderboard?userId=${user.uid}`)
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setUserRank(data.userRank);
      })
      .catch(() => {});
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <Image src="/images/logo.png" alt="TrailTap" width={48} height={48} className="mx-auto mb-4" />
          <h1 className="font-headline text-2xl font-extrabold text-primary mb-2">My Trail</h1>
          <p className="text-sm text-secondary mb-6">
            Sign in to track your progress, earn badges, and save your Cotswold Way journey across devices.
          </p>
          <Link
            href="/login"
            className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold inline-block active:scale-95 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const uniqueMarkers = new Set(scans.map((s) => s.markerId));
  const sortedScans = [...scans].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const progressPct = Math.round((uniqueMarkers.size / 15) * 100);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <header className="bg-primary text-on-primary px-6 pt-6 pb-16 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 opacity-5">
          <span className="material-symbols-outlined text-[200px]">hiking</span>
        </div>
        <div className="max-w-2xl mx-auto relative z-10">
          <button onClick={() => window.history.back()} className="text-sm opacity-80 hover:opacity-100 mb-4 block bg-transparent border-none text-on-primary cursor-pointer p-0">
            ← Back
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-on-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary">person</span>
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-2xl leading-none">My Trail</h1>
              <p className="text-xs opacity-60 mt-0.5">{user.displayName || user.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 -mt-10 relative z-10 space-y-5">
        {/* Stats + Progress card — overlapping header */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient">
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center">
              <p className="font-headline font-extrabold text-3xl text-primary">{uniqueMarkers.size}</p>
              <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Markers</p>
            </div>
            <div className="text-center border-x border-outline-variant/20">
              <p className="font-headline font-extrabold text-3xl text-primary">{badges.length}</p>
              <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Badges</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-primary text-base">local_fire_department</span>
                <p className="font-headline font-extrabold text-3xl text-primary">{streak.current}</p>
              </div>
              <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Streak</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Trail Progress</span>
            <span className="text-xs font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[10px] text-secondary mt-2">
            {uniqueMarkers.size}/15 markers scanned
            {streak.best > 0 && ` · Best streak: ${streak.best} day${streak.best !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Badges */}
        <div className="bg-surface-container-low rounded-xl p-5">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">Badges</h2>

          {(["milestone", "special", "seasonal", "secret"] as const).map((category) => {
            const categoryBadges = BADGES.filter((b) => b.category === category);
            return (
              <div key={category} className="mb-5 last:mb-0">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3 capitalize">{category}</p>
                <div className="grid grid-cols-3 gap-2">
                  {categoryBadges.map((badge) => {
                    const earned = badges.includes(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`flex flex-col items-center p-3 rounded-xl text-center transition-all ${
                          earned
                            ? "bg-primary-fixed"
                            : "bg-surface-container opacity-40"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-2xl mb-1 ${earned ? "text-primary" : "text-secondary"}`}
                          style={earned ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {badge.icon}
                        </span>
                        <span className="text-[10px] font-bold leading-tight">{badge.name}</span>
                        {!earned && badge.category !== "secret" && (
                          <span className="text-[8px] text-secondary mt-0.5 leading-tight">{badge.description}</span>
                        )}
                        {!earned && badge.category === "secret" && (
                          <span className="text-[8px] text-secondary mt-0.5">???</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion certificate */}
        {uniqueMarkers.size >= 15 && (
          <CompletionCertificate
            userName={user.displayName || user.email || "Trail Walker"}
            completionDate={sortedScans[0]?.timestamp || new Date().toISOString()}
            badgeCount={badges.length}
          />
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-surface-container-low rounded-xl p-5">
            <h2 className="font-headline font-bold text-primary text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">leaderboard</span>
              Leaderboard
            </h2>
            {userRank && (
              <p className="text-xs text-secondary mb-3">
                You&apos;re ranked <strong className="text-primary">#{userRank}</strong> out of all walkers
              </p>
            )}
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    entry.isCurrentUser ? "bg-primary-fixed" : "bg-surface-container"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    entry.rank <= 3 ? "bg-primary text-on-primary" : "bg-surface-variant text-secondary"
                  }`}>
                    {entry.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {entry.name}
                      {entry.isCurrentUser && <span className="text-xs font-normal text-secondary ml-1">(you)</span>}
                    </p>
                    <p className="text-[10px] text-secondary">
                      {entry.scanCount} markers · {entry.badgeCount} badges
                      {entry.isComplete && " · ✓ Complete"}
                    </p>
                  </div>
                  {entry.rank === 1 && <span className="text-lg">🥇</span>}
                  {entry.rank === 2 && <span className="text-lg">🥈</span>}
                  {entry.rank === 3 && <span className="text-lg">🥉</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trail Buddies */}
        <FriendProgress userScanCount={uniqueMarkers.size} userBadgeCount={badges.length} />

        {/* Scan timeline */}
        <div className="bg-surface-container-low rounded-xl p-5">
          <h2 className="font-headline font-bold text-primary text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">timeline</span>
            Trail Journal ({scans.length})
          </h2>

          {sortedScans.length === 0 ? (
            <p className="text-sm text-secondary italic">
              No scans yet. Visit a marker on the Cotswold Way to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {sortedScans.map((scan, i) => {
                const date = new Date(scan.timestamp);
                const weatherIcon = scan.weather?.code !== undefined ? WEATHER_ICONS[scan.weather.code] || "wb_sunny" : null;
                const journalForScan = journalEntries.filter((j: JournalEntryData) => j.markerId === scan.markerId);

                return (
                  <div key={`${scan.markerId}-${i}`} className="bg-surface-container rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {scan.markerId.match(/cw-(\d+)/)?.[1] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">
                          {scan.markerId.replace(/^cw-\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </p>
                        <p className="text-[10px] text-secondary">
                          {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at{" "}
                          {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {weatherIcon && (
                        <div className="flex items-center gap-1 text-secondary flex-shrink-0">
                          <span className="material-symbols-outlined text-sm">{weatherIcon}</span>
                          {scan.weather?.temp !== undefined && (
                            <span className="text-[10px]">{Math.round(scan.weather.temp)}°</span>
                          )}
                        </div>
                      )}
                    </div>
                    {journalForScan.length > 0 && (
                      <div className="px-3 pb-3 pt-0 ml-11">
                        {journalForScan.map((j: JournalEntryData) => (
                          <div key={j.id} className="flex gap-2 items-start">
                            {j.photoUrl && (
                              <img src={j.photoUrl} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                            )}
                            {j.note && (
                              <p className="text-xs text-secondary italic leading-relaxed line-clamp-2">&ldquo;{j.note}&rdquo;</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
