"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Story } from "@/data/types";

interface StoryCardProps {
  story: Story;
  isFirst?: boolean;
  requiredScans?: number;
}

export default function StoryCard({
  story,
  isFirst = true,
  requiredScans = 5,
}: StoryCardProps) {
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("trailtap-scanned");
    const parsed: string[] = stored ? JSON.parse(stored) : [];
    setScanCount(parsed.length);
  }, []);

  const isUnlocked = isFirst || scanCount >= requiredScans;

  if (!isUnlocked) {
    return (
      <section className="mx-4">
        <div className="relative rounded-md overflow-hidden bg-surface-container p-6">
          {/* Blurred/locked state */}
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-secondary">
              lock
            </span>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
              Locked Story
            </span>
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface/40 mb-2">
            {story.title}
          </h3>
          <p className="text-sm text-secondary/40 blur-[2px] select-none leading-relaxed">
            {story.summary}
          </p>
          <div className="mt-4 bg-surface-container-high rounded-full px-4 py-2.5 flex items-center gap-2 w-fit">
            <span className="material-symbols-outlined text-primary text-sm">
              qr_code_scanner
            </span>
            <span className="text-xs font-bold text-on-surface">
              Scan {requiredScans - scanCount} more marker
              {requiredScans - scanCount !== 1 ? "s" : ""} to unlock
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 px-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">
          menu_book
        </span>
        <h3 className="font-headline font-bold text-lg">{story.title}</h3>
      </div>
      <p className="text-secondary leading-relaxed text-sm editorial-dropcap">
        {story.summary} {story.body.slice(0, 180)}...
      </p>
      <Link
        href={`/story/${story.id}`}
        className="inline-flex items-center gap-1 text-sm text-primary font-bold group"
      >
        Read full story
        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </Link>
    </section>
  );
}
