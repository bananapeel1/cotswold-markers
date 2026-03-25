"use client";

interface ShareMarkerCardProps {
  markerName: string;
  shortCode: string;
  trailMile: number;
  elevation: number;
}

export default function ShareMarkerCard({
  markerName,
  shortCode,
  trailMile,
  elevation,
}: ShareMarkerCardProps) {
  async function share() {
    const text = `I scanned ${markerName} (${shortCode}) on the Cotswold Way with TrailTap! Mile ${trailMile} · ${elevation}m elevation`;
    const url = `${window.location.origin}/m/${shortCode}`;

    if (navigator.share) {
      await navigator.share({ title: markerName, text, url });
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
  }

  return (
    <button
      onClick={share}
      className="w-full flex items-center justify-center gap-2 bg-surface-container text-primary py-2.5 rounded-full text-xs font-bold active:scale-95 transition-all"
    >
      <span className="material-symbols-outlined text-sm">share</span>
      Share this scan
    </button>
  );
}
