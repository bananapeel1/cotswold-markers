"use client";

import { useState, useEffect } from "react";
import { useCommunityPhotos } from "@/hooks/useCommunityPhotos";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import type { CommunityPhoto } from "@/data/types";

type SeasonFilter = "all" | "spring" | "summer" | "autumn" | "winter";

const SEASON_MONTHS: Record<SeasonFilter, number[]> = {
  all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CommunityGallery({ markerId }: { markerId: string }) {
  const { photos, loading } = useCommunityPhotos(markerId);
  const [filter, setFilter] = useState<SeasonFilter>("all");
  const [viewing, setViewing] = useState<CommunityPhoto | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  if (loading) return null;

  // "Needs photos" prompt when no community photos exist
  if (photos.length === 0) {
    return (
      <section className="mx-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-secondary text-base">photo_library</span>
          <h3 className="font-headline font-bold text-sm">Community Photos</h3>
        </div>
        <div className="bg-surface-container-lowest rounded-md p-4 text-center">
          <span className="material-symbols-outlined text-3xl text-secondary/40 mb-1 block">add_a_photo</span>
          <p className="text-xs text-secondary">
            {user
              ? "Be the first to share a photo of this spot."
              : "No community photos yet."}
          </p>
        </div>
      </section>
    );
  }

  const filtered = filter === "all"
    ? photos
    : photos.filter((p) => SEASON_MONTHS[filter].includes(p.month));

  async function handleReport(photoId: string) {
    if (!user || reporting) return;
    setReporting(true);
    try {
      const res = await fetch("/api/community-photos/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, reason: "inappropriate" }),
      });
      if (res.ok || res.status === 409) {
        setReported((prev) => new Set(prev).add(photoId));
      }
    } catch {
      // Silently fail
    } finally {
      setReporting(false);
    }
  }

  return (
    <section className="mx-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-secondary text-base">photo_library</span>
        <h3 className="font-headline font-bold text-sm">Community Photos</h3>
        <span className="text-[11px] text-secondary">{photos.length}</span>
      </div>

      {/* Season filter chips */}
      {photos.length > 3 && (
        <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
          {(["all", "spring", "summer", "autumn", "winter"] as SeasonFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
                filter === s
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-secondary"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Photo grid */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filtered.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setViewing(photo)}
            className="flex-shrink-0 relative rounded-md overflow-hidden active:scale-95 transition-transform"
          >
            <img
              src={photo.photoUrl}
              alt={`By ${photo.userName}`}
              className="h-24 w-32 object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
              <p className="text-[9px] text-white/90 font-medium">
                {MONTH_NAMES[photo.month]} · {photo.userName}
              </p>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-[11px] text-secondary py-2">No photos for this season yet.</p>
      )}

      {/* Lightbox */}
      {viewing && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 w-10 h-10 rounded-full flex items-center justify-center z-10"
            onClick={() => setViewing(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <img
            src={viewing.photoUrl}
            alt="Community photo"
            className="max-w-full max-h-[75vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div
            className="flex items-center gap-3 mt-3 bg-black/40 rounded-full px-4 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/80 text-xs">
              {viewing.userName} · {MONTH_NAMES[viewing.month]} {new Date(viewing.timestamp).getFullYear()}
            </span>

            {user && user.uid !== viewing.userId && (
              reported.has(viewing.id) ? (
                <span className="text-[10px] text-white/50 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check</span>
                  Reported
                </span>
              ) : (
                <button
                  onClick={() => handleReport(viewing.id)}
                  disabled={reporting}
                  className="text-[10px] text-white/60 flex items-center gap-1 hover:text-white/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">flag</span>
                  Report
                </button>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}
