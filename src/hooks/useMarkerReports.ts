"use client";

import { useState, useEffect, useCallback } from "react";
import type { MarkerReport, MarkerIssueType } from "@/data/types";
import { auth } from "@/lib/firebase-client";

export function useMarkerReports(markerId: string) {
  const [reports, setReports] = useState<MarkerReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marker-reports?markerId=${markerId}`)
      .then((r) => r.json())
      .then((data) => setReports(data.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [markerId]);

  const submitReport = useCallback(
    async (issueType: MarkerIssueType, note?: string, photoUrl?: string, photoStoragePath?: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const idToken = await user.getIdToken();
      const res = await fetch("/api/marker-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markerId, issueType, note, idToken, photoUrl, photoStoragePath }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }

      const data = await res.json();
      setReports((prev) => [data.report, ...prev]);
      return data.report;
    },
    [markerId]
  );

  const deleteReport = useCallback(async (reportId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const idToken = await user.getIdToken();
    const res = await fetch(`/api/marker-reports?id=${reportId}&idToken=${idToken}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete");
    }

    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }, []);

  return { reports, loading, submitReport, deleteReport };
}
