"use client";

import { useState } from "react";
import type { Story } from "@/data/types";
import { STORY_CATEGORIES } from "@/lib/validation/schemas";
import ImageUpload from "@/components/ImageUpload";

const COST_PER_1K_CHARS = 0.03; // dollars — ElevenLabs, matches /api/admin/audio

/** Characters sent to the TTS API — the narration is "{title}.\n\n{body}". */
export function narrationCharacters(story: Pick<Story, "title" | "body">): number {
  return story.title.length + story.body.length + 3;
}

export function narrationCost(characters: number): number {
  return (characters / 1000) * COST_PER_1K_CHARS;
}

interface StoryFormProps {
  mode: "create" | "edit";
  /** Initial values — an empty story for create, a copy of the story for edit. */
  initial: Story;
  onClose: () => void;
  /** Called with the story the API returned after a successful save. */
  onSaved: (story: Story, mode: "create" | "edit") => void;
  /** Called after audio generation succeeds so the list can pick up the new URL. */
  onAudioGenerated: (storyId: string, audioUrl: string) => void;
}

export default function StoryForm({
  mode,
  initial,
  onClose,
  onSaved,
  onAudioGenerated,
}: StoryFormProps) {
  const [draft, setDraft] = useState<Story>({ ...initial });
  const [markerIdsText, setMarkerIdsText] = useState(initial.markerIds.join(", "));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveIssues, setSaveIssues] = useState<string[]>([]);

  // Audio generation state (edit mode only)
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [audioVersion, setAudioVersion] = useState(0); // cache-buster for the preview player

  function updateDraft(field: keyof Story, value: unknown) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function saveStory() {
    if (!draft.title.trim()) {
      setSaveError("Title is required");
      setSaveIssues([]);
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveIssues([]);

    const parsedMarkerIds = markerIdsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const storyPayload: Story = {
      ...draft,
      markerIds: parsedMarkerIds,
      imageUrl: draft.imageUrl?.trim() || null,
      attribution: draft.attribution?.trim() || null,
    };

    try {
      const res = await fetch("/api/stories", {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: storyPayload }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        // Prefer the API's copy — on create the server generates the ID
        onSaved((data?.story as Story) || storyPayload, mode);
      } else {
        setSaveError(
          data?.error ||
            (mode === "create" ? "Failed to create story" : "Failed to update story")
        );
        setSaveIssues(Array.isArray(data?.issues) ? data.issues : []);
      }
    } catch {
      setSaveError("Network error");
    }

    setSaving(false);
  }

  async function generateAudio() {
    const characters = narrationCharacters(draft);
    const cost = narrationCost(characters);
    if (
      !window.confirm(
        `This will generate ~${characters} characters of narration (≈ $${cost.toFixed(2)}). Continue?`
      )
    ) {
      return;
    }

    setAudioBusy(true);
    setAudioError("");

    try {
      const res = await fetch("/api/admin/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: draft.id }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.audioUrl) {
        setDraft((prev) => ({ ...prev, audioUrl: data.audioUrl }));
        setAudioVersion((v) => v + 1);
        onAudioGenerated(draft.id, data.audioUrl);
      } else {
        setAudioError(data?.error || `Audio generation failed (status ${res.status})`);
      }
    } catch {
      setAudioError("Network error — audio generation failed");
    }

    setAudioBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 pb-12">
      <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h2 className="font-headline font-bold text-lg text-primary">
            {mode === "create" ? "New Story" : "Edit Story"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-container rounded-full"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Save errors — includes the API's validation issues */}
          {saveError && (
            <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm">
              <p className="font-bold">{saveError}</p>
              {saveIssues.length > 0 && (
                <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-xs">
                  {saveIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

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
              {STORY_CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
              Summary *
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

          {/* Image */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
              Image
            </label>
            {mode === "edit" ? (
              <ImageUpload
                currentUrl={draft.imageUrl || ""}
                storagePath={`stories/${draft.id}`}
                onUpload={(url) => updateDraft("imageUrl", url)}
              />
            ) : (
              <p className="text-[10px] text-on-surface-variant mb-1.5">
                Save the story first to upload an image, or paste a URL below.
              </p>
            )}
            <input
              value={draft.imageUrl || ""}
              onChange={(e) => updateDraft("imageUrl", e.target.value)}
              placeholder="Or paste an image URL (https://...)"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mt-2 font-mono text-xs"
            />
            {mode === "create" && draft.imageUrl && draft.imageUrl.trim() && (
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
              placeholder="Short bonus fact (optional)"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[10px] text-on-surface-variant mt-1">
              Trail secret — short bonus fact shown as a callout
            </p>
          </div>

          {/* Hidden toggle */}
          <div className="flex items-center justify-between bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
            <div>
              <p className="text-sm font-semibold">Hidden story</p>
              <p className="text-xs text-on-surface-variant">
                Only revealed after the walker scans a linked marker
              </p>
            </div>
            <button
              onClick={() => updateDraft("isHidden", !draft.isHidden)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                draft.isHidden ? "bg-primary" : "bg-surface-container-high"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  draft.isHidden ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Audio narration (saved stories only) */}
          {mode === "edit" && (
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20 space-y-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">
                    graphic_eq
                  </span>
                  Audio narration
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Narration is generated from the saved title and body — save
                  changes first.
                </p>
              </div>

              {draft.audioUrl && (
                <audio
                  controls
                  preload="none"
                  src={`${draft.audioUrl}${audioVersion ? `?v=${audioVersion}` : ""}`}
                  className="w-full h-10"
                />
              )}

              <button
                onClick={generateAudio}
                disabled={audioBusy}
                className="flex items-center gap-1.5 bg-surface-container text-primary px-4 py-2 rounded-full text-xs font-bold hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-50"
              >
                {audioBusy ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">
                      progress_activity
                    </span>
                    Generating — this can take a minute...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      {draft.audioUrl ? "autorenew" : "text_to_speech"}
                    </span>
                    {draft.audioUrl ? "Regenerate audio" : "Generate audio"}
                  </>
                )}
              </button>

              {audioError && (
                <p className="text-error text-xs font-bold">{audioError}</p>
              )}
            </div>
          )}

          {/* ID (read-only for edit) */}
          {mode === "edit" && (
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
            onClick={onClose}
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
                <span className="material-symbols-outlined text-base">save</span>
                {mode === "create" ? "Create Story" : "Save Changes"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
