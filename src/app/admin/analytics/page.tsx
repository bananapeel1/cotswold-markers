"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AnalyticsData {
  totalScans: number;
  thisWeek: number;
  topMarker: string | null;
  scansBySource: Record<string, number>;
  scansByMarker: { code: string; count: number }[];
  dailyScans: { day: string; count: number }[];
  totalWalkers: number;
  activeNow: number;
  completionsThisMonth: number;
  trailConditionsCount: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading analytics...</p>
      </div>
    );
  }

  const maxScan = Math.max(...data.scansByMarker.map((m) => m.count), 1);
  const maxDaily = Math.max(...data.dailyScans.map((d) => d.count), 1);
  const totalSourceScans = Object.values(data.scansBySource).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Analytics</h1>
          </div>
          <Link href="/" className="text-sm hover:underline opacity-80">
            View site
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Scans", value: data.totalScans.toLocaleString(), icon: "qr_code_scanner" },
            { label: "This Week", value: data.thisWeek.toLocaleString(), icon: "trending_up" },
            { label: "Top Marker", value: data.topMarker || "—", icon: "emoji_events" },
            { label: "Walkers", value: data.totalWalkers.toLocaleString(), icon: "group" },
          ].map((card) => (
            <div key={card.label} className="bg-surface rounded-2xl p-4 text-center">
              <span className="material-symbols-outlined text-tertiary text-2xl mb-2">
                {card.icon}
              </span>
              <p className="text-2xl font-bold text-primary">{card.value}</p>
              <p className="text-xs text-on-surface-variant mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-primary">LIVE</span>
            </div>
            <p className="text-xl font-bold text-primary">{data.activeNow}</p>
            <p className="text-[10px] text-secondary">On trail now</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 text-center">
            <span className="material-symbols-outlined text-primary text-lg mb-1">verified</span>
            <p className="text-xl font-bold text-primary">{data.completionsThisMonth}</p>
            <p className="text-[10px] text-secondary">Completions this month</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 text-center">
            <span className="material-symbols-outlined text-primary text-lg mb-1">warning</span>
            <p className="text-xl font-bold text-primary">{data.trailConditionsCount}</p>
            <p className="text-[10px] text-secondary">Active reports</p>
          </div>
        </div>

        {/* Scans per marker (bar chart) */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Scans per Marker
          </h2>
          {data.scansByMarker.length === 0 ? (
            <p className="text-sm text-secondary italic">No scan data yet</p>
          ) : (
            <div className="space-y-2">
              {data.scansByMarker.map((m) => (
                <div key={m.code} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-on-surface-variant w-10">
                    {m.code}
                  </span>
                  <div className="flex-1 h-6 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tertiary rounded-full transition-all"
                      style={{ width: `${(m.count / maxScan) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-on-surface w-8 text-right">
                    {m.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Daily scans */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Scans This Week
          </h2>
          <div className="flex items-end gap-2 h-32">
            {data.dailyScans.map((d) => {
              const height = maxDaily > 0 ? (d.count / maxDaily) * 100 : 0;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-on-surface">
                    {d.count}
                  </span>
                  <div
                    className="w-full bg-primary rounded-t-md transition-all"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className="text-xs text-on-surface-variant">{d.day}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Source breakdown */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Scan Source
          </h2>
          <div className="flex items-center gap-6 flex-wrap">
            {Object.entries(data.scansBySource).map(([source, count]) => {
              const pct = Math.round((count / totalSourceScans) * 100);
              const colors: Record<string, string> = {
                direct: "bg-primary",
                qr: "bg-tertiary",
                nfc: "bg-secondary",
              };
              return (
                <div key={source} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${colors[source] || "bg-secondary"}`} />
                  <span className="text-sm capitalize">
                    {source} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 h-4 bg-surface-container-high rounded-full overflow-hidden flex">
            {Object.entries(data.scansBySource).map(([source, count]) => {
              const pct = (count / totalSourceScans) * 100;
              const colors: Record<string, string> = {
                direct: "bg-primary",
                qr: "bg-tertiary",
                nfc: "bg-secondary",
              };
              return (
                <div
                  key={source}
                  className={`h-full ${colors[source] || "bg-secondary"}`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
