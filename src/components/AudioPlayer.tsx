"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  storyTitle: string;
  audioUrl?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  storyTitle,
  audioUrl,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const togglePlay = useCallback(async () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setLoading(true);

      audio.addEventListener("loadedmetadata", () => {
        setTotalDuration(audio.duration);
        setLoading(false);
      });
      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener("ended", () => {
        setPlaying(false);
        setCurrentTime(0);
      });
      audio.addEventListener("error", () => {
        setLoading(false);
        setPlaying(false);
      });

      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setLoading(false);
      }
      return;
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        // playback blocked
      }
    }
  }, [audioUrl, playing]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  function handleSeek(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    if (!audioRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * totalDuration;
    setCurrentTime(audioRef.current.currentTime);
  }

  // No audioUrl — show placeholder
  if (!audioUrl) {
    return (
      <div className="flex items-center gap-4 bg-surface-container rounded-full px-5 py-3 opacity-50">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-variant text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">headphones</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{storyTitle}</p>
          <p className="text-[10px] text-secondary">Audio coming soon</p>
        </div>
      </div>
    );
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-4 bg-surface-container rounded-full px-5 py-3">
      <button
        onClick={togglePlay}
        disabled={loading}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform disabled:opacity-60"
      >
        {loading ? (
          <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-lg">
            {playing ? "pause" : "play_arrow"}
          </span>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{storyTitle}</p>
        <div className="flex items-center gap-3 mt-1">
          <div
            ref={progressRef}
            className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden cursor-pointer"
            onClick={handleSeek}
            onTouchStart={handleSeek}
          >
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-secondary font-mono flex-shrink-0">
            {totalDuration > 0 ? `${formatTime(currentTime)} / ${formatTime(totalDuration)}` : "0:00"}
          </span>
        </div>
      </div>
    </div>
  );
}
