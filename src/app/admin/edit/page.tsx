"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { FacilityType } from "@/data/types";

interface MarkerData {
  id: string;
  shortCode: string;
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  trailMile: number;
  elevation_m: number;
  segment: string;
  dayOnTrail: number;
  description: string;
  facilities: string[];
  isActive: boolean;
}

const FACILITY_OPTIONS: FacilityType[] = [
  "pub", "cafe", "shop", "toilets", "parking", "bus", "accommodation", "water", "campsite",
];

export default function AdminEditPage() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [creating, setCreating] = useState(false);
  const [newMarker, setNewMarker] = useState<MarkerData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/markers")
      .then((r) => r.json())
      .then(setMarkers);
  }, []);

  function startNew() {
    setNewMarker({
      id: "",
      shortCode: `CW${String(markers.length + 1).padStart(2, "0")}`,
      name: "",
      subtitle: "",
      latitude: 51.75,
      longitude: -2.07,
      trailMile: 0,
      elevation_m: 100,
      segment: "",
      dayOnTrail: 1,
      description: "",
      facilities: [],
      isActive: true,
    });
    setCreating(true);
  }

  async function createMarker() {
    if (!newMarker) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/markers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marker: newMarker }),
    });

    if (res.ok) {
      setMessage("Marker created!");
      setCreating(false);
      setNewMarker(null);
      const data = await fetch("/api/markers").then((r) => r.json());
      setMarkers(data);
    } else {
      const err = await res.json();
      setMessage(`Error: ${err.error}`);
    }
    setSaving(false);
  }

  async function deleteMarker(id: string) {
    if (!confirm("Delete this marker? This cannot be undone.")) return;
    const res = await fetch(`/api/markers?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMarkers(markers.filter((m) => m.id !== id));
      setMessage("Marker deleted");
    }
  }

  function toggleFacility(f: string) {
    if (!newMarker) return;
    const facs = newMarker.facilities.includes(f)
      ? newMarker.facilities.filter((x) => x !== f)
      : [...newMarker.facilities, f];
    setNewMarker({ ...newMarker, facilities: facs });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-outline-variant/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs text-primary font-bold mb-1 block">
              ← Back to Dashboard
            </Link>
            <h1 className="font-headline text-2xl font-extrabold text-primary">
              Manage Markers
            </h1>
          </div>
          <button
            onClick={startNew}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Marker
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {message && (
          <div className="mb-4 bg-primary-fixed text-on-primary-fixed px-4 py-3 rounded-md text-sm font-bold">
            {message}
          </div>
        )}

        {/* Create form */}
        {creating && newMarker && (
          <div className="bg-surface-container-lowest rounded-md p-6 shadow-ambient mb-8 space-y-5">
            <h2 className="font-headline font-bold text-lg">New Marker</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Name
                </label>
                <input
                  value={newMarker.name}
                  onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. Broadway Tower"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Short Code
                </label>
                <input
                  value={newMarker.shortCode}
                  onChange={(e) => setNewMarker({ ...newMarker, shortCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="CW01"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Subtitle
                </label>
                <input
                  value={newMarker.subtitle}
                  onChange={(e) => setNewMarker({ ...newMarker, subtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="The Highest Castle"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Segment
                </label>
                <input
                  value={newMarker.segment}
                  onChange={(e) => setNewMarker({ ...newMarker, segment: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Chipping Campden to Broadway"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={newMarker.latitude}
                  onChange={(e) => setNewMarker({ ...newMarker, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={newMarker.longitude}
                  onChange={(e) => setNewMarker({ ...newMarker, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Trail Mile
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newMarker.trailMile}
                  onChange={(e) => setNewMarker({ ...newMarker, trailMile: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Elevation (m)
                </label>
                <input
                  type="number"
                  value={newMarker.elevation_m}
                  onChange={(e) => setNewMarker({ ...newMarker, elevation_m: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Day on Trail
                </label>
                <input
                  type="number"
                  value={newMarker.dayOnTrail}
                  onChange={(e) => setNewMarker({ ...newMarker, dayOnTrail: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                Description
              </label>
              <textarea
                value={newMarker.description}
                onChange={(e) => setNewMarker({ ...newMarker, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Describe this marker location..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">
                Facilities
              </label>
              <div className="flex flex-wrap gap-2">
                {FACILITY_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFacility(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
                      newMarker.facilities.includes(f)
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-secondary"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={createMarker}
                disabled={saving || !newMarker.name}
                className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                {saving ? "Creating..." : "Create Marker"}
              </button>
              <button
                onClick={() => { setCreating(false); setNewMarker(null); }}
                className="px-6 py-3 rounded-full font-bold text-sm text-secondary hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Marker list */}
        <div className="space-y-2">
          {markers.map((m) => (
            <div
              key={m.id}
              className="bg-surface-container-lowest rounded-md p-4 flex items-center gap-4 shadow-ambient"
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold font-headline">
                {m.shortCode.replace("CW", "")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{m.name}</p>
                <p className="text-[10px] text-secondary">
                  Mile {m.trailMile} · {m.segment}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/admin/markers/${m.id}`}
                  className="p-2 hover:bg-surface-container rounded-full text-primary"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </Link>
                <Link
                  href={`/m/${m.shortCode}`}
                  className="p-2 hover:bg-surface-container rounded-full text-secondary"
                >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </Link>
                <button
                  onClick={() => deleteMarker(m.id)}
                  className="p-2 hover:bg-error-container rounded-full text-error"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
