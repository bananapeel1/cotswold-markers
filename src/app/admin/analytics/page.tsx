import Link from "next/link";
import { getMarkers } from "@/data/markers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics | Cotswold Way Markers Admin",
};

// Generate mock scan data for the prototype
function generateMockScans(markerCount: number) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    totalScans: 847,
    thisWeek: 127,
    topMarker: "CW01",
    nfcPercent: 62,
    dailyScans: days.map((d) => ({
      day: d,
      count: Math.floor(Math.random() * 30) + 5,
    })),
    markerScans: Array.from({ length: markerCount }, (_, i) => ({
      code: `CW${String(i + 1).padStart(2, "0")}`,
      count: Math.floor(Math.random() * 80) + 10,
    })).sort((a, b) => b.count - a.count),
  };
}

export default async function AnalyticsPage() {
  const markers = await getMarkers();
  const data = generateMockScans(markers.length);
  const maxScan = Math.max(...data.markerScans.map((m) => m.count));

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
            { label: "Top Marker", value: data.topMarker, icon: "emoji_events" },
            { label: "NFC Scans", value: `${data.nfcPercent}%`, icon: "nfc" },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-surface rounded-2xl p-4 text-center"
            >
              <span className="material-symbols-outlined text-tertiary text-2xl mb-2">
                {card.icon}
              </span>
              <p className="text-2xl font-bold text-primary">{card.value}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* Scans per marker (bar chart) */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Scans per Marker
          </h2>
          <div className="space-y-2">
            {data.markerScans.map((m) => (
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
        </section>

        {/* Daily scans */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Scans This Week
          </h2>
          <div className="flex items-end gap-2 h-32">
            {data.dailyScans.map((d) => {
              const maxDaily = Math.max(
                ...data.dailyScans.map((s) => s.count)
              );
              const height = (d.count / maxDaily) * 100;
              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-semibold text-on-surface">
                    {d.count}
                  </span>
                  <div
                    className="w-full bg-primary rounded-t-md transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-on-surface-variant">
                    {d.day}
                  </span>
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
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-tertiary" />
              <span className="text-sm">NFC ({data.nfcPercent}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span className="text-sm">
                QR ({100 - data.nfcPercent}%)
              </span>
            </div>
          </div>
          <div className="mt-3 h-4 bg-surface-container-high rounded-full overflow-hidden flex">
            <div
              className="h-full bg-tertiary"
              style={{ width: `${data.nfcPercent}%` }}
            />
            <div
              className="h-full bg-primary"
              style={{ width: `${100 - data.nfcPercent}%` }}
            />
          </div>
        </section>

        <p className="text-xs text-on-surface-variant text-center italic">
          Note: This is mock data for the prototype. Production analytics would
          use real scan tracking.
        </p>
      </main>
    </div>
  );
}
