"use client";

import { useState, useEffect } from "react";
import type { MarkerReport } from "@/data/types";
import { getIssueIcon, getIssueLabel } from "@/data/types";

type FilterTab = "open" | "acknowledged" | "resolved";

const SEVERITY_ORDER: Record<string, number> = {
  missing: 0,
  damaged: 1,
  obscured: 2,
  "wrong-location": 3,
  other: 4,
};

export default function ReportModeration() {
  const [reports, setReports] = useState<MarkerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("open");
  const [acting, setActing] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [noteForId, setNoteForId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }

  async function moderate(reportId: string, action: "acknowledge" | "resolve") {
    setActing(reportId);
    try {
      const res = await fetch("/api/admin/reports/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action, adminNote: noteForId === reportId ? adminNote : undefined }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, status: action === "acknowledge" ? "acknowledged" : "resolved" }
              : r
          )
        );
        setNoteForId(null);
        setAdminNote("");
      }
    } catch {
      // Fail silently
    } finally {
      setActing(null);
    }
  }

  const filtered = reports
    .filter((r) => r.status === tab)
    .sort((a, b) => (SEVERITY_ORDER[a.issueType] || 9) - (SEVERITY_ORDER[b.issueType] || 9));

  const openCount = reports.filter((r) => r.status === "open").length;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6">
        {([
          { key: "open" as FilterTab, label: `Open (${openCount})` },
          { key: "acknowledged" as FilterTab, label: "Acknowledged" },
          { key: "resolved" as FilterTab, label: "Resolved" },
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
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-variant rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-secondary">
          <span className="material-symbols-outlined text-4xl mb-2 block">check_circle</span>
          <p className="text-sm">No {tab} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="bg-surface-container rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${
                    report.issueType === "missing" ? "text-error" : "text-secondary"
                  }`}>
                    {getIssueIcon(report.issueType)}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    report.issueType === "missing"
                      ? "bg-error-container text-error"
                      : "bg-surface-variant text-secondary"
                  }`}>
                    {getIssueLabel(report.issueType)}
                  </span>
                  <span className="text-xs text-secondary">{report.markerId}</span>
                </div>
                <span className="text-[10px] text-secondary">
                  {new Date(report.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>

              <p className="text-xs">{report.userName}: {report.note || "No details provided"}</p>

              {report.photoUrl && (
                <button onClick={() => setViewingPhoto(report.photoUrl!)} className="block">
                  <img src={report.photoUrl} alt="Report photo" className="h-20 rounded-md object-cover" />
                </button>
              )}

              {report.adminNote && (
                <p className="text-[10px] text-primary bg-primary-fixed/20 rounded-md p-2">
                  Admin: {report.adminNote}
                </p>
              )}

              {/* Admin note input */}
              {noteForId === report.id && (
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Admin note (optional)..."
                  className="w-full bg-surface-container-lowest rounded-md p-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}

              <div className="flex gap-1.5">
                {report.status === "open" && (
                  <>
                    <button
                      onClick={() => {
                        if (noteForId !== report.id) { setNoteForId(report.id); setAdminNote(""); }
                        else moderate(report.id, "acknowledge");
                      }}
                      disabled={acting === report.id}
                      className="flex-1 bg-primary text-on-primary rounded-full py-1.5 text-[11px] font-bold disabled:opacity-50"
                    >
                      {noteForId === report.id ? "Confirm Acknowledge" : "Acknowledge"}
                    </button>
                    <button
                      onClick={() => moderate(report.id, "resolve")}
                      disabled={acting === report.id}
                      className="bg-surface-variant text-secondary rounded-full px-3 py-1.5 text-[11px] font-bold disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  </>
                )}
                {report.status === "acknowledged" && (
                  <button
                    onClick={() => moderate(report.id, "resolve")}
                    disabled={acting === report.id}
                    className="flex-1 bg-primary text-on-primary rounded-full py-1.5 text-[11px] font-bold disabled:opacity-50"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
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
          <img src={viewingPhoto} alt="Report photo" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
