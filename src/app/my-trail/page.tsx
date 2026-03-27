"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useUserScans } from "@/hooks/useUserScans";
import { useJournal } from "@/hooks/useJournal";
import CompletionCertificate from "@/components/CompletionCertificate";

import ProfileHeader from "@/components/profile/ProfileHeader";
import StatsGrid from "@/components/profile/StatsGrid";
import AchievementShowcase from "@/components/profile/AchievementShowcase";
import TrailJournal from "@/components/profile/TrailJournal";
import AccountSettings from "@/components/profile/AccountSettings";
import RewardsWallet from "@/components/profile/RewardsWallet";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

// Lazy-load map (heavy Mapbox dependency)
const PersonalTrailMap = dynamic(
  () => import("@/components/profile/PersonalTrailMap"),
  { ssr: false, loading: () => <div className="h-[400px] bg-surface-container rounded-lg animate-pulse" /> }
);

interface MarkerData {
  id: string;
  shortCode: string;
  name: string;
  latitude: number;
  longitude: number;
  segment: string;
}

type Tab = "overview" | "journal" | "map" | "settings";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "journal", label: "Journal", icon: "auto_stories" },
  { id: "map", label: "Map", icon: "map" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export default function MyTrailPage() {
  const { scans, badges, streak, loading, scannedMarkerIds } = useUserScans();
  const { entries: journalEntries } = useJournal();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ rank: number; name: string; scanCount: number; badgeCount: number; isComplete: boolean; isCurrentUser?: boolean }[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Load markers for map + segments
  useEffect(() => {
    fetch("/data/markers.json")
      .then((r) => r.json())
      .then((data) => setMarkers(data))
      .catch(() => {});
  }, []);

  // Load leaderboard
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-secondary">Loading your trail...</p>
        </div>
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
            className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold inline-block active:scale-95 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const uniqueMarkers = new Set(scans.map((s) => s.markerId));
  const scanCount = uniqueMarkers.size;
  const sortedScans = [...scans].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Join date — earliest scan or account creation time
  const joinDate = sortedScans.length > 0
    ? sortedScans[sortedScans.length - 1].timestamp
    : user.metadata.creationTime || null;

  // Unique segments from markers data
  const segments = [...new Set(markers.map((m) => m.segment))].filter(Boolean);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Profile Header */}
      <ProfileHeader
        user={user}
        scanCount={scanCount}
        badgeCount={badges.length}
        streak={streak.current}
        joinDate={joinDate}
      />

      {/* Tab Bar — overlapping header */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-20">
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-1.5 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-lg text-center transition-all active:scale-95 ${
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-secondary hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-2xl mx-auto px-4 mt-5 space-y-5">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            <StatsGrid
              scans={scans}
              scanCount={scanCount}
              badgeCount={badges.length}
              streak={streak.current}
              bestStreak={streak.best}
            />

            <AchievementShowcase badges={badges} scans={scans} />

            {/* Completion Certificate */}
            {scanCount >= 50 && (
              <CompletionCertificate
                userName={user.displayName || user.email || "Trail Walker"}
                completionDate={sortedScans[0]?.timestamp || new Date().toISOString()}
                badgeCount={badges.length}
              />
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-base">leaderboard</span>
                  <h2 className="font-headline font-bold text-primary text-lg">Leaderboard</h2>
                </div>
                {userRank && (
                  <p className="text-xs text-secondary mb-3">
                    You&apos;re ranked <strong className="text-primary">#{userRank}</strong> out of all walkers
                  </p>
                )}
                <div className="space-y-1.5">
                  {leaderboard.slice(0, 10).map((entry) => (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        entry.isCurrentUser ? "bg-primary-fixed border border-primary/10" : "bg-surface-container"
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        entry.rank === 1 ? "bg-yellow-500 text-white" :
                        entry.rank === 2 ? "bg-gray-400 text-white" :
                        entry.rank === 3 ? "bg-amber-700 text-white" :
                        "bg-surface-variant text-secondary"
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
                          {entry.isComplete && (
                            <span className="text-primary ml-1">
                              <span className="material-symbols-outlined text-[10px] align-middle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Complete
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards Wallet */}
            <RewardsWallet />
          </>
        )}

        {/* ── JOURNAL TAB ── */}
        {activeTab === "journal" && (
          <TrailJournal
            scans={scans}
            journalEntries={journalEntries}
            segments={segments}
          />
        )}

        {/* ── MAP TAB ── */}
        {activeTab === "map" && (
          <PersonalTrailMap
            markers={markers}
            scannedMarkerIds={scannedMarkerIds}
          />
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <AccountSettings user={user} />
        )}
      </main>
    </div>
  );
}
