"use client";

import { useState, useEffect } from "react";

interface MarkerHint {
  id: string;
  markerId: string;
  userId: string;
  userName: string;
  hint: string;
  timestamp: string;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "---";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function HintModeration() {
  const [hints, setHints] = useState<MarkerHint[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    loadHints();
  }, []);

  async function loadHints() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hints");
      if (res.ok) {
        const data = await res.json();
        setHints(data.hints || []);
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }

  async function remove(hintId: string) {
    if (!confirm("Delete this hint? This can't be undone.")) return;
    setActing(hintId);
    try {
      const res = await fetch(`/api/admin/hints?id=${hintId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHints((prev) => prev.filter((h) => h.id !== hintId));
      }
    } catch {
      // Fail silently
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-variant rounded-lg animate-pulse" />
          ))}
        </div>
      ) : hints.length === 0 ? (
        <div className="text-center py-12 text-secondary">
          <span className="material-symbols-outlined text-4xl mb-2 block">tips_and_updates</span>
          <p className="text-sm">No marker hints</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hints.map((hint) => (
            <div key={hint.id} className="bg-surface-container rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-secondary">
                    tips_and_updates
                  </span>
                  <span className="text-xs text-secondary">{hint.markerId}</span>
                </div>
                <span className="text-[10px] text-secondary">
                  {formatDate(hint.timestamp)}
                </span>
              </div>

              <p className="text-xs">
                {hint.userName}: {hint.hint || "No hint text"}
              </p>

              <div className="flex gap-1.5">
                <button
                  onClick={() => remove(hint.id)}
                  disabled={acting === hint.id}
                  className="bg-error-container text-error rounded-full px-4 py-1.5 text-[11px] font-bold disabled:opacity-50"
                >
                  {acting === hint.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
