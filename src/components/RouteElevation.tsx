"use client";

import { useState } from "react";
import type { ElevationPoint } from "@/data/types";

interface Props {
  points: ElevationPoint[];
  ascentM: number | null;
}

const W = 640;
const H = 130;
const PAD_L = 34;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 20;

export default function RouteElevation({ points, ascentM }: Props) {
  const [hover, setHover] = useState<ElevationPoint | null>(null);

  const totalMi = points[points.length - 1].distanceMi || 1;
  const elevations = points.map((p) => p.elevationM);
  const minE = Math.min(...elevations);
  const maxE = Math.max(...elevations);
  // Pad the vertical range so flat routes don't render as a straight line at the edge
  const lo = Math.floor((minE - Math.max(10, (maxE - minE) * 0.15)) / 10) * 10;
  const hi = Math.ceil((maxE + Math.max(10, (maxE - minE) * 0.15)) / 10) * 10;

  const x = (mi: number) => PAD_L + (mi / totalMi) * (W - PAD_L - PAD_R);
  const y = (m: number) => PAD_T + (1 - (m - lo) / (hi - lo)) * (H - PAD_T - PAD_B);

  const line = points.map((p) => `${x(p.distanceMi).toFixed(1)},${y(p.elevationM).toFixed(1)}`).join(" ");
  const area = `${PAD_L},${y(lo)} ${line} ${x(totalMi).toFixed(1)},${y(lo)}`;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const mi = ((px - PAD_L) / (W - PAD_L - PAD_R)) * totalMi;
    let best = points[0];
    let bestDiff = Infinity;
    for (const p of points) {
      const d = Math.abs(p.distanceMi - mi);
      if (d < bestDiff) { bestDiff = d; best = p; }
    }
    setHover(best);
  }

  return (
    <div className="bg-surface-container-low rounded-md p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">terrain</span>
          <h2 className="font-headline font-bold text-base">Elevation</h2>
        </div>
        <div className="text-[11px] text-secondary tabular-nums">
          {hover ? (
            <span className="font-bold text-on-surface">
              {hover.distanceMi} mi · {hover.elevationM} m
            </span>
          ) : (
            <>
              {ascentM != null && <span className="font-semibold">{ascentM} m ascent</span>}
              <span className="mx-1.5 opacity-40">·</span>
              <span>{minE}–{maxE} m</span>
            </>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Elevation profile: ${minE} to ${maxE} metres over ${totalMi} miles`}
      >
        {/* horizontal gridlines */}
        {[lo, (lo + hi) / 2, hi].map((m) => (
          <g key={m}>
            <line x1={PAD_L} y1={y(m)} x2={W - PAD_R} y2={y(m)} stroke="currentColor" className="text-outline-variant" strokeOpacity="0.35" strokeWidth="1" />
            <text x={PAD_L - 6} y={y(m) + 3} textAnchor="end" className="fill-current text-secondary" style={{ fontSize: "9px" }}>
              {Math.round(m)}
            </text>
          </g>
        ))}

        <polygon points={area} fill="#8E44AD" fillOpacity="0.14" />
        <polyline points={line} fill="none" stroke="#8E44AD" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {hover && (
          <g>
            <line x1={x(hover.distanceMi)} y1={PAD_T} x2={x(hover.distanceMi)} y2={H - PAD_B} stroke="#8E44AD" strokeOpacity="0.5" strokeWidth="1" />
            <circle cx={x(hover.distanceMi)} cy={y(hover.elevationM)} r="3.5" fill="#8E44AD" stroke="white" strokeWidth="1.5" />
          </g>
        )}

        {/* distance axis */}
        <text x={PAD_L} y={H - 6} className="fill-current text-secondary" style={{ fontSize: "9px" }}>0</text>
        <text x={W - PAD_R} y={H - 6} textAnchor="end" className="fill-current text-secondary" style={{ fontSize: "9px" }}>
          {totalMi.toFixed(1)} mi
        </text>
      </svg>

      <p className="text-[10px] text-on-surface-variant mt-1">
        From the publisher&apos;s official GPX track.
      </p>
    </div>
  );
}
