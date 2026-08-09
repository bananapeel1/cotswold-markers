"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Badge } from "@/lib/badges";
import type { Rank } from "@/lib/xp";

const CATEGORY_LABELS: Record<Badge["category"], string> = {
  milestone: "Milestone Badges",
  special: "Special Badges",
  seasonal: "Seasonal Badges",
  secret: "Secret Badges",
};

const CATEGORY_ORDER: Badge["category"][] = ["milestone", "special", "seasonal", "secret"];

// The four milestone badges with an admin-tunable scan count, in ascending
// order — the API enforces strictly increasing thresholds along this list.
const MILESTONE_IDS = ["getting-started", "trail-regular", "half-way-hero", "almost-there"];

// Human labels for the XP value keys
const XP_LABELS: Record<string, string> = {
  SCAN_NEW_MARKER: "Scan a new marker (base XP)",
  BONUS_RAIN: "Rain bonus",
  BONUS_EARLY_BIRD: "Early bird (scan before 7am)",
  BONUS_NIGHT_OWL: "Night owl (scan after 8pm)",
  BONUS_WEEKEND: "Weekend bonus",
  BONUS_STREAK_PER_DAY: "Streak bonus (per consecutive day)",
  BONUS_SEGMENT_COMPLETE: "Segment complete (all markers in one day)",
  BONUS_SPEED_DEMON: "Speed demon (3+ markers in one day)",
  BONUS_TRAILBLAZER: "Trailblazer (first scan at a marker today)",
  BONUS_PACE_PERFECT: "Pace accuracy — perfect (within 5%)",
  BONUS_PACE_GOOD: "Pace accuracy — great (within 15%)",
  BONUS_PACE_DECENT: "Pace accuracy — good (within 25%)",
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [completionistDays, setCompletionistDays] = useState(14);
  const [xpValues, setXpValues] = useState<Record<string, number>>({});
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/game-config")
      .then((r) => r.json())
      .then((config) => {
        setBadges(config.badges || []);
        setThresholds(config.milestoneThresholds || {});
        setCompletionistDays(config.completionistDays || 14);
        setXpValues(config.xpValues || {});
        setRanks(config.ranks || []);
        setLoading(false);
      })
      .catch(() => {
        setMessage("Error: could not load the game config");
        setLoading(false);
      });
  }, []);

  function updateBadge(id: string, patch: Partial<Badge>) {
    setBadges((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function updateRank(index: number, patch: Partial<Rank>) {
    setRanks((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setIssues([]);

    const res = await fetch("/api/game-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        badges: {
          badges,
          milestoneThresholds: thresholds,
          completionistDays,
        },
        xp: {
          values: xpValues,
          ranks,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // Re-sync with what the server actually stored
      if (data.config) {
        setBadges(data.config.badges || badges);
        setThresholds(data.config.milestoneThresholds || thresholds);
        setCompletionistDays(data.config.completionistDays || completionistDays);
        setXpValues(data.config.xpValues || xpValues);
        setRanks(data.config.ranks || ranks);
      }
      setMessage("Game config saved — changes go live within a minute");
      setTimeout(() => setMessage(""), 4000);
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(`Error: ${err.error || "Save failed"}`);
      if (Array.isArray(err.issues)) setIssues(err.issues);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading game config...</p>
      </div>
    );
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    badges: badges.filter((b) => b.category === cat),
  }));

  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="bg-primary text-on-primary px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Badges &amp; XP</h1>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="bg-on-primary text-primary px-5 py-1.5 rounded-full text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div
            className={`rounded-2xl p-4 text-sm font-bold ${
              message.startsWith("Error")
                ? "bg-error-container text-on-error-container"
                : "bg-tertiary-container text-on-tertiary-container"
            }`}
          >
            {message}
            {issues.length > 0 && (
              <ul className="mt-2 space-y-1 font-normal list-disc list-inside">
                {issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Info banner */}
        <div className="bg-tertiary-container text-on-tertiary-container rounded-2xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-xl mt-0.5">info</span>
          <p className="text-sm">
            What earns each badge (the detection logic) is fixed — you can edit
            how badges are named and described, and the milestone counts. Icons
            are{" "}
            <a
              href="https://fonts.google.com/icons"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              Material Symbols
            </a>{" "}
            names, previewed live as you type.
          </p>
        </div>

        {/* Badge groups */}
        {grouped.map((group) => (
          <section key={group.category} className="bg-surface rounded-2xl p-6">
            <h2 className="font-headline font-bold text-primary text-lg mb-1">
              {group.label}
            </h2>
            {group.category === "milestone" && (
              <p className="text-xs text-on-surface-variant mb-4">
                Changing a threshold does not retroactively re-award badges —
                it applies from each walker&apos;s next scan onwards.
              </p>
            )}
            <div className="space-y-4 mt-4">
              {group.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-4 bg-surface-container-low rounded-lg space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-xl">
                        {badge.icon}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-secondary bg-surface-container px-2 py-1 rounded-full">
                      {badge.id}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">
                        Name
                      </label>
                      <input
                        value={badge.name}
                        onChange={(e) => updateBadge(badge.id, { name: e.target.value })}
                        className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">
                        Icon (Material Symbols name)
                      </label>
                      <input
                        value={badge.icon}
                        onChange={(e) => updateBadge(badge.id, { icon: e.target.value })}
                        className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-1">
                      Description
                    </label>
                    <input
                      value={badge.description}
                      onChange={(e) =>
                        updateBadge(badge.id, { description: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {MILESTONE_IDS.includes(badge.id) && (
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">
                        Markers needed (must increase from Getting Started to
                        Almost There)
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={thresholds[badge.id] ?? ""}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            [badge.id]: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-32 px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}
                  {badge.id === "completionist" && (
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">
                        Days allowed to scan all 50 markers
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={completionistDays}
                        onChange={(e) =>
                          setCompletionistDays(parseInt(e.target.value, 10) || 0)
                        }
                        className="w-32 px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* XP & Ranks */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-1">
            XP &amp; Ranks
          </h2>
          <p className="text-xs text-on-surface-variant mb-4">
            When a bonus applies is fixed — you set how much XP each one is
            worth, and what the rank titles and thresholds are.
          </p>

          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">
            XP Values
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {Object.keys(xpValues).map((key) => (
              <div key={key} className="flex items-center gap-3 bg-surface-container-low rounded-lg p-3">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={xpValues[key] ?? ""}
                  onChange={(e) =>
                    setXpValues({
                      ...xpValues,
                      [key]: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-24 px-3 py-2 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 flex-shrink-0"
                />
                <span className="text-xs text-on-surface">
                  {XP_LABELS[key] || key}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
            Ranks
          </p>
          <p className="text-xs text-on-surface-variant mb-3">
            XP thresholds must increase from top to bottom. The number of ranks
            is fixed.
          </p>
          <div className="space-y-2">
            {ranks.map((rank, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-surface-container-low rounded-lg p-3"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">
                    {rank.icon}
                  </span>
                </div>
                <input
                  value={rank.title}
                  onChange={(e) => updateRank(i, { title: e.target.value })}
                  placeholder="Rank title"
                  className="flex-1 px-4 py-2 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-0"
                />
                <label className="text-[10px] text-on-surface-variant flex-shrink-0">
                  from
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={rank.minXP}
                  onChange={(e) =>
                    updateRank(i, { minXP: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-24 px-3 py-2 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 flex-shrink-0"
                />
                <span className="text-[10px] text-on-surface-variant flex-shrink-0">XP</span>
              </div>
            ))}
          </div>
        </section>

        {/* Save button at bottom */}
        <div className="flex justify-end pb-8">
          <button
            onClick={save}
            disabled={saving}
            className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
