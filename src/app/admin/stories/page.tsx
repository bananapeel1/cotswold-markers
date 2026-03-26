"use client";

import { useState, useEffect } from "react";
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

const CATEGORIES = ["history", "nature", "legend", "local", "geology"];

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingSecret, setEditingSecret] = useState<string | null>(null);
  const [secretDraft, setSecretDraft] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    try {
      const res = await fetch("/api/stories");
      const data = await res.json();
      setStories(data);
    } catch {
      // ignore
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
      setMessage(`${story.title} ${updated.isHidden ? "hidden" : "shown"}`);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function saveTrailSecret(story: StoryData) {
    const updated = { ...story, trailSecret: secretDraft };
    const res = await fetch("/api/stories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story: updated }),
    });
    if (res.ok) {
      setStories(stories.map((s) => (s.id === story.id ? updated : s)));
      setEditingSecret(null);
      setMessage("Trail secret updated");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  const filtered = stories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
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
      <header className="bg-primary text-on-primary px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Hidden Stories</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div className="bg-tertiary-container text-on-tertiary-container rounded-2xl p-4 text-sm font-bold">
            {message}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stories.length}</p>
            <p className="text-xs text-on-surface-variant mt-1">Total Stories</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {stories.filter((s) => s.isHidden).length}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">Hidden</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or marker..."
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
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Stories list */}
        <div className="space-y-3">
          {filtered.map((story) => (
            <div
              key={story.id}
              className="bg-surface rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{story.title}</p>
                    <span className="text-[10px] font-mono text-secondary bg-surface-container px-2 py-0.5 rounded-full capitalize">
                      {story.category}
                    </span>
                    {story.isHidden && (
                      <span className="text-[10px] font-bold text-on-error-container bg-error-container px-2 py-0.5 rounded-full">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {story.markerIds.join(", ") || "No markers"}
                  </p>
                  {story.trailSecret && editingSecret !== story.id && (
                    <p className="text-xs text-tertiary mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        lock
                      </span>
                      {story.trailSecret}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Hidden toggle */}
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

                  {/* Edit secret button */}
                  <button
                    onClick={() => {
                      if (editingSecret === story.id) {
                        setEditingSecret(null);
                      } else {
                        setEditingSecret(story.id);
                        setSecretDraft(story.trailSecret || "");
                      }
                    }}
                    className="p-1.5 hover:bg-surface-container rounded-full text-primary"
                    title="Edit trail secret"
                  >
                    <span className="material-symbols-outlined text-sm">
                      key
                    </span>
                  </button>
                </div>
              </div>

              {/* Inline trail secret edit */}
              {editingSecret === story.id && (
                <div className="mt-3 flex gap-2 border-t border-outline-variant/10 pt-3">
                  <input
                    value={secretDraft}
                    onChange={(e) => setSecretDraft(e.target.value)}
                    placeholder="Trail secret text..."
                    className="flex-1 px-4 py-2 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => saveTrailSecret(story)}
                    className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSecret(null)}
                    className="px-4 py-2 rounded-full text-xs font-bold text-secondary hover:bg-surface-container transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-surface rounded-2xl p-8 text-center">
              <p className="text-on-surface-variant italic">
                {stories.length === 0
                  ? "No stories found"
                  : "No stories match your filters"}
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-on-surface-variant text-center">
          {filtered.length} of {stories.length} stories shown
        </p>
      </main>
    </div>
  );
}
