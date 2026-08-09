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
import { haversineMiles } from "@/lib/validation/geometry";

const FACILITY_OPTIONS: FacilityType[] = [
  "pub", "cafe", "shop", "toilets", "parking", "bus", "accommodation", "water", "campsite",
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://trail.thecotswoldsway.com";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function AdminMarkerEditPage() {
  const { markerId } = useParams<{ markerId: string }>();
  const [marker, setMarker] = useState<Marker | null>(null);
  const [original, setOriginal] = useState<Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/markers")
      .then((r) => r.json())
      .then((markers: Marker[]) => {
        const found = markers.find(
          (m) => m.id === markerId || m.shortCode.toLowerCase() === markerId.toLowerCase()
        );
        if (found) {
          setMarker(found);
          setOriginal(found);
        }
        setLoading(false);
      });
  }, [markerId]);

  async function save(confirmCoordinateChange = false) {
    if (!marker) return;
    setStatus("saving");
    setErrorMsg(null);
    const res = await fetch("/api/markers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        confirmCoordinateChange
          ? { marker, confirmCoordinateChange: true }
          : { marker }
      ),
    });

    if (res.ok) {
      setOriginal(marker);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    const data = await res.json().catch(() => ({}));

    // Moving a marker's pin needs an explicit confirmation — markers are
    // physical posts on the trail.
    if (res.status === 409 && data.requiresCoordinateConfirmation && original) {
      const meters = Math.round(
        haversineMiles(
          original.latitude,
          original.longitude,
          marker.latitude,
          marker.longitude
        ) * 1609
      );
      const ok = window.confirm(
        `You are moving ${marker.shortCode} by about ${meters}m.\n\n` +
          `Markers are physical posts on the trail — only confirm if the pin ` +
          `really is in the wrong place.\n\nSave the new position?`
      );
      if (ok) return save(true);
      setStatus("idle");
      return;
    }

    setErrorMsg(
      Array.isArray(data.issues)
        ? data.issues.join(" · ")
        : data.error || "Save failed — please try again."
    );
    setStatus("error");
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

  // ?source=qr is what makes a visit count as a physical scan — printed codes
  // must always carry it (bare /m/... links deliberately don't record scans).
  const markerUrl = `${BASE_URL}/m/${marker.shortCode}?source=qr`;

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
              onClick={() => save()}
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

      {errorMsg && (
        <div className="bg-error/10 text-error text-sm font-medium px-6 py-3">
          <div className="max-w-3xl mx-auto">{errorMsg}</div>
        </div>
      )}

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
              <p className="text-xs text-on-surface-variant bg-surface-container rounded-md px-3 py-2">
                <strong>Note:</strong> this code includes <code>?source=qr</code>, which is
                what records a walker&apos;s scan for badges and progress. QR codes printed
                before August 2026 don&apos;t include it — walkers can still read those
                markers, but their scans won&apos;t register until the plaque is reprinted
                with this code.
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

        {/* Seasonal Comparison */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Seasonal Comparison
          </h2>
          <p className="text-xs text-secondary mb-4">Upload two photos to show how this location looks in different seasons.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Left Label" value={marker.seasonBeforeLabel || "Summer"} onChange={(v) => update({ seasonBeforeLabel: v })} />
            <Field label="Right Label" value={marker.seasonAfterLabel || "Winter"} onChange={(v) => update({ seasonAfterLabel: v })} />
            <Field label="Left Image URL" value={marker.seasonBeforeImage || ""} onChange={(v) => update({ seasonBeforeImage: v })} />
            <Field label="Right Image URL" value={marker.seasonAfterImage || ""} onChange={(v) => update({ seasonAfterImage: v })} />
          </div>
        </section>

        {/* Seasonal & Wildlife Notes */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Seasonal &amp; Wildlife Notes
          </h2>
          <p className="text-xs text-secondary mb-4">
            Shown in the &quot;Look Out For&quot; section on the marker page. Icon is a
            Material Symbols name; months is a range like &quot;May-Jul&quot; or
            &quot;Year-round&quot;. Until notes are saved here once, the page falls back
            to the built-in list (CW01–CW15 only).
          </p>
          <div className="space-y-3">
            {(marker.seasonalNotes || []).map((note, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="material-symbols-outlined text-primary text-lg">
                    {note.icon || "eco"}
                  </span>
                </div>
                <input
                  value={note.icon}
                  onChange={(e) => {
                    const notes = [...(marker.seasonalNotes || [])];
                    notes[i] = { ...notes[i], icon: e.target.value };
                    update({ seasonalNotes: notes });
                  }}
                  placeholder="icon"
                  className="w-28 px-3 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  value={note.text}
                  onChange={(e) => {
                    const notes = [...(marker.seasonalNotes || [])];
                    notes[i] = { ...notes[i], text: e.target.value };
                    update({ seasonalNotes: notes });
                  }}
                  placeholder="What to look out for"
                  className="flex-1 px-3 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-0"
                />
                <input
                  value={note.months}
                  onChange={(e) => {
                    const notes = [...(marker.seasonalNotes || [])];
                    notes[i] = { ...notes[i], months: e.target.value };
                    update({ seasonalNotes: notes });
                  }}
                  placeholder="May-Jul"
                  className="w-28 px-3 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={() =>
                    update({
                      seasonalNotes: (marker.seasonalNotes || []).filter((_, j) => j !== i),
                    })
                  }
                  className="p-2 mt-1 hover:bg-error-container rounded-full text-error flex-shrink-0"
                  title="Remove note"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                update({
                  seasonalNotes: [
                    ...(marker.seasonalNotes || []),
                    { icon: "local_florist", text: "", months: "Year-round" },
                  ],
                })
              }
              className="bg-surface-container text-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add note
            </button>
          </div>
        </section>

        {/* Marker Hints */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Finding This Marker
          </h2>
          <p className="text-xs text-secondary mb-4">Help walkers find this marker with a photo and description of its exact location.</p>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Hint Text" value={marker.hintText || ""} onChange={(v) => update({ hintText: v })} />
            <Field label="Hint Photo URL" value={marker.hintPhoto || ""} onChange={(v) => update({ hintPhoto: v })} />
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
            <Field label="Walking Time to Next (e.g. 56min)" value={marker.walkingTimeToNext || ""} onChange={(v) => update({ walkingTimeToNext: v })} />
          </div>
        </section>

        {/* Save button at bottom */}
        <div className="flex justify-end pb-8">
          <button
            onClick={() => save()}
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
