"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Story, StoryCategory } from "@/data/types";
import { STORY_CATEGORIES } from "@/lib/validation/schemas";
import StoryForm, {
  narrationCharacters,
  narrationCost,
} from "@/components/admin/StoryForm";

const CATEGORY_COLORS: Record<StoryCategory, string> = {
  history: "bg-amber-100 text-amber-800",
  nature: "bg-green-100 text-green-800",
  legend: "bg-purple-100 text-purple-800",
  local: "bg-blue-100 text-blue-800",
  geology: "bg-stone-200 text-stone-800",
  culture: "bg-rose-100 text-rose-800",
  heritage: "bg-orange-100 text-orange-800",
  folklore: "bg-indigo-100 text-indigo-800",
};

function emptyStory(): Story {
  return {
    id: "",
    title: "",
    summary: "",
    body: "",
    category: "history",
    imageUrl: null,
    attribution: null,
    markerIds: [],
    isHidden: false,
    trailSecret: "",
  };
}

interface BatchState {
  running: boolean;
  done: number;
  total: number;
  current: string;
  generated: number;
  failures: string[];
  stopped: boolean;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorStory, setEditorStory] = useState<Story>(emptyStory());

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Batch audio generation state
  const [batch, setBatch] = useState<BatchState | null>(null);
  const batchStopRef = useRef(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const showMessage = useCallback((text: string, type: "success" | "error" = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  }, []);

  async function fetchStories() {
    try {
      const res = await fetch("/api/stories");
      const data = await res.json();
      setStories(data);
    } catch {
      showMessage("Failed to load stories", "error");
    }
    setLoading(false);
  }

  async function toggleHidden(story: Story) {
    const updated = { ...story, isHidden: !story.isHidden };
    const res = await fetch("/api/stories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story: updated }),
    });
    if (res.ok) {
      setStories(stories.map((s) => (s.id === story.id ? updated : s)));
      showMessage(`${story.title} ${updated.isHidden ? "hidden" : "shown"}`);
    } else {
      const err = await res.json().catch(() => null);
      showMessage(
        err?.issues?.join("; ") || err?.error || "Failed to update visibility",
        "error"
      );
    }
  }

  function openCreate() {
    setEditorStory(emptyStory());
    setEditorMode("create");
    setEditorOpen(true);
  }

  function openEdit(story: Story) {
    setEditorStory({ ...story });
    setEditorMode("edit");
    setEditorOpen(true);
  }

  function handleSaved(story: Story, mode: "create" | "edit") {
    if (mode === "create") {
      setStories((prev) => [...prev, story]);
      showMessage(`"${story.title}" created`);
    } else {
      setStories((prev) => prev.map((s) => (s.id === story.id ? story : s)));
      showMessage(`"${story.title}" updated`);
    }
    setEditorOpen(false);
  }

  function handleAudioGenerated(storyId: string, audioUrl: string) {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, audioUrl } : s))
    );
  }

  async function deleteStory() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/stories?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        showMessage(`"${deleteTarget.title}" deleted`);
        setDeleteTarget(null);
      } else {
        showMessage("Failed to delete story", "error");
      }
    } catch {
      showMessage("Network error", "error");
    }
    setDeleting(false);
  }

  // ─── Batch audio generation ─────────────────────────────────
  const missingAudio = stories.filter((s) => !s.audioUrl);
  const missingChars = missingAudio.reduce((sum, s) => sum + narrationCharacters(s), 0);
  const missingCost = narrationCost(missingChars);

  async function runBatch() {
    // Snapshot now — re-running later skips stories generated in the meantime
    const queue = stories.filter((s) => !s.audioUrl);
    if (queue.length === 0) return;

    const totalChars = queue.reduce((sum, s) => sum + narrationCharacters(s), 0);
    const cost = narrationCost(totalChars);
    if (
      !window.confirm(
        `This will generate ~${totalChars} characters of narration across ${queue.length} stories (≈ $${cost.toFixed(2)}). Continue?`
      )
    ) {
      return;
    }

    batchStopRef.current = false;
    let generated = 0;
    const failures: string[] = [];
    setBatch({
      running: true,
      done: 0,
      total: queue.length,
      current: queue[0].title,
      generated: 0,
      failures: [],
      stopped: false,
    });

    for (let i = 0; i < queue.length; i++) {
      if (batchStopRef.current) break;
      const story = queue[i];
      setBatch((prev) => prev && { ...prev, done: i, current: story.title });

      try {
        const res = await fetch("/api/admin/audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId: story.id }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.audioUrl) {
          generated++;
          setStories((prev) =>
            prev.map((s) => (s.id === story.id ? { ...s, audioUrl: data.audioUrl } : s))
          );
        } else {
          failures.push(`${story.title}: ${data?.error || `failed (status ${res.status})`}`);
        }
      } catch {
        failures.push(`${story.title}: network error`);
      }

      setBatch(
        (prev) =>
          prev && {
            ...prev,
            done: i + 1,
            generated,
            failures: [...failures],
          }
      );
    }

    setBatch(
      (prev) =>
        prev && {
          ...prev,
          running: false,
          generated,
          failures: [...failures],
          stopped: batchStopRef.current,
        }
    );
    showMessage(
      `Audio batch finished — ${generated} generated, ${failures.length} failed${
        batchStopRef.current ? " (stopped early)" : ""
      }`,
      failures.length > 0 ? "error" : "success"
    );
  }

  const filtered = stories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.markerIds.some((m) => m.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading stories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Story Manager</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-on-primary text-primary px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Story
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Toast message */}
        {message && (
          <div
            className={`rounded-2xl p-4 text-sm font-bold ${
              messageType === "error"
                ? "bg-error-container text-on-error-container"
                : "bg-tertiary-container text-on-tertiary-container"
            }`}
          >
            {message}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stories.length}</p>
            <p className="text-xs text-on-surface-variant mt-1">Total</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {stories.filter((s) => !s.isHidden).length}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">Visible</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {stories.filter((s) => s.isHidden).length}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">Hidden</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, ID, or marker..."
              className="w-full pl-10 pr-4 py-3 rounded-full bg-surface border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 rounded-full bg-surface border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
          >
            <option value="all">All categories</option>
            {STORY_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Batch audio generation */}
        {missingAudio.length > 0 && !batch?.running && (
          <button
            onClick={runBatch}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-surface text-sm font-bold text-primary hover:bg-surface-container transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-lg">text_to_speech</span>
            Generate all missing audio ({missingAudio.length}{" "}
            {missingAudio.length === 1 ? "story" : "stories"}, ≈ $
            {missingCost.toFixed(2)} total)
          </button>
        )}

        {/* Batch progress */}
        {batch && (
          <div className="bg-surface rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold flex items-center gap-2 min-w-0">
                {batch.running ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin text-primary flex-shrink-0">
                      progress_activity
                    </span>
                    <span className="truncate">
                      {Math.min(batch.done + 1, batch.total)}/{batch.total} —{" "}
                      {batch.current}...
                    </span>
                    {batch.done > 0 && (
                      <span className="text-tertiary flex-shrink-0">✓ {batch.generated}</span>
                    )}
                  </>
                ) : (
                  <span>
                    Batch {batch.stopped ? "stopped" : "complete"} —{" "}
                    {batch.generated} generated, {batch.failures.length} failed
                  </span>
                )}
              </p>
              {batch.running ? (
                <button
                  onClick={() => {
                    batchStopRef.current = true;
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-error hover:bg-error-container transition-all flex-shrink-0"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => setBatch(null)}
                  className="p-1 hover:bg-surface-container rounded-full flex-shrink-0"
                  title="Dismiss"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(batch.done / batch.total) * 100}%` }}
              />
            </div>
            {batch.failures.length > 0 && (
              <ul className="text-xs text-error space-y-0.5">
                {batch.failures.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Stories list */}
        <div className="space-y-3">
          {filtered.map((story) => (
            <div key={story.id} className="bg-surface rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{story.title}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        CATEGORY_COLORS[story.category]
                      }`}
                    >
                      {story.category}
                    </span>
                    {story.isHidden && (
                      <span className="text-[10px] font-bold text-on-error-container bg-error-container px-2 py-0.5 rounded-full">
                        Hidden
                      </span>
                    )}
                    {!story.summary?.trim() && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        No summary
                      </span>
                    )}
                    {story.audioUrl && (
                      <span
                        className="material-symbols-outlined text-sm text-on-surface-variant"
                        title="Has audio narration"
                      >
                        volume_up
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                    {story.summary || "No summary"}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-secondary flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">
                        location_on
                      </span>
                      {story.markerIds.length} marker{story.markerIds.length !== 1 ? "s" : ""}
                      {story.markerIds.length > 0 && (
                        <span className="ml-0.5 font-mono">
                          ({story.markerIds.slice(0, 3).join(", ")}
                          {story.markerIds.length > 3 ? "..." : ""})
                        </span>
                      )}
                    </span>
                    {story.trailSecret && (
                      <span className="text-[10px] text-tertiary flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">
                          lock
                        </span>
                        {story.trailSecret}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleHidden(story)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      story.isHidden
                        ? "bg-primary"
                        : "bg-surface-container-high"
                    }`}
                    title={story.isHidden ? "Show story" : "Hide story"}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        story.isHidden ? "left-5" : "left-1"
                      }`}
                    />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(story)}
                    className="p-1.5 hover:bg-surface-container rounded-full text-primary"
                    title="Edit story"
                  >
                    <span className="material-symbols-outlined text-sm">
                      edit
                    </span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteTarget(story)}
                    className="p-1.5 hover:bg-error-container rounded-full text-error"
                    title="Delete story"
                  >
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-surface rounded-2xl p-8 text-center">
              <p className="text-on-surface-variant italic">
                {stories.length === 0
                  ? "No stories yet. Add one to get started."
                  : "No stories match your filters"}
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-on-surface-variant text-center">
          {filtered.length} of {stories.length} stories shown
        </p>
      </main>

      {/* ─── Story Editor Modal ──────────────────────────────────── */}
      {editorOpen && (
        <StoryForm
          mode={editorMode}
          initial={editorStory}
          onClose={() => setEditorOpen(false)}
          onSaved={handleSaved}
          onAudioGenerated={handleAudioGenerated}
        />
      )}

      {/* ─── Delete Confirmation Dialog ──────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-xl">
                  delete
                </span>
              </div>
              <h3 className="font-headline font-bold text-lg">Delete Story</h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-on-surface">
                &ldquo;{deleteTarget.title}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-secondary hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteStory}
                disabled={deleting}
                className="flex items-center gap-1.5 bg-error text-on-error px-5 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">
                      progress_activity
                    </span>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
