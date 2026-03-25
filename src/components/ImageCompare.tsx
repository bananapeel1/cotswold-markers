"use client";

import { useState, useRef, useCallback } from "react";

interface ImageCompareProps {
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
}

export default function ImageCompare({
  beforeLabel = "Then",
  afterLabel = "Now",
  title,
}: ImageCompareProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) handleMove(e.clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <section className="px-4 space-y-3">
      {title && (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            compare
          </span>
          <h3 className="font-headline font-bold text-lg">{title}</h3>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] rounded-md overflow-hidden select-none touch-none bg-surface-container"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* "Before" image placeholder */}
        <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center">
          <div className="text-center text-secondary/40">
            <span className="material-symbols-outlined text-4xl block mb-2">photo_library</span>
            <p className="text-xs font-bold">Historical image</p>
            <p className="text-[10px]">Coming soon</p>
          </div>
        </div>

        {/* "After" image placeholder with clip */}
        <div
          className="absolute inset-0 bg-surface-container flex items-center justify-center"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <div className="text-center text-secondary/40">
            <span className="material-symbols-outlined text-4xl block mb-2">photo_camera</span>
            <p className="text-xs font-bold">Present day</p>
            <p className="text-[10px]">Coming soon</p>
          </div>
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">
              swap_horiz
            </span>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute top-3 left-3 bg-on-surface/60 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full z-20">
          {beforeLabel}
        </span>
        <span className="absolute top-3 right-3 bg-on-surface/60 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full z-20">
          {afterLabel}
        </span>
      </div>

      <p className="text-[10px] text-secondary text-center">
        Drag the slider to compare historical and present-day views
      </p>
    </section>
  );
}
