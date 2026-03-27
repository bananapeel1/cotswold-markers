"use client";

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, getAppCheckToken } from "@/lib/firebase-client";
import { checkBadges, calculateStreak, type ScanEntry, type StreakData } from "@/lib/badges";

interface UserScanData {
  scans: ScanEntry[];
  badges: string[];
  streak: StreakData;
  loading: boolean;
  scannedMarkerIds: string[];
  recordScan: (markerId: string, weather?: { temp?: number; code?: number; isRaining?: boolean }) => Promise<string[]>;
}

export function useUserScans(): UserScanData {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [streak, setStreak] = useState<StreakData>({ current: 0, best: 0, lastScanDate: null });
  const [loading, setLoading] = useState(true);

  // Listen for auth state independently (no AuthProvider dependency)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Load scan data once auth state is known
  useEffect(() => {
    if (!authReady) return;
    if (user) {
      // Authenticated — load from server
      fetch("/api/user/scans")
        .then((r) => r.json())
        .then((data) => {
          setScans(data.scans || []);
          setBadges(data.badges || []);
          setStreak(data.streak || { current: 0, best: 0, lastScanDate: null });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // Not authenticated — fall back to localStorage
      const stored = localStorage.getItem("trailtap-scanned");
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      const timestamps = JSON.parse(localStorage.getItem("trailtap-scan-times") || "{}");

      const localScans: ScanEntry[] = parsed.map((id) => ({
        markerId: id,
        timestamp: timestamps[id] || new Date().toISOString(),
      }));

      setScans(localScans);
      setBadges(checkBadges(localScans));
      setStreak(calculateStreak(localScans));
      setLoading(false);
    }
  }, [user, authReady]);

  const scannedMarkerIds = scans.map((s) => s.markerId);

  const recordScan = useCallback(
    async (markerId: string, weather?: { temp?: number; code?: number; isRaining?: boolean }): Promise<string[]> => {
      // Already scanned this marker
      if (scannedMarkerIds.includes(markerId)) return [];

      if (user) {
        // Authenticated — send to API with ID token
        const idToken = await auth.currentUser?.getIdToken();
        const appCheck = await getAppCheckToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (appCheck) headers["X-Firebase-AppCheck"] = appCheck;
        const res = await fetch("/api/scan", {
          method: "POST",
          headers,
          body: JSON.stringify({ markerId, source: "direct", weather, idToken }),
        });
        const data = await res.json();
        const newBadges: string[] = data.newBadges || [];

        // Optimistically update local state
        const newScan: ScanEntry = { markerId, timestamp: new Date().toISOString(), weather };
        setScans((prev) => [...prev, newScan]);
        if (newBadges.length > 0) {
          setBadges((prev) => [...new Set([...prev, ...newBadges])]);
        }

        return newBadges;
      } else {
        // Not authenticated — localStorage + API for global count
        const stored = localStorage.getItem("trailtap-scanned");
        const parsed: string[] = stored ? JSON.parse(stored) : [];
        parsed.push(markerId);
        localStorage.setItem("trailtap-scanned", JSON.stringify(parsed));

        const timestamps = JSON.parse(localStorage.getItem("trailtap-scan-times") || "{}");
        timestamps[markerId] = new Date().toISOString();
        localStorage.setItem("trailtap-scan-times", JSON.stringify(timestamps));

        // Still record global count
        getAppCheckToken().then((appCheck) => {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (appCheck) headers["X-Firebase-AppCheck"] = appCheck;
          fetch("/api/scan", {
            method: "POST",
            headers,
            body: JSON.stringify({ markerId, source: "direct" }),
          });
        });

        const newScan: ScanEntry = { markerId, timestamp: new Date().toISOString() };
        setScans((prev) => {
          const updated = [...prev, newScan];
          const computed = checkBadges(updated);
          const prevBadges = checkBadges(prev);
          const newlyEarned = computed.filter((b) => !prevBadges.includes(b));
          setBadges(computed);
          setStreak(calculateStreak(updated));
          return updated;
        });

        return [];
      }
    },
    [user, scannedMarkerIds]
  );

  return { scans, badges, streak, loading, scannedMarkerIds, recordScan };
}
