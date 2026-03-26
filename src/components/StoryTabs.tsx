"use client";

import { useState } from "react";
import Link from "next/link";
import { Story } from "@/data/types";
import { useUserScans } from "@/hooks/useUserScans";
import AudioPlayer from "./AudioPlayer";

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  history: { label: "History", icon: "castle" },
  nature: { label: "Nature", icon: "eco" },
  legend: { label: "Legend", icon: "auto_awesome" },
  local: { label: "Local", icon: "location_city" },
  geology: { label: "Geology", icon: "terrain" },
};

export default function StoryTabs({ stories }: { stories: Story[] }) {
  const categories = [...new Set(stories.map((s) => s.category))];
  const [activeTab, setActiveTab] = useState(categories[0] || "history");
  const { scannedMarkerIds } = useUserScans();

  if (stories.length === 0) return null;

  const activeStory = stories.find((s) => s.category === activeTab) || stories[0];
  const config = CATEGORY_CONFIG[activeStory.category] || { label: activeStory.category, icon: "menu_book" };
  const isLocked = activeStory.isHidden && !activeStory.markerIds.some(id => scannedMarkerIds.includes(id));

  return (
    <section className="space-y-4 px-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">menu_book</span>
        <h3 className="font-headline font-bold text-lg">Stories</h3>
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat] || { label: cat, icon: "menu_book" };
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Active story */}
      <div className="bg-surface-container-lowest rounded-md p-5 shadow-ambient">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-lg">
            {config.icon}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-secondary bg-surface-container px-2 py-0.5 rounded-full">
            {config.label}
          </span>
        </div>

        <h4 className="font-headline font-bold text-lg mb-3">
          {activeStory.title}
        </h4>

        {isLocked ? (
          <div className="relative">
            <p className="text-secondary leading-relaxed text-sm mb-4 editorial-dropcap blur-sm select-none">
              {activeStory.summary} {activeStory.body.slice(0, 200)}...
            </p>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="material-symbols-outlined text-3xl text-secondary mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock
              </span>
              <p className="text-sm font-bold text-secondary text-center">
                Scan this marker to unlock this story
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-secondary leading-relaxed text-sm mb-4 editorial-dropcap">
              {activeStory.summary} {activeStory.body.slice(0, 200)}...
            </p>

            {/* Trail Secret callout */}
            {activeStory.trailSecret && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 flex items-start gap-3">
                <span
                  className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lock_open
                </span>
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
                    Trail Secret
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {activeStory.trailSecret}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Link
                href={`/story/${activeStory.id}`}
                className="inline-flex items-center gap-1 text-sm text-primary font-bold group"
              >
                Read full story
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </>
        )}

        {/* Audio player */}
        {!isLocked && (
          <div className="mt-4">
            <AudioPlayer storyTitle={activeStory.title} />
          </div>
        )}
      </div>
    </section>
  );
}
