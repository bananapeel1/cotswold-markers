"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

const FACILITY_OPTIONS = [
  "pub", "cafe", "shop", "toilets", "parking", "bus", "accommodation", "water", "campsite",
];

export default function AdminEditPage() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [editing, setEditing] = useState<MarkerData | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/markers")
      .then((r) => r.json())
      .then(setMarkers);
  }, []);

  function startNew() {
    setEditing({
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
    setIsNew(true);
  }

  function startEdit(m: MarkerData) {
    setEditing({ ...m });
    setIsNew(false);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setMessage("");

    const method = isNew ? "POST" : "PUT";
    const res = await fetch("/api/markers", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marker: editing }),
    });

    if (res.ok) {
      setMessage(isNew ? "Marker created!" : "Marker updated!");
      setEditing(null);
      // Refresh list
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
    if (!editing) return;
    const facs = editing.facilities.includes(f)
      ? editing.facilities.filter((x) => x !== f)
      : [...editing.facilities, f];
    setEditing({ ...editing, facilities: facs });
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

        {/* Edit form */}
        {editing && (
          <div className="bg-surface-container-lowest rounded-md p-6 shadow-ambient mb-8 space-y-5">
            <h2 className="font-headline font-bold text-lg">
              {isNew ? "New Marker" : `Editing: ${editing.name}`}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Name
                </label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. Broadway Tower"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Short Code
                </label>
                <input
                  value={editing.shortCode}
                  onChange={(e) => setEditing({ ...editing, shortCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="CW01"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Subtitle
                </label>
                <input
                  value={editing.subtitle}
                  onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="The Highest Castle"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Segment
                </label>
                <input
                  value={editing.segment}
                  onChange={(e) => setEditing({ ...editing, segment: e.target.value })}
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
                  value={editing.latitude}
                  onChange={(e) => setEditing({ ...editing, latitude: parseFloat(e.target.value) || 0 })}
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
                  value={editing.longitude}
                  onChange={(e) => setEditing({ ...editing, longitude: parseFloat(e.target.value) || 0 })}
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
                  value={editing.trailMile}
                  onChange={(e) => setEditing({ ...editing, trailMile: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Elevation (m)
                </label>
                <input
                  type="number"
                  value={editing.elevation_m}
                  onChange={(e) => setEditing({ ...editing, elevation_m: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                  Day on Trail
                </label>
                <input
                  type="number"
                  value={editing.dayOnTrail}
                  onChange={(e) => setEditing({ ...editing, dayOnTrail: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">
                Description
              </label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
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
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      editing.facilities.includes(f)
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
                onClick={save}
                disabled={saving || !editing.name}
                className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                {saving ? "Saving..." : isNew ? "Create Marker" : "Save Changes"}
              </button>
              <button
                onClick={() => { setEditing(null); setIsNew(false); }}
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
                <button
                  onClick={() => startEdit(m)}
                  className="p-2 hover:bg-surface-container rounded-full text-primary"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
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
