"use client";

import { useState, useEffect } from "react";

interface StoryData {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  imageUrl: string | null;
  attribution: string | null;
  markerIds: string[];
}

const CATEGORIES = ["history", "nature", "legend", "local", "geology"];

const emptyStory = (markerId: string): StoryData => ({
  id: "",
  title: "",
  summary: "",
  body: "",
  category: "local",
  imageUrl: null,
  attribution: null,
  markerIds: [markerId],
});

export default function StoriesEditor({ markerId }: { markerId: string }) {
  const [stories, setStories] = useState<StoryData[]>([]);
  const [editing, setEditing] = useState<StoryData | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((all: StoryData[]) =>
        setStories(all.filter((s) => s.markerIds.includes(markerId)))
      );
  }, [markerId]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setMessage("");

    const method = isNew ? "POST" : "PUT";
    const res = await fetch("/api/stories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story: editing }),
    });

    if (res.ok) {
      setMessage(isNew ? "Story created" : "Story updated");
      setEditing(null);
      // Refresh
      const all = await fetch("/api/stories").then((r) => r.json());
      setStories(all.filter((s: StoryData) => s.markerIds.includes(markerId)));
    } else {
      const err = await res.json();
      setMessage(`Error: ${err.error}`);
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 2000);
  }

  async function remove(id: string) {
    if (!confirm("Delete this story?")) return;
    const res = await fetch(`/api/stories?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setStories(stories.filter((s) => s.id !== id));
      setMessage("Story deleted");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  return (
    <section className="bg-surface rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline font-bold text-primary text-lg">
          Stories ({stories.length})
        </h2>
        <button
          onClick={() => { setEditing(emptyStory(markerId)); setIsNew(true); }}
          className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-sm">add</span> Add Story
        </button>
      </div>

      {message && (
        <p className="text-xs font-bold text-primary mb-3">{message}</p>
      )}

      {/* List */}
      {!editing && stories.map((s) => (
        <div key={s.id} className="flex items-start justify-between p-3 bg-surface-container-low rounded-lg mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{s.title}</p>
            <p className="text-xs text-on-surface-variant capitalize">{s.category} · {s.summary.slice(0, 60)}...</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => { setEditing({ ...s }); setIsNew(false); }} className="p-1.5 hover:bg-surface-container rounded-full text-primary">
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button onClick={() => remove(s.id)} className="p-1.5 hover:bg-error-container rounded-full text-error">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      ))}

      {!editing && stories.length === 0 && (
        <p className="text-sm text-on-surface-variant italic">No stories linked to this marker</p>
      )}

      {/* Edit form */}
      {editing && (
        <div className="space-y-3 border-t border-outline-variant/10 pt-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} placeholder="Summary (short)" className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder="Full story body..." rows={5} className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={editing.imageUrl || ""} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value || null })} placeholder="Image URL (optional)" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={editing.attribution || ""} onChange={(e) => setEditing({ ...editing, attribution: e.target.value || null })} placeholder="Attribution (optional)" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving || !editing.title} className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold disabled:opacity-50 active:scale-95 transition-all">
              {saving ? "Saving..." : isNew ? "Create" : "Update"}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 py-2 rounded-full text-xs font-bold text-secondary hover:bg-surface-container transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
