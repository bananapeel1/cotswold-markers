"use client";

import { useState, useEffect } from "react";
import type { CommunityPhoto } from "@/data/types";

export function useCommunityPhotos(markerId: string) {
  const [photos, setPhotos] = useState<CommunityPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/community-photos?markerId=${markerId}`)
      .then((r) => r.json())
      .then((data) => setPhotos(data.photos || []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [markerId]);

  return { photos, loading };
}
