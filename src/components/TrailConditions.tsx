"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useTrailConditions } from "@/hooks/useTrailConditions";
import type { TrailConditionType } from "@/data/types";
import { getConditionIcon, getConditionLabel } from "@/data/types";

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  async function handleSubmit() {
    if (!selectedType) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitCondition(selectedType, note || undefined);
      setSubmitted(true);
      setShowForm(false);
      setSelectedType(null);
      setNote("");
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="px-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-surface-container rounded-full animate-pulse" />
          <div className="w-36 h-5 bg-surface-container rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-24 h-8 bg-surface-container rounded-full animate-pulse" />
          <div className="w-28 h-8 bg-surface-container rounded-full animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">warning</span>
        <h3 className="font-headline font-bold text-lg">Trail Conditions</h3>
      </div>

      {/* Existing condition reports */}
      {conditions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1.5 bg-surface-container-low rounded-full px-3 py-1.5 text-xs"
            >
              <span className="material-symbols-outlined text-sm">
                {getConditionIcon(c.conditionType)}
              </span>
              <span className="font-medium">{getConditionLabel(c.conditionType)}</span>
              <span className="text-on-surface-variant">{timeAgo(c.timestamp)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">No recent reports</p>
      )}

      {/* Confirmation message */}
      {submitted && (
        <div className="flex items-center gap-2 bg-primary-fixed/30 rounded-md p-3 text-sm text-primary font-medium">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Report submitted. Thank you!
        </div>
      )}

      {/* Report button / form */}
      {!showForm ? (
        user ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm font-bold text-primary"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Report a condition
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm font-bold text-primary"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            Sign in to report
          </Link>
        )
      ) : (
        <div className="bg-surface-container-low rounded-md p-4 space-y-3">
          <p className="text-sm font-bold">What did you encounter?</p>

          {/* Condition type chips */}
          <div className="flex flex-wrap gap-2">
            {CONDITION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedType === type
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {getConditionIcon(type)}
                </span>
                {getConditionLabel(type)}
              </button>
            ))}
          </div>

          {/* Note textarea */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Add a note (optional)"
            rows={2}
            className="w-full bg-surface-container rounded-md p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="text-[10px] text-on-surface-variant text-right">
            {note.length}/200
          </div>

          {error && (
            <p className="text-xs text-error">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!selectedType || submitting}
              className="bg-primary text-on-primary rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 transition-opacity"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedType(null);
                setNote("");
                setError(null);
              }}
              className="text-sm text-on-surface-variant font-medium px-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
