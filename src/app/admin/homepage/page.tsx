"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SiteSettings {
  heroSubtitle: string;
  heroHeading: string;
  heroDescription: string;
  heroImageUrl: string;
  wanderersImageUrl: string;
  sponsorsImageUrl: string;
  statsTrailLength: string;
  statsLocalStops: string;
  statsScans: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  heroSubtitle: "The Modern Pathfinder",
  heroHeading: "Tap the trail. Discover what's next.",
  heroDescription: "",
  heroImageUrl: "",
  wanderersImageUrl: "",
  sponsorsImageUrl: "",
  statsTrailLength: "102",
  statsLocalStops: "45",
  statsScans: "0",
};

export default function HomepagePage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage("Settings saved successfully");
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error || "Failed to save"}`);
      }
    } catch {
      setMessage("Error: Could not reach server");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="bg-primary text-on-primary px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Homepage Editor</h1>
          </div>
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
          </div>
        )}

        {/* Hero Section */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Hero Section
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Subtitle
              </label>
              <input
                value={settings.heroSubtitle}
                onChange={(e) =>
                  setSettings({ ...settings, heroSubtitle: e.target.value })
                }
                placeholder="The Modern Pathfinder"
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Heading
              </label>
              <input
                value={settings.heroHeading}
                onChange={(e) =>
                  setSettings({ ...settings, heroHeading: e.target.value })
                }
                placeholder="Tap the trail. Discover what's next."
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Description
              </label>
              <textarea
                value={settings.heroDescription}
                onChange={(e) =>
                  setSettings({ ...settings, heroDescription: e.target.value })
                }
                placeholder="Hero description text..."
                rows={3}
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Hero Image URL
              </label>
              <input
                value={settings.heroImageUrl}
                onChange={(e) =>
                  setSettings({ ...settings, heroImageUrl: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* Page Images */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Page Images
          </h2>
          <p className="text-xs text-on-surface-variant mb-4">
            These images appear on the homepage and sponsors page. Paste any image URL.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                &ldquo;For the Wanderers&rdquo; Image (homepage mid-section)
              </label>
              <input
                value={settings.wanderersImageUrl}
                onChange={(e) =>
                  setSettings({ ...settings, wanderersImageUrl: e.target.value })
                }
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {settings.wanderersImageUrl && (
                <div className="rounded-lg overflow-hidden h-32 bg-surface-container mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.wanderersImageUrl} alt="Wanderers preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Sponsors Page Hero Image
              </label>
              <input
                value={settings.sponsorsImageUrl}
                onChange={(e) =>
                  setSettings({ ...settings, sponsorsImageUrl: e.target.value })
                }
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {settings.sponsorsImageUrl && (
                <div className="rounded-lg overflow-hidden h-32 bg-surface-container mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.sponsorsImageUrl} alt="Sponsors preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Ribbon */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Stats Ribbon
          </h2>
          <p className="text-xs text-on-surface-variant mb-4">
            Active markers count is automatically calculated from marker data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Trail Length (miles)
              </label>
              <input
                value={settings.statsTrailLength}
                onChange={(e) =>
                  setSettings({ ...settings, statsTrailLength: e.target.value })
                }
                placeholder="102"
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Local Stops
              </label>
              <input
                value={settings.statsLocalStops}
                onChange={(e) =>
                  setSettings({ ...settings, statsLocalStops: e.target.value })
                }
                placeholder="45"
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Total Scans
              </label>
              <input
                value={settings.statsScans}
                onChange={(e) =>
                  setSettings({ ...settings, statsScans: e.target.value })
                }
                placeholder="0"
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </main>
    </div>
  );
}
