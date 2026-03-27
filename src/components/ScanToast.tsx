"use client";

import { useEffect, useState } from "react";

interface ScanToastProps {
  markerName: string;
  badgeName?: string;
  badgeIcon?: string;
  xpEarned?: number;
}

export default function ScanToast({ markerName, badgeName, badgeIcon, xpEarned }: ScanToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      {badgeName ? (
        <div className="bg-primary text-on-primary px-5 py-3 rounded-full shadow-xl flex items-center gap-2.5">
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {badgeIcon || "workspace_premium"}
          </span>
          <span className="text-sm font-bold">New badge: {badgeName}!</span>
        </div>
      ) : (
        <div className="bg-primary-fixed text-on-primary-fixed px-5 py-3 rounded-full shadow-xl flex items-center gap-2.5">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span className="text-sm font-bold">{markerName} scanned</span>
          {xpEarned && xpEarned > 0 && (
            <span className="bg-primary text-on-primary text-xs font-bold px-2 py-0.5 rounded-full">
              +{xpEarned} XP
            </span>
          )}
        </div>
      )}
    </div>
  );
}
