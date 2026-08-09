"use client";

// The old Homepage Editor duplicated fields now owned elsewhere: hero image /
// tagline / stats live in /admin/settings, and the homepage's section copy is
// edited in /admin/content ("Pages & Copy"). This stub keeps old links and
// bookmarks working.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomepageEditorMoved() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/content");
  }, [router]);

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
      <p className="text-secondary">
        This editor has moved to Pages &amp; Copy — redirecting…
      </p>
    </div>
  );
}
