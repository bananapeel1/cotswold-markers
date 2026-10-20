"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Marker } from "@/data/types";
// Type-only import — erased at compile time, so the fs code in imageCredits.ts
// never reaches the client bundle. The record itself arrives as a prop.
import type { ImageCredit } from "@/data/imageCredits";

export default function MarkerHeader({
  marker,
  credit,
}: {
  marker: Marker;
  /** Wikimedia attribution for the marker's image (legal requirement). */
  credit?: ImageCredit | null;
}) {
  const [scanCount, setScanCount] = useState<number | null>(null);
  // Photo + credit appear together, and vanish together if the file is dead.
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = !!marker.imageUrl && !photoFailed;

  useEffect(() => {
    fetch("/api/scan")
      .then((r) => r.json())
      .then((data) => {
        const count = data.counts?.[marker.id] || 0;
        setScanCount(count);
      })
      .catch(() => {});
  }, [marker.id]);

  return (
    <section className="mt-4 px-4">
      {showPhoto && (
        <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden bg-surface-container mb-4">
          <Image
            src={marker.imageUrl}
            alt={marker.name}
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            className="object-cover"
            priority
            onError={() => setPhotoFailed(true)}
          />
        </div>
      )}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="material-symbols-outlined text-primary text-sm"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          location_on
        </span>
        <span className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
          Current Location
        </span>
      </div>
      <h2 className="text-4xl font-headline font-extrabold tracking-tight text-primary leading-none">
        {marker.name}
      </h2>
      {scanCount !== null && scanCount > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-secondary">
          <span className="material-symbols-outlined text-sm">group</span>
          <span className="text-xs">
            {scanCount} walker{scanCount !== 1 ? "s" : ""} scanned
          </span>
        </div>
      )}
      {credit && showPhoto && (
        <a
          href={credit.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[10px] text-secondary/70 hover:text-primary transition-colors"
        >
          Photo: {credit.photographer} · {credit.license}
        </a>
      )}
    </section>
  );
}
