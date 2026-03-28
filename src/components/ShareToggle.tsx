"use client";

import { useState } from "react";

interface ShareToggleProps {
  shared: boolean;
  onToggle: (share: boolean) => Promise<void>;
  disabled?: boolean;
}

export default function ShareToggle({ shared, onToggle, disabled }: ShareToggleProps) {
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    if (toggling || disabled) return;
    setToggling(true);
    try {
      await onToggle(!shared);
    } finally {
      setToggling(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling || disabled}
      className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-all active:scale-95 disabled:opacity-50 ${
        shared
          ? "bg-primary-fixed text-primary"
          : "bg-surface-container text-secondary"
      }`}
    >
      <span className="material-symbols-outlined text-xs">
        {shared ? "public" : "public_off"}
      </span>
      {toggling ? "..." : shared ? "Shared" : "Share"}
    </button>
  );
}
