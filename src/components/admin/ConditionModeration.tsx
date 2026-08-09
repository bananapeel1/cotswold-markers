"use client";

import { useState, useEffect } from "react";
import type { TrailConditionReport } from "@/data/types";
import { getConditionIcon, getConditionLabel } from "@/data/types";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "---";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ConditionModeration() {
  const [conditions, setConditions] = useState<TrailConditionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadConditions();
  }, []);

  async function loadConditions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/conditions");
      if (res.ok) {
        const data = await res.json();
        setConditions(data.conditions || []);
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }

  async function remove(conditionId: string) {
    if (!confirm("Delete this trail condition report? This can't be undone.")) return;
    setActing(conditionId);
    try {
      const res = await fetch(`/api/admin/conditions?id=${conditionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConditions((prev) => prev.filter((c) => c.id !== conditionId));
      }
    } catch {
      // Fail silently
    } finally {
      setActing(null);
    }
  }

  const now = new Date().toISOString();

  return (
    <div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-variant rounded-lg animate-pulse" />
          ))}
        </div>
      ) : conditions.length === 0 ? (
        <div className="text-center py-12 text-secondary">
          <span className="material-symbols-outlined text-4xl mb-2 block">landscape</span>
          <p className="text-sm">No trail condition reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition) => {
            const expired = condition.expiresAt ? condition.expiresAt <= now : false;
            return (
              <div
                key={condition.id}
                className="bg-surface-container rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary">
                      {getConditionIcon(condition.conditionType)}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-variant text-secondary">
                      {getConditionLabel(condition.conditionType)}
                    </span>
                    <span className="text-xs text-secondary">{condition.markerId}</span>
                  </div>
                  <span className="text-[10px] text-secondary">
                    {formatDate(condition.timestamp)}
                  </span>
                </div>

                <p className="text-xs">
                  {condition.userName}: {condition.note || "No details provided"}
                </p>

                {condition.photoUrl && (
                  <button onClick={() => setViewingPhoto(condition.photoUrl!)} className="block">
                    <img
                      src={condition.photoUrl}
                      alt="Condition photo"
                      className="h-20 rounded-md object-cover"
                    />
                  </button>
                )}

                <p className={`text-[10px] ${expired ? "text-error" : "text-secondary"}`}>
                  {expired ? "Expired" : "Expires"}{" "}
                  {condition.expiresAt ? formatDate(condition.expiresAt) : "---"}
                </p>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => remove(condition.id)}
                    disabled={acting === condition.id}
                    className="bg-error-container text-error rounded-full px-4 py-1.5 text-[11px] font-bold disabled:opacity-50"
                  >
                    {acting === condition.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo viewer */}
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
          <img
            src={viewingPhoto}
            alt="Condition photo"
            className="max-w-full max-h-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
