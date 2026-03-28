"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useTrailConditions } from "@/hooks/useTrailConditions";
import type { TrailConditionType } from "@/data/types";
import { getConditionIcon, getConditionLabel } from "@/data/types";
import CommunityPhotoUpload from "./CommunityPhotoUpload";

const CONDITION_TYPES: TrailConditionType[] = [
  "muddy",
  "fallen-tree",
  "flooded",
  "overgrown",
  "slippery",
  "livestock",
  "other",
];

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TrailConditions({ markerId }: { markerId: string }) {
  const { conditions, loading, submitCondition } = useTrailConditions(markerId);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<TrailConditionType | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoStoragePath, setPhotoStoragePath] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  async function handleSubmit() {
    if (!selectedType) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitCondition(selectedType, note || undefined, photoUrl || undefined, photoStoragePath || undefined);
      setSubmitted(true);
      setShowForm(false);
      setSelectedType(null);
      setNote("");
      setPhotoUrl(null);
      setPhotoStoragePath(null);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="w-20 h-4 bg-surface-variant rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      {/* Header row — tap white area to expand/collapse */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => {
          if (expanded || showForm) {
            setExpanded(false);
            setShowForm(false);
            setSelectedType(null);
            setNote("");
            setError(null);
          } else {
            setExpanded(true);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-base">warning</span>
          <h3 className="font-headline font-bold text-sm">Trail Conditions</h3>
          {conditions.length === 0 && !showForm && (
            <span className="text-[11px] text-secondary">· All clear</span>
          )}
          {conditions.length > 0 && !expanded && !showForm && (
            <span className="text-[11px] text-secondary">· {conditions.length}</span>
          )}
        </div>
        {user ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowForm(true); setExpanded(true); }}
            className="text-[11px] font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full active:scale-95 transition-transform"
          >
            Report
          </button>
        ) : (
          <Link
            href="/login"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] font-bold text-primary bg-primary-fixed px-3 py-1 rounded-full"
          >
            Sign in
          </Link>
        )}
      </div>

      {/* Expanded content */}
      {(expanded || showForm) && (
        <>
          {/* Condition chips */}
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {conditions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => c.photoUrl && setViewingPhoto(c.photoUrl)}
                  className={`flex items-center gap-1 bg-surface-container rounded-full px-2.5 py-1 text-[11px] ${c.photoUrl ? "cursor-pointer active:scale-95 transition-transform" : "cursor-default"}`}
                >
                  <span className="material-symbols-outlined text-xs">
                    {getConditionIcon(c.conditionType)}
                  </span>
                  <span className="font-medium">{getConditionLabel(c.conditionType)}</span>
                  {c.photoUrl && (
                    <span className="material-symbols-outlined text-xs text-secondary">photo_camera</span>
                  )}
                  <span className="text-secondary">{timeAgo(c.timestamp)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Confirmation */}
          {submitted && (
            <div className="flex items-center gap-2 bg-primary-fixed/30 rounded-md p-2.5 text-xs text-primary font-medium mt-2">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              Report submitted. Thank you!
            </div>
          )}
        </>
      )}

      {/* Report form */}
      {showForm && (
        <div className="bg-surface-container rounded-md p-3 mt-2 space-y-2.5">
          <p className="text-xs font-bold">What did you encounter?</p>
          <div className="flex flex-wrap gap-1.5">
            {CONDITION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  selectedType === type
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-lowest text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-xs">
                  {getConditionIcon(type)}
                </span>
                {getConditionLabel(type)}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Add a note (optional)"
            rows={2}
            className="w-full bg-surface-container-lowest rounded-md p-2.5 text-xs resize-none outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-secondary">{note.length}/200</span>
            <CommunityPhotoUpload
              storagePath={`conditions/${markerId}/${user?.uid || "anon"}`}
              currentUrl={photoUrl}
              onUpload={(url, path) => { setPhotoUrl(url); setPhotoStoragePath(path); }}
              onRemove={() => { setPhotoUrl(null); setPhotoStoragePath(null); }}
            />
          </div>
          {error && <p className="text-[10px] text-error">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!selectedType || submitting}
              className="bg-primary text-on-primary rounded-full px-4 py-1.5 text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              onClick={() => { setShowForm(false); setSelectedType(null); setNote(""); setPhotoUrl(null); setPhotoStoragePath(null); setError(null); }}
              className="text-xs text-secondary font-medium px-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Full-size photo viewer */}
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
          <img src={viewingPhoto} alt="Condition photo" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
