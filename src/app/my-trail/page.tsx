"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUserScans } from "@/hooks/useUserScans";
import { BADGES, getBadgeById } from "@/lib/badges";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useEffect } from "react";

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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-sm opacity-80 hover:opacity-100 mb-2 block">
            ← Back
          </Link>
          <h1 className="font-headline font-extrabold text-2xl">My Trail</h1>
          <p className="text-sm opacity-80 mt-1">{user.email}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-low rounded-xl p-4 text-center">
            <p className="font-headline font-extrabold text-2xl text-primary">{uniqueMarkers.size}</p>
            <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Markers</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 text-center">
            <p className="font-headline font-extrabold text-2xl text-primary">{badges.length}</p>
            <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Badges</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-primary text-base">local_fire_department</span>
              <p className="font-headline font-extrabold text-2xl text-primary">{streak.current}</p>
            </div>
            <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Streak</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-surface-container-low rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Trail Progress</span>
            <span className="text-sm font-bold text-primary">{uniqueMarkers.size}/15</span>
          </div>
          <div className="h-3 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${Math.round((uniqueMarkers.size / 15) * 100)}%` }}
            />
          </div>
          {streak.best > 0 && (
            <p className="text-[10px] text-secondary mt-2">Best streak: {streak.best} day{streak.best !== 1 ? "s" : ""}</p>
          )}
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

        {/* Scan timeline */}
        <div className="bg-surface-container-low rounded-xl p-5">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Scan Timeline ({scans.length})
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

                return (
                  <div key={`${scan.markerId}-${i}`} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
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
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
