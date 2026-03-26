"use client";

import { useState, useEffect, useRef } from "react";
import { useJournal, type JournalEntryData } from "@/hooks/useJournal";
import { useUserScans } from "@/hooks/useUserScans";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Link from "next/link";

export default function JournalEntry({ markerId }: { markerId: string }) {
  const { scannedMarkerIds, loading: scansLoading } = useUserScans();
  const { entries, loading: journalLoading, addEntry, updateEntry, deleteEntry } = useJournal(markerId);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [error, setError] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Don't render if not authenticated or marker not scanned
  if (authLoading || scansLoading) return null;
  if (!user) return null;
  if (!scannedMarkerIds.includes(markerId)) return null;

  const loading = journalLoading;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setUploading(true);
    setError("");

    const storageRef = ref(storage, `journal/${user!.uid}/${markerId}/${Date.now()}-${file.name}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot) => {
        setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      () => {
        setError("Upload failed");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setPhotoUrl(url);
        setUploading(false);
        setUploadProgress(0);
      }
    );
  }

  async function handleSave() {
    if (!note.trim() && !photoUrl) return;
    setSaving(true);
    setError("");
    try {
      await addEntry(note.trim(), photoUrl || undefined);
      setNote("");
      setPhotoUrl(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    try {
      await updateEntry(id, editNote.trim());
      setEditingId(null);
      setEditNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEntry(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  function formatDate(ts: string) {
    const d = new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
      " at " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <section className="mx-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">edit_note</span>
          <h3 className="font-headline font-bold text-lg">My Journal</h3>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add entry
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs font-bold text-error">{error}</p>
      )}

      {/* New entry form */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-md p-4 shadow-ambient space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="Write about your experience at this marker..."
            rows={3}
            className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-secondary">{note.length}/500</span>
          </div>

          {/* Photo upload */}
          {photoUrl ? (
            <div className="relative inline-block">
              <img src={photoUrl} alt="Upload" className="h-20 w-20 rounded-lg object-cover" />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ) : uploading ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="text-[10px] text-secondary">{uploadProgress}%</span>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-xs text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add_a_photo</span>
              Add photo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || (!note.trim() && !photoUrl)}
              className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => { setShowForm(false); setNote(""); setPhotoUrl(null); }}
              className="px-5 py-2 rounded-full text-xs font-bold text-secondary hover:bg-surface-container transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing entries */}
      {loading ? (
        <div className="bg-surface-container-low rounded-md p-4 animate-pulse">
          <div className="h-3 bg-surface-variant rounded w-3/4 mb-2" />
          <div className="h-3 bg-surface-variant rounded w-1/2" />
        </div>
      ) : entries.length === 0 && !showForm ? (
        <p className="text-sm text-secondary italic">No journal entries yet. Tap &ldquo;Add entry&rdquo; to record your experience.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry: JournalEntryData) => (
            <div key={entry.id} className="bg-surface-container-lowest rounded-md p-4 shadow-ambient">
              {editingId === entry.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value.slice(0, 500))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(entry.id)} className="bg-primary text-on-primary px-4 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-secondary font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {entry.photoUrl && (
                    <button onClick={() => setViewingPhoto(entry.photoUrl)} className="block mb-3">
                      <img src={entry.photoUrl} alt="Journal photo" className="h-32 w-full rounded-lg object-cover" />
                    </button>
                  )}
                  {entry.note && (
                    <p className="text-sm text-on-surface leading-relaxed mb-2">{entry.note}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-secondary">{formatDate(entry.timestamp)}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingId(entry.id); setEditNote(entry.note); }}
                        className="p-1 hover:bg-surface-container rounded-full text-secondary"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 hover:bg-error-container rounded-full text-error"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-size photo viewer */}
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
          <img src={viewingPhoto} alt="Full size" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}
    </section>
  );
}
