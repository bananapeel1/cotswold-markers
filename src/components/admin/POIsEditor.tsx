"use client";

import { useState, useEffect } from "react";

interface POIData {
  id: string;
  name: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  openingHours: string | null;
  nearestMarkerIds: string[];
}

const POI_TYPES = ["pub", "cafe", "water", "shop", "accommodation", "campsite", "toilets"];

const emptyPOI = (markerId: string): POIData => ({
  id: "",
  name: "",
  type: "pub",
  description: "",
  latitude: 0,
  longitude: 0,
  openingHours: null,
  nearestMarkerIds: [markerId],
});

export default function POIsEditor({ markerId }: { markerId: string }) {
  const [pois, setPois] = useState<POIData[]>([]);
  const [editing, setEditing] = useState<POIData | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/pois")
      .then((r) => r.json())
      .then((all: POIData[]) =>
        setPois(all.filter((p) => p.nearestMarkerIds.includes(markerId)))
      );
  }, [markerId]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setMessage("");

    const method = isNew ? "POST" : "PUT";
    const res = await fetch("/api/pois", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poi: editing }),
    });

    if (res.ok) {
      setMessage(isNew ? "POI created" : "POI updated");
      setEditing(null);
      const all = await fetch("/api/pois").then((r) => r.json());
      setPois(all.filter((p: POIData) => p.nearestMarkerIds.includes(markerId)));
    } else {
      const err = await res.json();
      setMessage(`Error: ${err.error}`);
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 2000);
  }

  async function remove(id: string) {
    if (!confirm("Delete this POI?")) return;
    const res = await fetch(`/api/pois?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setPois(pois.filter((p) => p.id !== id));
      setMessage("POI deleted");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  return (
    <section className="bg-surface rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline font-bold text-primary text-lg">
          Nearby Places ({pois.length})
        </h2>
        <button
          onClick={() => { setEditing(emptyPOI(markerId)); setIsNew(true); }}
          className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-sm">add</span> Add Place
        </button>
      </div>

      {message && (
        <p className="text-xs font-bold text-primary mb-3">{message}</p>
      )}

      {!editing && pois.map((p) => (
        <div key={p.id} className="flex items-start justify-between p-3 bg-surface-container-low rounded-lg mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{p.name}</p>
            <p className="text-xs text-on-surface-variant capitalize">{p.type} · {p.description.slice(0, 60)}{p.description.length > 60 ? "..." : ""}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => { setEditing({ ...p }); setIsNew(false); }} className="p-1.5 hover:bg-surface-container rounded-full text-primary">
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button onClick={() => remove(p.id)} className="p-1.5 hover:bg-error-container rounded-full text-error">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      ))}

      {!editing && pois.length === 0 && (
        <p className="text-sm text-on-surface-variant italic">No nearby places linked to this marker</p>
      )}

      {editing && (
        <div className="space-y-3 border-t border-outline-variant/10 pt-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize">
              {POI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description" className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="number" step="0.000001" value={editing.latitude} onChange={(e) => setEditing({ ...editing, latitude: parseFloat(e.target.value) || 0 })} placeholder="Latitude" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="number" step="0.000001" value={editing.longitude} onChange={(e) => setEditing({ ...editing, longitude: parseFloat(e.target.value) || 0 })} placeholder="Longitude" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={editing.openingHours || ""} onChange={(e) => setEditing({ ...editing, openingHours: e.target.value || null })} placeholder="Opening hours" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving || !editing.name} className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold disabled:opacity-50 active:scale-95 transition-all">
              {saving ? "Saving..." : isNew ? "Create" : "Update"}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 py-2 rounded-full text-xs font-bold text-secondary hover:bg-surface-container transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
