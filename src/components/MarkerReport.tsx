"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useMarkerReports } from "@/hooks/useMarkerReports";
import type { MarkerIssueType } from "@/data/types";
import { getIssueIcon, getIssueLabel } from "@/data/types";
import CommunityPhotoUpload from "./CommunityPhotoUpload";

const ISSUE_TYPES: MarkerIssueType[] = [
  "missing",
  "damaged",
  "obscured",
  "wrong-location",
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

export default function MarkerReport({ markerId }: { markerId: string }) {
  const { reports, loading, submitReport, deleteReport } = useMarkerReports(markerId);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<MarkerIssueType | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoStoragePath, setPhotoStoragePath] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  async function handleSubmit() {
    if (!selectedType) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReport(selectedType, note || undefined, photoUrl || undefined, photoStoragePath || undefined);
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

  async function handleDelete(reportId: string) {
    try {
      await deleteReport(reportId);
    } catch {
      // Silently fail
    }
  }

  if (loading) return null;

  const openReports = reports.filter((r) => r.status !== "resolved");

  return (
    <div>
      {/* Minimal trigger — just a text link */}
      {!showForm && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => user ? setShowForm(true) : undefined}
            className="flex items-center gap-1.5 text-[11px] text-secondary hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xs">report</span>
            {openReports.length > 0
              ? <span>Report a problem <span className="text-error font-medium">· {openReports.length} open</span></span>
              : <span>Report a problem</span>
            }
          </button>
          {!user && (
            <Link href="/login" className="text-[10px] text-primary font-medium">
              Sign in
            </Link>
          )}
        </div>
      )}

      {/* Open reports (always visible if any) */}
      {openReports.length > 0 && !showForm && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {openReports.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-1 bg-error-container/20 rounded-full px-2 py-0.5 text-[10px]"
            >
              <span className="material-symbols-outlined text-[10px] text-error">
                {getIssueIcon(r.issueType)}
              </span>
              <span>{getIssueLabel(r.issueType)}</span>
              <span className="text-secondary">{timeAgo(r.timestamp)}</span>
              {user && r.userId === user.uid && (
                <button
                  onClick={() => handleDelete(r.id)}
                  className="ml-0.5 text-secondary hover:text-error"
                >
                  <span className="material-symbols-outlined text-[10px]">close</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation */}
      {submitted && (
        <p className="text-[10px] text-primary font-medium mt-1">Report submitted. Thank you!</p>
      )}

      {/* Report form */}
      {showForm && (
        <div className="bg-surface-container rounded-md p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold">What&apos;s the issue?</p>
            <button
              onClick={() => { setShowForm(false); setSelectedType(null); setNote(""); setPhotoUrl(null); setPhotoStoragePath(null); setError(null); }}
              className="text-secondary"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ISSUE_TYPES.map((type) => (
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
                  {getIssueIcon(type)}
                </span>
                {getIssueLabel(type)}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Describe the issue (optional)"
            rows={2}
            className="w-full bg-surface-container-lowest rounded-md p-2.5 text-xs resize-none outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-secondary">{note.length}/200</span>
            <CommunityPhotoUpload
              storagePath={`reports/${markerId}/${user?.uid || "anon"}`}
              currentUrl={photoUrl}
              onUpload={(url, path) => { setPhotoUrl(url); setPhotoStoragePath(path); }}
              onRemove={() => { setPhotoUrl(null); setPhotoStoragePath(null); }}
            />
          </div>
          {error && <p className="text-[10px] text-error">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!selectedType || submitting}
            className="bg-primary text-on-primary rounded-full px-4 py-1.5 text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      )}
    </div>
  );
}
