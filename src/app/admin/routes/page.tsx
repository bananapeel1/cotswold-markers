"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AccessibleSection, CircularRoute, TrailSection } from "@/data/types";
import {
  getAccessibilityGradeLabel,
  getDifficultyLabel,
  getSectionLabel,
} from "@/data/types";

const SECTION_ORDER: TrailSection[] = ["north", "middle", "south"];

const emptySection = (): AccessibleSection => ({
  id: "",
  name: "",
  description: "",
  startLocation: "",
  latitude: 0,
  longitude: 0,
  distanceMiles: null,
  nearestMarkerIds: [],
  source: "",
  sourceUrl: "",
  lastVerified: "",
});

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<CircularRoute[]>([]);
  const [sections, setSections] = useState<AccessibleSection[]>([]);
  const [tab, setTab] = useState<"walks" | "sections">("walks");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingSection, setEditingSection] = useState<AccessibleSection | null>(null);
  const [isNewSection, setIsNewSection] = useState(false);
  const [savingSection, setSavingSection] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/routes");
      const data = await res.json();
      setRoutes(data.routes ?? []);
      setSections(data.accessibleSections ?? []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  }

  async function removeRoute(route: CircularRoute) {
    if (!confirm(`Delete "${route.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/routes?id=${encodeURIComponent(route.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRoutes(routes.filter((r) => r.id !== route.id));
      flash("Walk deleted");
    } else {
      const err = await res.json().catch(() => ({}));
      flash(`Error: ${err.error || "Delete failed"}`);
    }
  }

  async function saveSection() {
    if (!editingSection) return;
    setSavingSection(true);

    const method = isNewSection ? "POST" : "PUT";
    const res = await fetch("/api/routes?kind=section", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: editingSection }),
    });

    if (res.ok) {
      flash(isNewSection ? "Section created" : "Section updated");
      setEditingSection(null);
      await fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      flash(
        `Error: ${
          Array.isArray(err.issues) ? err.issues.join(" · ") : err.error || "Save failed"
        }`
      );
    }
    setSavingSection(false);
  }

  async function removeSection(section: AccessibleSection) {
    if (!confirm(`Delete "${section.name}"?`)) return;
    const res = await fetch(
      `/api/routes?kind=section&id=${encodeURIComponent(section.id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setSections(sections.filter((s) => s.id !== section.id));
      flash("Section deleted");
    } else {
      const err = await res.json().catch(() => ({}));
      flash(`Error: ${err.error || "Delete failed"}`);
    }
  }

  function updateSection(patch: Partial<AccessibleSection>) {
    if (!editingSection) return;
    setEditingSection({ ...editingSection, ...patch });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading circular routes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="bg-primary text-on-primary px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Circular Routes</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div
            className={`rounded-2xl p-4 text-sm font-bold ${
              message.startsWith("Error")
                ? "bg-error-container text-on-error-container"
                : "bg-tertiary-container text-on-tertiary-container"
            }`}
          >
            {message}
          </div>
        )}

        {/* Tabs & Add */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => setTab("walks")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                tab === "walks"
                  ? "bg-primary text-on-primary"
                  : "bg-surface text-secondary"
              }`}
            >
              Circular walks ({routes.length})
            </button>
            <button
              onClick={() => setTab("sections")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                tab === "sections"
                  ? "bg-primary text-on-primary"
                  : "bg-surface text-secondary"
              }`}
            >
              Accessible sections ({sections.length})
            </button>
          </div>
          {tab === "walks" ? (
            <Link
              href="/admin/routes/new"
              className="bg-primary text-on-primary px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 active:scale-95 transition-all self-start"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add walk
            </Link>
          ) : (
            <button
              onClick={() => {
                setEditingSection(emptySection());
                setIsNewSection(true);
              }}
              className="bg-primary text-on-primary px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 active:scale-95 transition-all self-start"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add section
            </button>
          )}
        </div>

        {/* ── Circular walks ── */}
        {tab === "walks" &&
          SECTION_ORDER.map((section) => {
            const group = routes.filter((r) => r.section === section);
            if (group.length === 0) return null;
            return (
              <section key={section} className="bg-surface rounded-2xl overflow-hidden">
                <h2 className="bg-surface-container px-4 py-3 font-bold text-on-surface-variant text-xs">
                  {getSectionLabel(section)}
                </h2>
                <ul>
                  {group.map((route) => (
                    <li
                      key={route.id}
                      className="border-t border-outline-variant/10 px-4 py-3 flex items-center gap-3 hover:bg-surface-container-low/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{route.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {route.area} · {route.distanceMiles} mi
                        </p>
                      </div>
                      <span className="bg-surface-container px-2.5 py-1 rounded-full text-[10px] font-bold text-on-surface-variant whitespace-nowrap">
                        {getDifficultyLabel(route.difficulty)}
                      </span>
                      {route.accessibility && (
                        <span className="bg-tertiary-container text-on-tertiary-container px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap hidden sm:inline">
                          {getAccessibilityGradeLabel(route.accessibility.grade)}
                        </span>
                      )}
                      {(route.geometryFile || route.geometryUrl) && (
                        <span
                          className="material-symbols-outlined text-primary text-lg"
                          title="Has route geometry"
                        >
                          map
                        </span>
                      )}
                      <Link
                        href={`/admin/routes/${route.id}`}
                        className="p-1.5 hover:bg-surface-container rounded-full text-primary"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </Link>
                      <button
                        onClick={() => removeRoute(route)}
                        className="p-1.5 hover:bg-error-container rounded-full text-error"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

        {tab === "walks" && routes.length === 0 && (
          <p className="text-center text-on-surface-variant italic py-8">
            No circular walks yet — add the first one.
          </p>
        )}

        {/* ── Accessible sections ── */}
        {tab === "sections" && (
          <>
            {editingSection && (
              <section className="bg-surface rounded-2xl p-6">
                <h2 className="font-headline font-bold text-primary text-lg mb-4">
                  {isNewSection ? "New section" : `Edit: ${editingSection.name}`}
                </h2>
                <div className="space-y-3">
                  <input
                    value={editingSection.name}
                    onChange={(e) => updateSection({ name: e.target.value })}
                    placeholder="Name"
                    className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <textarea
                    value={editingSection.description}
                    onChange={(e) => updateSection({ description: e.target.value })}
                    placeholder="Description (the publisher's claim about this stretch)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <input
                    value={editingSection.startLocation}
                    onChange={(e) => updateSection({ startLocation: e.target.value })}
                    placeholder="Start location"
                    className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="number"
                      step="0.000001"
                      value={editingSection.latitude}
                      onChange={(e) =>
                        updateSection({ latitude: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Latitude"
                      className="px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      value={editingSection.longitude}
                      onChange={(e) =>
                        updateSection({ longitude: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Longitude"
                      className="px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editingSection.distanceMiles ?? ""}
                      onChange={(e) =>
                        updateSection({
                          distanceMiles:
                            e.target.value === "" ? null : parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Distance (miles)"
                      className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      value={editingSection.source}
                      onChange={(e) => updateSection({ source: e.target.value })}
                      placeholder="Source (publishing body)"
                      className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      value={editingSection.sourceUrl}
                      onChange={(e) => updateSection({ sourceUrl: e.target.value })}
                      placeholder="Source URL"
                      className="px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="date"
                      value={editingSection.lastVerified}
                      onChange={(e) => updateSection({ lastVerified: e.target.value })}
                      className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveSection}
                      disabled={savingSection || !editingSection.name}
                      className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
                    >
                      {savingSection ? "Saving..." : isNewSection ? "Create" : "Update"}
                    </button>
                    <button
                      onClick={() => setEditingSection(null)}
                      className="px-5 py-2 rounded-full text-xs font-bold text-secondary hover:bg-surface-container transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section className="bg-surface rounded-2xl overflow-hidden">
              <ul>
                {sections.map((section, i) => (
                  <li
                    key={section.id}
                    className={`px-4 py-3 flex items-start gap-3 hover:bg-surface-container-low/50 ${
                      i > 0 ? "border-t border-outline-variant/10" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{section.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {section.startLocation}
                        {section.distanceMiles != null &&
                          ` · ${section.distanceMiles} mi`}{" "}
                        · {section.source} · checked {section.lastVerified || "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingSection({ ...section });
                        setIsNewSection(false);
                      }}
                      className="p-1.5 hover:bg-surface-container rounded-full text-primary"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => removeSection(section)}
                      className="p-1.5 hover:bg-error-container rounded-full text-error"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </li>
                ))}
                {sections.length === 0 && (
                  <li className="px-4 py-8 text-center text-on-surface-variant italic">
                    No accessible sections recorded
                  </li>
                )}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
