"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface StoryData {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: "history" | "nature" | "legend" | "local" | "geology";
  imageUrl: string | null;
  attribution: string | null;
  markerIds: string[];
  isHidden?: boolean;
  trailSecret?: string;
}

type Category = StoryData["category"];

const CATEGORIES: Category[] = ["history", "nature", "legend", "local", "geology"];

const CATEGORY_COLORS: Record<Category, string> = {
  history: "bg-amber-100 text-amber-800",
  nature: "bg-green-100 text-green-800",
  legend: "bg-purple-100 text-purple-800",
  local: "bg-blue-100 text-blue-800",
  geology: "bg-stone-200 text-stone-800",
};

function emptyStory(): Omit<StoryData, "id"> & { id: string } {
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

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<StoryData>(emptyStory() as StoryData);
  const [markerIdsText, setMarkerIdsText] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<StoryData | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function toggleHidden(story: StoryData) {
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
      showMessage("Failed to update visibility", "error");
    }
  }

  function openCreate() {
    const blank = emptyStory() as StoryData;
    setDraft(blank);
    setMarkerIdsText("");
    setEditorMode("create");
    setEditorOpen(true);
  }

  function openEdit(story: StoryData) {
    setDraft({ ...story });
    setMarkerIdsText(story.markerIds.join(", "));
    setEditorMode("edit");
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
  }

  function updateDraft(field: keyof StoryData, value: unknown) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function saveStory() {
    if (!draft.title.trim()) {
      showMessage("Title is required", "error");
      return;
    }

    setSaving(true);

    const parsedMarkerIds = markerIdsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const storyPayload: StoryData = {
      ...draft,
      markerIds: parsedMarkerIds,
      imageUrl: draft.imageUrl?.trim() || null,
      attribution: draft.attribution?.trim() || null,
    };

    try {
      if (editorMode === "create") {
        // Generate an id from title if not provided
        if (!storyPayload.id) {
          storyPayload.id = draft.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        }
        const res = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ story: storyPayload }),
        });
        if (res.ok) {
          setStories((prev) => [...prev, storyPayload]);
          showMessage(`"${storyPayload.title}" created`);
          closeEditor();
        } else {
          const err = await res.json().catch(() => null);
          showMessage(err?.error || "Failed to create story", "error");
        }
      } else {
        const res = await fetch("/api/stories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ story: storyPayload }),
        });
        if (res.ok) {
          setStories((prev) =>
            prev.map((s) => (s.id === storyPayload.id ? storyPayload : s))
          );
          showMessage(`"${storyPayload.title}" updated`);
          closeEditor();
        } else {
          const err = await res.json().catch(() => null);
          showMessage(err?.error || "Failed to update story", "error");
        }
      }
    } catch {
      showMessage("Network error", "error");
    }

    setSaving(false);
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
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>

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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 pb-12">
          <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
              <h2 className="font-headline font-bold text-lg text-primary">
                {editorMode === "create" ? "New Story" : "Edit Story"}
              </h2>
              <button
                onClick={closeEditor}
                className="p-1 hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Title *
                </label>
                <input
                  value={draft.title}
                  onChange={(e) => updateDraft("title", e.target.value)}
                  placeholder="Story title"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Category
                </label>
                <select
                  value={draft.category}
                  onChange={(e) => updateDraft("category", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Summary
                </label>
                <textarea
                  value={draft.summary}
                  onChange={(e) => updateDraft("summary", e.target.value)}
                  placeholder="Short description shown on marker pages"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Body
                </label>
                <textarea
                  value={draft.body}
                  onChange={(e) => updateDraft("body", e.target.value)}
                  placeholder="Full story content (multi-paragraph)"
                  rows={8}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y leading-relaxed"
                />
              </div>

              {/* Image URL + preview */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Image URL
                </label>
                <input
                  value={draft.imageUrl || ""}
                  onChange={(e) => updateDraft("imageUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {draft.imageUrl && draft.imageUrl.trim() && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-outline-variant/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.imageUrl}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Attribution */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Attribution
                </label>
                <input
                  value={draft.attribution || ""}
                  onChange={(e) => updateDraft("attribution", e.target.value)}
                  placeholder="Source credit (optional)"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Marker IDs */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Marker IDs
                </label>
                <input
                  value={markerIdsText}
                  onChange={(e) => setMarkerIdsText(e.target.value)}
                  placeholder="Comma-separated, e.g. CW01, CW02, CW03"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  {markerIdsText
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean).length}{" "}
                  marker(s) linked
                </p>
              </div>

              {/* Trail Secret */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Trail Secret
                </label>
                <input
                  value={draft.trailSecret || ""}
                  onChange={(e) => updateDraft("trailSecret", e.target.value)}
                  placeholder="Secret text for trail discovery (optional)"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Hidden toggle */}
              <div className="flex items-center justify-between bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
                <div>
                  <p className="text-sm font-semibold">Hidden</p>
                  <p className="text-xs text-on-surface-variant">
                    Hidden stories are not shown to regular users
                  </p>
                </div>
                <button
                  onClick={() => updateDraft("isHidden", !draft.isHidden)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    draft.isHidden
                      ? "bg-primary"
                      : "bg-surface-container-high"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      draft.isHidden ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* ID (read-only for edit) */}
              {editorMode === "edit" && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                    Story ID
                  </label>
                  <input
                    value={draft.id}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border-none text-sm text-on-surface-variant font-mono cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/20">
              <button
                onClick={closeEditor}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-secondary hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveStory}
                disabled={saving}
                className="flex items-center gap-1.5 bg-primary text-on-primary px-6 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">
                      progress_activity
                    </span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      save
                    </span>
                    {editorMode === "create" ? "Create Story" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
