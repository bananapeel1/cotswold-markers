"use client";

import { useState } from "react";

interface AudioPlayerProps {
  storyTitle: string;
  duration?: string;
}

export default function AudioPlayer({
  storyTitle,
  duration = "1:30",
}: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex items-center gap-4 bg-surface-container rounded-full px-5 py-3">
      <button
        onClick={() => setPlaying(!playing)}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-lg">
          {playing ? "pause" : "play_arrow"}
        </span>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{storyTitle}</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1 h-1 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-0" />
          </div>
          <span className="text-[10px] text-secondary font-mono flex-shrink-0">
            {duration}
          </span>
        </div>
      </div>
    </div>
  );
}
