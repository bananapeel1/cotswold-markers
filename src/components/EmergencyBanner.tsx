"use client";

import { EmergencyInfo } from "@/data/types";

export default function EmergencyBanner({ info }: { info: EmergencyInfo }) {
  function shareLocation() {
    if (navigator.share) {
      navigator.share({
        title: "My Trail Location",
        text: `I'm at OS Grid Ref: ${info.gridReference}, What3Words: ///${info.what3words}. Nearest road: ${info.nearestRoad}`,
        url: `https://what3words.com/${info.what3words}`,
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `OS Grid Ref: ${info.gridReference}, What3Words: ///${info.what3words}, Nearest road: ${info.nearestRoad}`
      );
      alert("Location copied to clipboard");
    }
  }

  return (
    <section className="bg-surface-container rounded-md p-6 space-y-4 mx-4">
      <div className="flex items-center gap-2 text-error">
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          emergency
        </span>
        <span className="font-bold text-sm">Emergency Info</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="font-label text-[10px] font-bold text-secondary uppercase tracking-widest">
            OS Grid Ref
          </p>
          <p className="font-mono text-sm font-bold">{info.gridReference}</p>
        </div>
        <div className="space-y-1">
          <p className="font-label text-[10px] font-bold text-secondary uppercase tracking-widest">
            What3Words
          </p>
          <p className="font-mono text-sm font-bold text-tertiary">
            ///{info.what3words}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <a
          href="tel:999"
          className="flex-1 bg-error text-on-error py-4 rounded-full font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">call</span>
          999
        </a>
        <button
          onClick={shareLocation}
          className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-full font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">share_location</span>
          Share Location
        </button>
      </div>
    </section>
  );
}
