"use client";

import { useState, useEffect } from "react";

interface BusinessData {
  id: string;
  name: string;
  type: string;
  description: string;
  offer: string | null;
  offerExpiry: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string | null;
  openingHours: string;
  distanceFromTrail_miles: number;
  imageUrl: string;
  isSponsor: boolean;
  markerIds: string[];
}

const BIZ_TYPES = ["pub", "cafe", "shop", "accommodation", "transport", "gear", "spa"];

const emptyBusiness = (markerId: string): BusinessData => ({
  id: "",
  name: "",
  type: "pub",
  description: "",
  offer: null,
  offerExpiry: null,
  address: "",
  latitude: 0,
  longitude: 0,
  phone: "",
  website: null,
  openingHours: "",
  distanceFromTrail_miles: 0,
  imageUrl: "",
  isSponsor: false,
  markerIds: [markerId],
});

export default function BusinessesEditor({ markerId }: { markerId: string }) {
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [editing, setEditing] = useState<BusinessData | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((all: BusinessData[]) =>
        setBusinesses(all.filter((b) => b.markerIds.includes(markerId)))
      );
  }, [markerId]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setMessage("");

    const method = isNew ? "POST" : "PUT";
    const res = await fetch("/api/businesses", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business: editing }),
    });

    if (res.ok) {
      setMessage(isNew ? "Business created" : "Business updated");
      setEditing(null);
      const all = await fetch("/api/businesses").then((r) => r.json());
      setBusinesses(all.filter((b: BusinessData) => b.markerIds.includes(markerId)));
    } else {
      const err = await res.json();
      setMessage(`Error: ${err.error}`);
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 2000);
  }

  async function remove(id: string) {
    if (!confirm("Delete this business?")) return;
    const res = await fetch(`/api/businesses?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setBusinesses(businesses.filter((b) => b.id !== id));
      setMessage("Business deleted");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  return (
    <section className="bg-surface rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline font-bold text-primary text-lg">
          Businesses ({businesses.length})
        </h2>
        <button
          onClick={() => { setEditing(emptyBusiness(markerId)); setIsNew(true); }}
          className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-sm">add</span> Add Business
        </button>
      </div>

      {message && (
        <p className="text-xs font-bold text-primary mb-3">{message}</p>
      )}

      {!editing && businesses.map((b) => (
        <div key={b.id} className="flex items-start justify-between p-3 bg-surface-container-low rounded-lg mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{b.name}</p>
            <p className="text-xs text-on-surface-variant capitalize">
              {b.type} · {b.isSponsor ? "Sponsor" : "Listing"}
              {b.offer ? ` · ${b.offer.slice(0, 40)}...` : ""}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => { setEditing({ ...b }); setIsNew(false); }} className="p-1.5 hover:bg-surface-container rounded-full text-primary">
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button onClick={() => remove(b.id)} className="p-1.5 hover:bg-error-container rounded-full text-error">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      ))}

      {!editing && businesses.length === 0 && (
        <p className="text-sm text-on-surface-variant italic">No businesses linked to this marker</p>
      )}

      {editing && (
        <div className="space-y-3 border-t border-outline-variant/10 pt-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Business name" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize">
              {BIZ_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={editing.offer || ""} onChange={(e) => setEditing({ ...editing, offer: e.target.value || null })} placeholder="Offer (e.g. 10% off for walkers)" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="date" value={editing.offerExpiry || ""} onChange={(e) => setEditing({ ...editing, offerExpiry: e.target.value || null })} className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} placeholder="Address" className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="number" step="0.000001" value={editing.latitude} onChange={(e) => setEditing({ ...editing, latitude: parseFloat(e.target.value) || 0 })} placeholder="Latitude" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="number" step="0.000001" value={editing.longitude} onChange={(e) => setEditing({ ...editing, longitude: parseFloat(e.target.value) || 0 })} placeholder="Longitude" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="number" step="0.1" value={editing.distanceFromTrail_miles} onChange={(e) => setEditing({ ...editing, distanceFromTrail_miles: parseFloat(e.target.value) || 0 })} placeholder="Distance (miles)" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="Phone" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={editing.website || ""} onChange={(e) => setEditing({ ...editing, website: e.target.value || null })} placeholder="Website URL" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={editing.openingHours} onChange={(e) => setEditing({ ...editing, openingHours: e.target.value })} placeholder="Opening hours" className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.isSponsor} onChange={(e) => setEditing({ ...editing, isSponsor: e.target.checked })} className="rounded" />
              <span className="text-sm font-bold">Sponsor</span>
            </label>
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
