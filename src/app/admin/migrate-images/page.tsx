"use client";

import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase-client";
import type { Marker } from "@/data/types";
import Link from "next/link";

type MigrationStatus = "pending" | "uploading" | "updating" | "done" | "error";

interface MigrationItem {
  marker: Marker;
  status: MigrationStatus;
  firebaseUrl?: string;
  error?: string;
}

export default function MigrateImagesPage() {
  const [items, setItems] = useState<MigrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    fetch("/api/markers")
      .then((r) => r.json())
      .then((markers: Marker[]) => {
        const local = markers.filter((m) =>
          m.imageUrl?.startsWith("/images/markers/") &&
          !m.imageUrl.includes("placeholder")
        );
        setItems(local.map((marker) => ({ marker, status: "pending" })));
        setLoading(false);
      });
  }, []);

  async function migrateOne(item: MigrationItem, index: number) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: "uploading" };
      return next;
    });

    try {
      const resp = await fetch(item.marker.imageUrl);
      if (!resp.ok) throw new Error(`Failed to fetch ${item.marker.imageUrl}`);
      const blob = await resp.blob();

      const storageRef = ref(storage, `markers/${item.marker.id}/marker-photo.jpg`);
      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const downloadUrl = await getDownloadURL(storageRef);

      setItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status: "updating", firebaseUrl: downloadUrl };
        return next;
      });

      const putResp = await fetch("/api/markers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marker: { ...item.marker, imageUrl: downloadUrl } }),
      });

      if (!putResp.ok) throw new Error(`API update failed: ${putResp.status}`);

      setItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status: "done", firebaseUrl: downloadUrl };
        return next;
      });
      setDoneCount((c) => c + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status: "error", error: msg };
        return next;
      });
    }
  }

  async function migrateAll() {
    setRunning(true);
    setDoneCount(0);
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "done") continue;
      await migrateOne(items[i], i);
    }
    setRunning(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant">Loading markers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6 max-w-4xl mx-auto">
      <Link href="/admin/edit" className="text-primary text-sm font-bold mb-4 inline-block">
        &larr; Back to Admin
      </Link>

      <h1 className="text-2xl font-bold text-on-surface mb-2">
        Migrate Marker Images to Firebase Storage
      </h1>
      <p className="text-on-surface-variant text-sm mb-6">
        This uploads local images from <code>/images/markers/</code> to Firebase Storage
        and updates each marker&apos;s imageUrl. One-time migration.
      </p>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={migrateAll}
          disabled={running || items.length === 0}
          className="px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-sm disabled:opacity-50 hover:bg-primary/90 transition-all active:scale-95"
        >
          {running ? `Migrating... (${doneCount}/${items.length})` : `Migrate All (${items.length} images)`}
        </button>
        {doneCount === items.length && items.length > 0 && (
          <span className="text-sm font-bold text-green-700">All done!</span>
        )}
      </div>

      <div className="rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container text-on-surface-variant text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Marker</th>
              <th className="text-left px-4 py-3">Local Path</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.marker.id} className="border-t border-outline-variant">
                <td className="px-4 py-3 font-bold text-on-surface">
                  {item.marker.shortCode} — {item.marker.name}
                </td>
                <td className="px-4 py-3 text-on-surface-variant font-mono text-xs">
                  {item.marker.imageUrl}
                </td>
                <td className="px-4 py-3">
                  {item.status === "pending" && (
                    <span className="text-on-surface-variant">Pending</span>
                  )}
                  {item.status === "uploading" && (
                    <span className="text-amber-600 font-bold">Uploading...</span>
                  )}
                  {item.status === "updating" && (
                    <span className="text-blue-600 font-bold">Saving...</span>
                  )}
                  {item.status === "done" && (
                    <span className="text-green-700 font-bold">Done</span>
                  )}
                  {item.status === "error" && (
                    <span className="text-error font-bold" title={item.error}>
                      Error: {item.error}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <p className="text-on-surface-variant text-center py-8">
          No markers with local image paths found. Migration may already be complete.
        </p>
      )}
    </div>
  );
}
