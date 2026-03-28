"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

interface MarkerHintProps {
  markerId: string;
  markerLat: number;
  markerLng: number;
  hintPhoto?: string;
  hintText?: string;
}

interface CommunityHint {
  id: string;
  userName: string;
  hint: string;
  timestamp: string;
}

function computeDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeBearing(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;

  const dirs = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  return dirs[Math.round(bearing / 45) % 8];
}

export default function MarkerHint({ markerId, markerLat, markerLng, hintPhoto, hintText }: MarkerHintProps) {
  const [user, setUser] = useState<User | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hints, setHints] = useState<CommunityHint[]>([]);
  const [newHint, setNewHint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [bearing, setBearing] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    if (expanded) {
      fetch(`/api/marker-hints?markerId=${markerId}`)
        .then((r) => r.json())
        .then((data) => setHints(data.hints || []))
        .catch(() => setHints([]));

      // Get GPS position
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const d = computeDistance(pos.coords.latitude, pos.coords.longitude, markerLat, markerLng);
            setDistance(Math.round(d));
            setBearing(computeBearing(pos.coords.latitude, pos.coords.longitude, markerLat, markerLng));
          },
          () => {
            // Permission denied or unavailable
          }
        );
      }
    }
  }, [expanded, markerId, markerLat, markerLng]);

  async function handleSubmitHint() {
    if (!newHint.trim() || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/marker-hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markerId, hint: newHint.trim(), idToken }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      const data = await res.json();
      setHints((prev) => [data.hint, ...prev]);
      setNewHint("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Minimal trigger */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-secondary hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-xs">help</span>
        <span>Can&apos;t find this marker?</span>
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-2">
          {/* GPS distance */}
          {distance !== null && (
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="material-symbols-outlined text-xs text-primary">near_me</span>
              <span className="font-bold text-on-surface">{distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}</span>
              away{bearing && <>, look <span className="font-bold text-on-surface">{bearing}</span></>}
            </div>
          )}

          {/* Admin hint photo */}
          {hintPhoto && (
            <button onClick={() => setViewingPhoto(true)} className="w-full block">
              <img src={hintPhoto} alt="Where to find the marker" className="w-full rounded-md object-cover max-h-40" />
            </button>
          )}

          {/* Admin hint text */}
          {hintText && (
            <p className="text-[11px] text-secondary">
              <span className="material-symbols-outlined text-[10px] align-middle mr-0.5">lightbulb</span>
              {hintText}
            </p>
          )}

          {/* Community hints */}
          {hints.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-secondary font-bold uppercase tracking-wide">Walker tips</p>
              {hints.map((h) => (
                <p key={h.id} className="text-[11px] text-secondary">
                  <span className="text-on-surface">{h.hint}</span> — {h.userName}
                </p>
              ))}
            </div>
          )}

          {/* Leave a tip */}
          {user && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newHint}
                onChange={(e) => setNewHint(e.target.value.slice(0, 150))}
                placeholder="Leave a tip..."
                className="flex-1 bg-surface-container rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                onClick={handleSubmitHint}
                disabled={!newHint.trim() || submitting}
                className="bg-primary text-on-primary rounded-full px-3 py-1.5 text-[10px] font-bold disabled:opacity-50 active:scale-95 transition-all whitespace-nowrap"
              >
                {submitting ? "..." : "Share"}
              </button>
            </div>
          )}
          {error && <p className="text-[10px] text-error">{error}</p>}
          {submitted && <p className="text-[10px] text-primary font-medium">Tip shared!</p>}

          {!hintPhoto && !hintText && hints.length === 0 && !distance && (
            <p className="text-[11px] text-secondary">No hints yet. Try enabling location services.</p>
          )}
        </div>
      )}

      {/* Photo viewer */}
      {viewingPhoto && hintPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 w-10 h-10 rounded-full flex items-center justify-center"
            onClick={() => setViewingPhoto(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={hintPhoto} alt="Marker location" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
