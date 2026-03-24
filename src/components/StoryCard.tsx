"use client";

import { useState } from "react";
import Link from "next/link";
import { Story, getCategoryEmoji } from "@/data/types";

export default function StoryCard({ story }: { story: Story }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-lg">
          {getCategoryEmoji(story.category)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
            {story.category}
          </p>
          <p className="font-headline font-semibold text-primary">
            {story.title}
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            {story.summary}
          </p>
        </div>
        <span
          className="material-symbols-outlined text-on-surface-variant mt-1 transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "none" }}
        >
          expand_more
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-outline-variant pt-3">
            <p className="text-sm text-on-surface leading-relaxed line-clamp-4">
              {story.body}
            </p>
            <Link
              href={`/story/${story.id}`}
              className="inline-flex items-center gap-1 mt-3 text-sm text-tertiary font-semibold hover:underline"
            >
              Read full story
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
