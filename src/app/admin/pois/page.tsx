"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface POIVerificationData {
  status: "verified" | "unverified" | "needs-recheck";
  source: string;
  sourceUrl?: string;
  lastVerified: string;
  notes?: string;
}

interface POIData {
  id: string;
  name: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  openingHours: string | null;
  nearestMarkerIds: string[];
  accessibility?: string;
  siteType?: string;
  access?: string;
  nhle?: string;
  verification?: POIVerificationData;
}

const SITE_TYPES = ["prehistoric", "roman", "medieval", "civil-war", "other"];
const TOILET_ACCESSIBILITY = ["accessible", "standard", "unknown"];
const VERIFICATION_STATUSES = ["unverified", "verified", "needs-recheck"] as const;

function verificationStatus(p: POIData): string {
  return p.verification?.status ?? "unverified";
}

const POI_TYPES = ["pub", "cafe", "water", "shop", "accommodation", "campsite", "toilets", "pharmacy", "medical", "historic"];

const emptyPOI = (): POIData => ({
  id: "",
  name: "",
  type: "pub",
  description: "",
  // Start at the trail centre — coordinates must be inside the Cotswold Way
  // corridor to save, so 0,0 would be rejected.
  latitude: 51.75,
  longitude: -2.07,
  openingHours: null,
  nearestMarkerIds: [],
});

function CoordMap({
  lat,
  lng,
  onMove,
}: {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;

    const hasCoords = lat !== 0 || lng !== 0;
    const center: [number, number] = hasCoords ? [lng, lat] : [-2.07, 51.75];
    const zoom = hasCoords ? 15 : 8.5;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center,
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("trail", {
        type: "geojson",
        data: "/data/cotswold-way.geojson",
      });
      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: { "line-color": "#173124", "line-width": 3, "line-opacity": 0.5 },
      });
    });

    const marker = new mapboxgl.Marker({ draggable: true, color: "#e53935" });
    if (hasCoords) marker.setLngLat([lng, lat]).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      onMoveRef.current(
        Math.round(pos.lat * 10000) / 10000,
        Math.round(pos.lng * 10000) / 10000
      );
    });

    map.on("click", (e) => {
      const newLat = Math.round(e.lngLat.lat * 10000) / 10000;
      const newLng = Math.round(e.lngLat.lng * 10000) / 10000;
      marker.setLngLat([newLng, newLat]).addTo(map);
      onMoveRef.current(newLat, newLng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker when lat/lng inputs change
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (lat === 0 && lng === 0) return;
    marker.setLngLat([lng, lat]).addTo(map);
    map.flyTo({ center: [lng, lat], zoom: 15, duration: 500 });
  }, [lat, lng]);

  return (
    <div>
      <label className="text-xs font-bold text-on-surface-variant block mb-1">
        Map Preview — click or drag pin to set location
      </label>
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden border border-outline-variant/20"
        style={{ height: 300 }}
      />
    </div>
  );
}

export default function POIsPage() {
  const [pois, setPois] = useState<POIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [verifFilter, setVerifFilter] = useState("all");
  const [editing, setEditing] = useState<POIData | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPois();
  }, []);

  async function fetchPois() {
    try {
      const res = await fetch("/api/pois");
      const data = await res.json();
      setPois(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }

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
      await fetchPois();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(
        `Error: ${
          Array.isArray(err.issues) ? err.issues.join(" · ") : err.error || "Save failed"
        }`
      );
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function remove(id: string) {
    if (!confirm("Delete this POI?")) return;
    const res = await fetch(`/api/pois?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setPois(pois.filter((p) => p.id !== id));
      setMessage("POI deleted");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  const filtered = pois.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    const matchesVerif =
      verifFilter === "all" || verificationStatus(p) === verifFilter;
    return matchesSearch && matchesType && matchesVerif;
  });

  const unverifiedCount = pois.filter(
    (p) => verificationStatus(p) !== "verified"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading POIs...</p>
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
            <h1 className="font-headline font-bold text-lg">POI Management</h1>
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

        {unverifiedCount > 0 && (
          <button
            onClick={() => setVerifFilter("unverified")}
            className="w-full text-left rounded-2xl p-4 text-sm bg-surface border border-outline-variant/20 hover:bg-surface-container transition-colors"
          >
            <span className="font-bold text-primary">
              {unverifiedCount} of {pois.length} places
            </span>{" "}
            <span className="text-on-surface-variant">
              are not marked as verified — tap to review them. Verification
              records who confirmed each entry (e.g. CWA ground-truthing) and
              when.
            </span>
          </button>
        )}

        {/* Filters & Add */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-3 rounded-full bg-surface border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 rounded-full bg-surface border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
          >
            <option value="all">All types</option>
            {POI_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={verifFilter}
            onChange={(e) => setVerifFilter(e.target.value)}
            className="px-4 py-3 rounded-full bg-surface border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
          >
            <option value="all">Any verification</option>
            {VERIFICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("-", " ")}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditing(emptyPOI());
              setIsNew(true);
            }}
            className="bg-primary text-on-primary px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add POI
          </button>
        </div>

        {/* Inline edit form */}
        {editing && (
          <section className="bg-surface rounded-2xl p-6">
            <h2 className="font-headline font-bold text-primary text-lg mb-4">
              {isNew ? "New POI" : `Edit: ${editing.name}`}
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Name"
                  className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                  className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
                >
                  {POI_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Description"
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  step="0.000001"
                  value={editing.latitude}
                  onChange={(e) =>
                    setEditing({ ...editing, latitude: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Latitude"
                  className="px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={editing.longitude}
                  onChange={(e) =>
                    setEditing({ ...editing, longitude: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Longitude"
                  className="px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  value={editing.openingHours || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, openingHours: e.target.value || null })
                  }
                  placeholder="Opening hours"
                  className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {editing.type === "toilets" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-1">
                      Accessible (disabled) toilet on site?
                    </label>
                    <select
                      value={editing.accessibility || ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          accessibility: e.target.value || undefined,
                        })
                      }
                      className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm capitalize focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— not set —</option>
                      {TOILET_ACCESSIBILITY.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {editing.type === "historic" && (
                <div className="space-y-3 rounded-lg bg-surface-container-low p-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    Historic site details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">
                        Site type (required)
                      </label>
                      <select
                        value={editing.siteType || ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            siteType: e.target.value || undefined,
                          })
                        }
                        className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm capitalize focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">— choose —</option>
                        {SITE_TYPES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("-", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">
                        NHLE number (Historic England list entry)
                      </label>
                      <input
                        value={editing.nhle || ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            nhle: e.target.value || undefined,
                          })
                        }
                        placeholder="e.g. 1003324"
                        className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-1">
                      Public access — be honest, walkers rely on this
                    </label>
                    <input
                      value={editing.access || ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          access: e.target.value || undefined,
                        })
                      }
                      placeholder='e.g. "Open access", "Visible from trail; no public access", "Paid attraction"'
                      className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}

              <CoordMap
                lat={editing.latitude}
                lng={editing.longitude}
                onMove={(lat, lng) =>
                  setEditing({ ...editing, latitude: lat, longitude: lng })
                }
              />
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">
                  Nearest Marker IDs (comma-separated)
                </label>
                <input
                  value={editing.nearestMarkerIds.join(", ")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      nearestMarkerIds: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="cw-01-chipping-campden, cw-02-broadway-tower"
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-3 rounded-lg bg-surface-container-low p-4">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  Verification — who confirmed this entry, and when
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={editing.verification?.status || "unverified"}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        verification: {
                          status: e.target.value as POIVerificationData["status"],
                          source: editing.verification?.source || "",
                          sourceUrl: editing.verification?.sourceUrl,
                          lastVerified:
                            editing.verification?.lastVerified ||
                            new Date().toISOString().slice(0, 10),
                          notes: editing.verification?.notes,
                        },
                      })
                    }
                    className="px-4 py-3 rounded-md bg-surface-container border-none text-sm capitalize focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {VERIFICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("-", " ")}
                      </option>
                    ))}
                  </select>
                  <input
                    value={editing.verification?.source || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        verification: {
                          status: editing.verification?.status || "unverified",
                          source: e.target.value,
                          sourceUrl: editing.verification?.sourceUrl,
                          lastVerified:
                            editing.verification?.lastVerified ||
                            new Date().toISOString().slice(0, 10),
                          notes: editing.verification?.notes,
                        },
                      })
                    }
                    placeholder="Source, e.g. CWA ground-truth, NHS.uk"
                    className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="date"
                    value={editing.verification?.lastVerified?.slice(0, 10) || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        verification: {
                          status: editing.verification?.status || "unverified",
                          source: editing.verification?.source || "",
                          sourceUrl: editing.verification?.sourceUrl,
                          lastVerified: e.target.value,
                          notes: editing.verification?.notes,
                        },
                      })
                    }
                    className="px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <input
                  value={editing.verification?.sourceUrl || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      verification: {
                        status: editing.verification?.status || "unverified",
                        source: editing.verification?.source || "",
                        sourceUrl: e.target.value || undefined,
                        lastVerified:
                          editing.verification?.lastVerified ||
                          new Date().toISOString().slice(0, 10),
                        notes: editing.verification?.notes,
                      },
                    })
                  }
                  placeholder="Source URL (optional)"
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={save}
                  disabled={saving || !editing.name}
                  className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
                >
                  {saving ? "Saving..." : isNew ? "Create" : "Update"}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-5 py-2 rounded-full text-xs font-bold text-secondary hover:bg-surface-container transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {/* POI Table */}
        <section className="bg-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container">
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs hidden sm:table-cell">
                    Nearest Marker
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs hidden sm:table-cell">
                    Hours
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-on-surface-variant text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-outline-variant/10 hover:bg-surface-container-low/50"
                  >
                    <td className="px-4 py-3 font-semibold">
                      <span className="flex items-center gap-1.5">
                        {p.name}
                        {verificationStatus(p) === "verified" && (
                          <span
                            className="material-symbols-outlined text-sm text-primary"
                            title={`Verified ${p.verification?.lastVerified || ""} — ${p.verification?.source || ""}`}
                          >
                            verified
                          </span>
                        )}
                        {verificationStatus(p) === "needs-recheck" && (
                          <span
                            className="material-symbols-outlined text-sm text-error"
                            title="Needs re-checking"
                          >
                            error
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-on-surface-variant">
                      {p.type}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-on-surface-variant hidden sm:table-cell">
                      {p.nearestMarkerIds[0] || "---"}
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant hidden sm:table-cell">
                      {p.openingHours || "---"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing({ ...p });
                            setIsNew(false);
                          }}
                          className="p-1.5 hover:bg-surface-container rounded-full text-primary"
                        >
                          <span className="material-symbols-outlined text-sm">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => remove(p.id)}
                          className="p-1.5 hover:bg-error-container rounded-full text-error"
                        >
                          <span className="material-symbols-outlined text-sm">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-on-surface-variant italic"
                    >
                      {pois.length === 0
                        ? "No POIs found"
                        : "No POIs match your filters"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-on-surface-variant text-center">
          {filtered.length} of {pois.length} POIs shown
        </p>
      </main>
    </div>
  );
}
