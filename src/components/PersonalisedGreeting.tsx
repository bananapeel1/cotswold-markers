"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PersonalisedGreeting() {
  const [scanCount, setScanCount] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("trailtap-scanned");
    const scanned: string[] = stored ? JSON.parse(stored) : [];
    if (scanned.length > 0) {
      setScanCount(scanned.length);
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const timeOfDay = new Date().getHours();
  const greeting =
    timeOfDay < 12 ? "Good morning" : timeOfDay < 17 ? "Good afternoon" : "Good evening";

  const remaining = 50 - scanCount;
  const progressPct = Math.round((scanCount / 50) * 100);

  return (
    <div className="mx-6 -mt-10 relative z-20 bg-surface-container-lowest rounded-md p-5 shadow-lg border border-outline-variant/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-headline font-bold text-lg text-primary">
            {greeting}, walker
          </p>
          <p className="text-xs text-secondary">
            {remaining > 0
              ? `${scanCount} scanned · ${remaining} marker${remaining !== 1 ? "s" : ""} to go`
              : "Trail complete! You are a Cotswold Conqueror."}
          </p>
        </div>
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              className="text-surface-variant"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth="3"
              strokeDasharray={`${progressPct}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
            {scanCount}
          </span>
        </div>
      </div>
      <Link
        href="/trail"
        className="flex items-center justify-center gap-2 w-full bg-primary text-on-primary py-2.5 rounded-full text-sm font-bold active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-base">hiking</span>
        Resume Trail
      </Link>
    </div>
  );
}
