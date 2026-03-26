"use client";

import { useState, useEffect, useCallback } from "react";

export interface JournalEntryData {
  id: string;
  userId: string;
  markerId: string;
  note: string;
  photoUrl: string | null;
  timestamp: string;
}

export function useJournal(markerId?: string) {
  const [entries, setEntries] = useState<JournalEntryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = markerId ? `/api/journal?markerId=${markerId}` : "/api/journal";
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setEntries(data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [markerId]);

  const addEntry = useCallback(
    async (note: string, photoUrl?: string) => {
      if (!markerId) throw new Error("markerId required");

      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markerId, note, photoUrl: photoUrl || null }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const data = await res.json();
      setEntries((prev) => [data.entry, ...prev]);
      return data.entry;
    },
    [markerId]
  );

  const updateEntry = useCallback(async (id: string, note: string) => {
    const res = await fetch("/api/journal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, note }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update");
    }

    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, note } : e))
    );
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const res = await fetch(`/api/journal?id=${id}`, { method: "DELETE" });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete");
    }

    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, loading, addEntry, updateEntry, deleteEntry };
}
