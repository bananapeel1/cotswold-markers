"use client";

import { useState, useEffect, useCallback } from "react";
import type { TrailConditionReport, TrailConditionType } from "@/data/types";
import { auth } from "@/lib/firebase-client";

export function useTrailConditions(markerId: string) {
  const [conditions, setConditions] = useState<TrailConditionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trail-conditions?markerId=${markerId}`)
      .then((r) => r.json())
      .then((data) => setConditions(data.conditions || []))
      .catch(() => setConditions([]))
      .finally(() => setLoading(false));
  }, [markerId]);

  const submitCondition = useCallback(
    async (conditionType: TrailConditionType, note?: string, photoUrl?: string, photoStoragePath?: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const idToken = await user.getIdToken();
      const res = await fetch("/api/trail-conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markerId, conditionType, note, idToken, photoUrl, photoStoragePath }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }

      const data = await res.json();
      // Optimistic update
      setConditions((prev) => [data.condition, ...prev]);
      return data.condition;
    },
    [markerId]
  );

  return { conditions, loading, submitCondition };
}
