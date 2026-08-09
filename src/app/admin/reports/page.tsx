"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ReportModeration from "@/components/admin/ReportModeration";
import ConditionModeration from "@/components/admin/ConditionModeration";
import HintModeration from "@/components/admin/HintModeration";

type ModerationTab = "reports" | "conditions" | "hints";

const TABS: { key: ModerationTab; label: string; icon: string }[] = [
  { key: "reports", label: "Marker reports", icon: "report" },
  { key: "conditions", label: "Trail conditions", icon: "landscape" },
  { key: "hints", label: "Hints", icon: "tips_and_updates" },
];

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ModerationTab>("reports");

  return (
    <>
      {/* React 19 hoists this to <head>; replaces the metadata export this
          page had before it became a client component. */}
      <title>TrailTap | Moderation</title>

      <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md flex justify-between items-center h-16 px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xl font-black text-primary tracking-tighter font-headline">
            TrailTap
          </Link>
          <span className="text-secondary text-sm font-medium">/ Moderation</span>
        </div>
        <LogoutButton />
      </nav>

      <main className="pt-20 pb-8 px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black font-headline">Moderation</h1>
          <Link
            href="/admin"
            className="text-xs font-bold text-secondary hover:text-primary transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Queue tabs */}
        <div className="flex gap-1 mb-6 border-b border-outline-variant/20 pb-3">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 ${
                tab === key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-secondary hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {tab === "reports" && <ReportModeration />}
        {tab === "conditions" && <ConditionModeration />}
        {tab === "hints" && <HintModeration />}
      </main>
    </>
  );
}
