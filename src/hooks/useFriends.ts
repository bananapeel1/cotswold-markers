"use client";

import { useState, useEffect } from "react";

interface Friend {
  uid: string;
  name: string;
  scanCount: number;
  badgeCount: number;
  isComplete: boolean;
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setFriends(data.friends || []))
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, []);

  return { friends, loading };
}
