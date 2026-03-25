"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRPreview from "@/components/QRPreview";
import ImageUpload from "@/components/ImageUpload";
import StoriesEditor from "@/components/admin/StoriesEditor";
import POIsEditor from "@/components/admin/POIsEditor";
import BusinessesEditor from "@/components/admin/BusinessesEditor";
import type { Marker, FacilityType } from "@/data/types";

const FACILITY_OPTIONS: FacilityType[] = [
  "pub", "cafe", "shop", "toilets", "parking", "bus", "accommodation", "water", "campsite",
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://trail.thecotswoldsway.com";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function AdminMarkerEditPage() {
  const { markerId } = useParams<{ markerId: string }>();
  const [marker, setMarker] = useState<Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/markers")
      .then((r) => r.json())
      .then((markers: Marker[]) => {
        const found = markers.find(
          (m) => m.id === markerId || m.shortCode.toLowerCase() === markerId.toLowerCase()
        );
        if (found) setMarker(found);
        setLoading(false);
      });
  }, [markerId]);

  async function save() {
    if (!marker) return;
    setStatus("saving");
    const res = await fetch("/api/markers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marker }),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 2000);
  }

  function update(patch: Partial<Marker>) {
    if (!marker) return;
    setMarker({ ...marker, ...patch });
  }

  function updateEmergency(field: string, value: string) {
    if (!marker) return;
    setMarker({
      ...marker,
      emergencyInfo: { ...marker.emergencyInfo, [field]: value },
    });
  }

  function toggleFacility(f: FacilityType) {
    if (!marker) return;
    const facs = marker.facilities.includes(f)
      ? marker.facilities.filter((x) => x !== f)
      : [...marker.facilities, f];
    setMarker({ ...marker, facilities: facs });
  }

  function copyUrl() {
    if (!marker) return;
    navigator.clipboard.writeText(`${BASE_URL}/m/${marker.shortCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  if (!marker) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-error font-bold">Marker not found</p>
      </div>
    );
  }

  const markerUrl = `${BASE_URL}/m/${marker.shortCode}`;

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/edit" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">
              Edit {marker.shortCode}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/m/${marker.shortCode}`}
              className="text-sm hover:underline opacity-80"
            >
              View marker
            </Link>
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
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* QR Code & Link */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            QR Code & Link
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <QRPreview url={markerUrl} />
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  Marker URL
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-surface-container px-3 py-2 rounded-md font-mono flex-1 break-all">
                    {markerUrl}
                  </code>
                  <button
                    onClick={copyUrl}
                    className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95 flex-shrink-0"
                    title="Copy URL"
                  >
                    <span className="material-symbols-outlined text-primary text-lg">
                      {copied ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">
                Print this QR code and attach to the physical marker. The URL updates when you change the short code.
              </p>
            </div>
          </div>
        </section>

        {/* Basic Info */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Basic Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Short Code" value={marker.shortCode} onChange={(v) => update({ shortCode: v })} mono />
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                Status
              </label>
              <button
                onClick={() => update({ isActive: !marker.isActive })}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  marker.isActive
                    ? "bg-primary-fixed text-on-primary-fixed"
                    : "bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                {marker.isActive ? "Active" : "Inactive"}
              </button>
            </div>
            <Field label="Name" value={marker.name} onChange={(v) => update({ name: v })} />
            <Field label="Subtitle" value={marker.subtitle} onChange={(v) => update({ subtitle: v })} />
            <Field label="Segment" value={marker.segment} onChange={(v) => update({ segment: v })} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                Description
              </label>
              <textarea
                value={marker.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                Image
              </label>
              <ImageUpload
                currentUrl={marker.imageUrl}
                markerId={marker.id}
                onUpload={(url) => update({ imageUrl: url })}
              />
              <input
                value={marker.imageUrl}
                onChange={(e) => update({ imageUrl: e.target.value })}
                placeholder="Or paste an image URL"
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mt-2 font-mono text-xs"
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="Latitude" value={marker.latitude} step={0.000001} onChange={(v) => update({ latitude: v })} mono />
            <NumberField label="Longitude" value={marker.longitude} step={0.000001} onChange={(v) => update({ longitude: v })} mono />
            <NumberField label="Trail Mile" value={marker.trailMile} step={0.5} onChange={(v) => update({ trailMile: v })} />
            <NumberField label="Elevation (m)" value={marker.elevation_m} step={1} onChange={(v) => update({ elevation_m: v })} />
            <NumberField label="Day on Trail" value={marker.dayOnTrail} step={1} onChange={(v) => update({ dayOnTrail: v })} />
          </div>
        </section>

        {/* Facilities */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Facilities
          </h2>
          <div className="flex flex-wrap gap-2">
            {FACILITY_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => toggleFacility(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
                  marker.facilities.includes(f)
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </section>

        {/* Emergency Info */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Emergency Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nearest Road" value={marker.emergencyInfo.nearestRoad} onChange={(v) => updateEmergency("nearestRoad", v)} />
            <Field label="Grid Reference" value={marker.emergencyInfo.gridReference} onChange={(v) => updateEmergency("gridReference", v)} mono />
            <Field label="what3words" value={marker.emergencyInfo.what3words} onChange={(v) => updateEmergency("what3words", v)} mono />
            <Field label="Nearest Phone" value={marker.emergencyInfo.nearestPhone} onChange={(v) => updateEmergency("nearestPhone", v)} />
            <Field label="Mountain Rescue" value={marker.emergencyInfo.mountainRescue} onChange={(v) => updateEmergency("mountainRescue", v)} className="sm:col-span-2" />
          </div>
        </section>

        {/* Stories */}
        <StoriesEditor markerId={marker.id} />

        {/* Nearby Places (Discover) */}
        <POIsEditor markerId={marker.id} />

        {/* Businesses */}
        <BusinessesEditor markerId={marker.id} />

        {/* Trail Links */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Trail Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Previous Marker ID" value={marker.prevMarkerId || ""} onChange={(v) => update({ prevMarkerId: v || null })} />
            <Field label="Next Marker ID" value={marker.nextMarkerId || ""} onChange={(v) => update({ nextMarkerId: v || null })} />
            <NumberField label="Distance to Next (miles)" value={marker.distanceToNext_miles} step={0.1} onChange={(v) => update({ distanceToNext_miles: v })} />
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

/* ── Reusable field components ── */

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

function NumberField({
  label,
  value,
  step,
  onChange,
  mono,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
        {label}
      </label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}
