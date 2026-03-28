"use client";

import { useState, useEffect } from "react";
import type { CommunityPhoto } from "@/data/types";

type FilterTab = "flagged" | "all" | "rejected";

export default function PhotoModeration() {
  const [photos, setPhotos] = useState<CommunityPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("flagged");
  const [acting, setActing] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/photos");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }

  async function moderate(photoId: string, action: "approve" | "reject" | "remove") {
    setActing(photoId);
    try {
      const res = await fetch("/api/community-photos/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, action }),
      });
      if (res.ok) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? {
                  ...p,
                  moderationStatus: action === "approve" ? "published" : "rejected",
                }
              : p
          )
        );
      }
    } catch {
      // Fail silently
    } finally {
      setActing(null);
    }
  }

  const filtered = photos.filter((p) => {
    if (tab === "flagged") return p.moderationStatus === "flagged";
    if (tab === "rejected") return p.moderationStatus === "rejected";
    return true;
  });

  const flaggedCount = photos.filter((p) => p.moderationStatus === "flagged").length;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6">
        {([
          { key: "flagged" as FilterTab, label: `Flagged (${flaggedCount})` },
          { key: "all" as FilterTab, label: `All (${photos.length})` },
          { key: "rejected" as FilterTab, label: "Rejected" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === key
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-secondary hover:text-on-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-surface-variant rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-secondary">
          <span className="material-symbols-outlined text-4xl mb-2 block">photo_library</span>
          <p className="text-sm">No {tab} photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((photo) => (
            <div
              key={photo.id}
              className="bg-surface-container rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setViewingPhoto(photo.photoUrl)}
                className="w-full block"
              >
                <img
                  src={photo.photoUrl}
                  alt={`By ${photo.userName}`}
                  className="w-full aspect-[4/3] object-cover"
                />
              </button>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold truncate">{photo.userName}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    photo.moderationStatus === "flagged"
                      ? "bg-error-container text-error"
                      : photo.moderationStatus === "rejected"
                      ? "bg-surface-variant text-secondary"
                      : "bg-primary-fixed text-primary"
                  }`}>
                    {photo.moderationStatus}
                  </span>
                </div>
                <p className="text-[10px] text-secondary">
                  Marker: {photo.markerId} · {photo.source} · Reports: {photo.reportCount}
                </p>
                {photo.moderationReason && (
                  <p className="text-[10px] text-error">{photo.moderationReason}</p>
                )}
                <div className="flex gap-1.5">
                  {photo.moderationStatus !== "published" && (
                    <button
                      onClick={() => moderate(photo.id, "approve")}
                      disabled={acting === photo.id}
                      className="flex-1 bg-primary text-on-primary rounded-full py-1.5 text-[11px] font-bold disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {photo.moderationStatus !== "rejected" && (
                    <button
                      onClick={() => moderate(photo.id, "reject")}
                      disabled={acting === photo.id}
                      className="flex-1 bg-surface-variant text-secondary rounded-full py-1.5 text-[11px] font-bold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => moderate(photo.id, "remove")}
                    disabled={acting === photo.id}
                    className="bg-error-container text-error rounded-full px-3 py-1.5 text-[11px] font-bold disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 w-10 h-10 rounded-full flex items-center justify-center"
            onClick={() => setViewingPhoto(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={viewingPhoto} alt="Full size" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
