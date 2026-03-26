"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SiteSettings {
  appName: string;
  tagline: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImageUrl: string;
  trailName: string;
  trailLength: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: SiteSettings) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    if (!settings) return;
    setStatus("saving");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 2000);
  }

  function update(patch: Partial<SiteSettings>) {
    if (!settings) return;
    setSettings({ ...settings, ...patch });
  }

  function updateSocial(field: string, value: string) {
    if (!settings) return;
    setSettings({
      ...settings,
      socialLinks: { ...settings.socialLinks, [field]: value },
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-error font-bold">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Site Settings</h1>
          </div>
          <button
            onClick={save}
            disabled={status === "saving"}
            className="bg-on-primary text-primary px-4 py-1.5 rounded-full text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
          >
            {status === "saving"
              ? "Saving..."
              : status === "saved"
              ? "Saved!"
              : status === "error"
              ? "Error"
              : "Save"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Branding */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Branding
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="App Name"
              value={settings.appName}
              onChange={(v) => update({ appName: v })}
            />
            <Field
              label="Tagline"
              value={settings.tagline}
              onChange={(v) => update({ tagline: v })}
              className="sm:col-span-2"
            />
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Hero Section
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Field
              label="Subtitle Label"
              value={settings.heroSubtitle}
              onChange={(v) => update({ heroSubtitle: v })}
            />
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                Hero Description
              </label>
              <textarea
                value={settings.heroDescription}
                onChange={(e) => update({ heroDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <Field
              label="Hero Image URL"
              value={settings.heroImageUrl}
              onChange={(v) => update({ heroImageUrl: v })}
              mono
            />
            {settings.heroImageUrl && (
              <div className="rounded-lg overflow-hidden h-40 bg-surface-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.heroImageUrl}
                  alt="Hero preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </section>

        {/* Trail Info */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Trail Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Trail Name"
              value={settings.trailName}
              onChange={(v) => update({ trailName: v })}
            />
            <Field
              label="Trail Length (miles)"
              value={settings.trailLength}
              onChange={(v) => update({ trailLength: v })}
            />
          </div>
        </section>

        {/* Social Links */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Social Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Instagram"
              value={settings.socialLinks.instagram || ""}
              onChange={(v) => updateSocial("instagram", v)}
              mono
            />
            <Field
              label="Facebook"
              value={settings.socialLinks.facebook || ""}
              onChange={(v) => updateSocial("facebook", v)}
              mono
            />
            <Field
              label="Twitter / X"
              value={settings.socialLinks.twitter || ""}
              onChange={(v) => updateSocial("twitter", v)}
              mono
            />
            <Field
              label="Website"
              value={settings.socialLinks.website || ""}
              onChange={(v) => updateSocial("website", v)}
              mono
            />
          </div>
        </section>

        {/* Save button at bottom */}
        <div className="flex justify-end pb-8">
          <button
            onClick={save}
            disabled={status === "saving"}
            className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
          >
            {status === "saving"
              ? "Saving..."
              : status === "saved"
              ? "Saved!"
              : status === "error"
              ? "Error — Try Again"
              : "Save Changes"}
          </button>
        </div>
      </main>
    </div>
  );
}

/* -- Reusable field component -- */

function Field({
  label,
  value,
  onChange,
  mono,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}
