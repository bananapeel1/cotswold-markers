"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CoordPickerMap from "@/components/admin/CoordPickerMap";
import RouteMap from "@/components/RouteMap";
import RouteElevation from "@/components/RouteElevation";
import type {
  AccessibilityGrade,
  CircularRoute,
  ElevationPoint,
  TrailSection,
} from "@/data/types";
import { getAccessibilityGradeLabel, getSectionLabel } from "@/data/types";

const DIFFICULTIES: CircularRoute["difficulty"][] = ["easy", "moderate", "challenging"];
const SECTIONS: TrailSection[] = ["north", "middle", "south"];
const GRADES: AccessibilityGrade[] = ["for-all", "for-many", "for-some", "ungraded"];

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UploadResult {
  lengthMiles: number;
  warnings: string[];
  profile: ElevationPoint[] | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const emptyRoute = (): CircularRoute => ({
  id: "",
  slug: "",
  name: "",
  description: "",
  startLocation: "",
  latitude: 0,
  longitude: 0,
  nearestMarkerIds: [],
  distanceMiles: 0,
  ascentM: null,
  estimatedTime: null,
  difficulty: "moderate",
  accessibility: null,
  officialUrl: "",
  gpxUrl: null,
  pdfUrl: null,
  geometryFile: null,
  geometryUrl: null,
  poiIds: [],
  source: "",
  section: "middle",
  area: "",
});

export default function AdminRouteEditPage() {
  const { routeId } = useParams<{ routeId: string }>();
  const router = useRouter();
  const isNew = routeId === "new";

  const [route, setRoute] = useState<CircularRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[] | null>(null);
  const slugEdited = useRef(false);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recomputing, setRecomputing] = useState(false);
  const [recomputeMsg, setRecomputeMsg] = useState<string | null>(null);

  useEffect(() => {
    if (routeId === "new") {
      setRoute(emptyRoute());
      setLoading(false);
      return;
    }
    fetch("/api/routes")
      .then((r) => r.json())
      .then((data: { routes: CircularRoute[] }) => {
        const found = (data.routes ?? []).find((r) => r.id === routeId);
        if (found) setRoute(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [routeId]);

  function update(patch: Partial<CircularRoute>) {
    setRoute((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateName(name: string) {
    if (!route) return;
    // Auto-suggest the slug from the name until the slug is edited directly
    if (isNew && !slugEdited.current) {
      setRoute({ ...route, name, slug: slugify(name) });
    } else {
      setRoute({ ...route, name });
    }
  }

  async function save() {
    if (!route) return;
    setStatus("saving");
    setErrorMsg(null);
    setIssues(null);

    const res = await fetch("/api/routes", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      if (data.route) setRoute(data.route);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
      if (isNew && data.route?.id) {
        router.replace(`/admin/routes/${data.route.id}`);
      }
      return;
    }

    setIssues(Array.isArray(data.issues) ? data.issues : null);
    setErrorMsg(data.error || "Save failed — please try again.");
    setStatus("error");
    setTimeout(() => setStatus("idle"), 2000);
  }

  async function remove() {
    if (!route) return;
    if (!confirm(`Delete "${route.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/routes?id=${encodeURIComponent(route.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/routes");
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || "Delete failed — please try again.");
    }
  }

  async function uploadGeometry(file: File) {
    if (!route) return;
    setUploading(true);
    setUploadErrors(null);
    setUploadResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("routeId", route.id);

    const res = await fetch("/api/admin/routes/geometry", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setUploadResult({
        lengthMiles: data.lengthMiles,
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
        profile: Array.isArray(data.profile) ? data.profile : null,
      });
      // The server already saved these fields — mirror them locally
      update({ geometryUrl: data.geometryUrl, geometrySource: "admin-upload" });
    } else {
      setUploadErrors(
        Array.isArray(data.errors) ? data.errors : [data.error || "Upload failed"]
      );
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function recomputePois() {
    if (!route) return;
    setRecomputing(true);
    setRecomputeMsg(null);
    const res = await fetch("/api/admin/routes/recompute-pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeId: route.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      update({ poiIds: Array.isArray(data.poiIds) ? data.poiIds : [] });
      setRecomputeMsg(`Linked ${data.count} POIs within ~250m of the route line.`);
    } else {
      setRecomputeMsg(`Error: ${data.error || "Recompute failed"}`);
    }
    setRecomputing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <p className="text-error font-bold">Walk not found</p>
      </div>
    );
  }

  const geometrySource = route.geometryUrl ?? route.geometryFile ?? null;

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/routes" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg truncate">
              {isNew ? "New Walk" : `Edit: ${route.name}`}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/routes"
              className="text-sm hover:underline opacity-80"
            >
              Cancel
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

      {(errorMsg || issues) && (
        <div className="bg-error-container text-on-error-container text-sm font-medium px-6 py-3">
          <div className="max-w-3xl mx-auto">
            {errorMsg && <p className="font-bold">{errorMsg}</p>}
            {issues && (
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Basics */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">Basics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" value={route.name} onChange={updateName} className="sm:col-span-2" />
            <Field
              label="Slug"
              value={route.slug}
              onChange={(v) => {
                slugEdited.current = true;
                update({ slug: v });
              }}
              mono
            />
            <Field label="Area (start hub)" value={route.area} onChange={(v) => update({ area: v })} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                Description
              </label>
              <textarea
                value={route.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <Field
              label="Start location"
              value={route.startLocation}
              onChange={(v) => update({ startLocation: v })}
              className="sm:col-span-2"
            />
            <Field
              label="Source (publishing body)"
              value={route.source}
              onChange={(v) => update({ source: v })}
            />
            <Field
              label="Official URL"
              value={route.officialUrl}
              onChange={(v) => update({ officialUrl: v })}
              mono
            />
            <Field
              label="GPX URL (official download)"
              value={route.gpxUrl ?? ""}
              onChange={(v) => update({ gpxUrl: v || null })}
              mono
            />
            <Field
              label="PDF URL (route guide)"
              value={route.pdfUrl ?? ""}
              onChange={(v) => update({ pdfUrl: v || null })}
              mono
            />
            <Field
              label="Estimated time"
              value={route.estimatedTime ?? ""}
              onChange={(v) => update({ estimatedTime: v || null })}
            />
            <NumberField
              label="Distance (miles)"
              value={route.distanceMiles}
              step={0.1}
              onChange={(v) => update({ distanceMiles: v })}
            />
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                Ascent (m) — blank if unknown
              </label>
              <input
                type="number"
                step={1}
                value={route.ascentM ?? ""}
                onChange={(e) =>
                  update({
                    ascentM:
                      e.target.value === "" ? null : parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                Difficulty
              </label>
              <select
                value={route.difficulty}
                onChange={(e) =>
                  update({ difficulty: e.target.value as CircularRoute["difficulty"] })
                }
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                Trail section
              </label>
              <select
                value={route.section}
                onChange={(e) => update({ section: e.target.value as TrailSection })}
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {getSectionLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Start point */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Start Point
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <NumberField
              label="Latitude"
              value={route.latitude}
              step={0.000001}
              onChange={(v) => update({ latitude: v })}
              mono
            />
            <NumberField
              label="Longitude"
              value={route.longitude}
              step={0.000001}
              onChange={(v) => update({ longitude: v })}
              mono
            />
          </div>
          <CoordPickerMap
            lat={route.latitude}
            lng={route.longitude}
            onMove={(lat, lng) => update({ latitude: lat, longitude: lng })}
          />
        </section>

        {/* Accessibility */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Accessibility
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() =>
                update({
                  accessibility: route.accessibility
                    ? null
                    : {
                        grade: "ungraded",
                        summary: "",
                        source: "",
                        sourceUrl: "",
                        lastVerified: "",
                      },
                })
              }
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                route.accessibility
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "bg-surface-container-highest text-on-surface-variant"
              }`}
            >
              {route.accessibility ? "Graded" : "Not graded"}
            </button>
            <p className="text-xs text-on-surface-variant">
              Gradings are never self-certified — only record a published grading
              with its source.
            </p>
          </div>
          {route.accessibility && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                  Grade
                </label>
                <select
                  value={route.accessibility.grade}
                  onChange={(e) =>
                    update({
                      accessibility: {
                        ...route.accessibility!,
                        grade: e.target.value as AccessibilityGrade,
                      },
                    })
                  }
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {getAccessibilityGradeLabel(g)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                  Last verified
                </label>
                <input
                  type="date"
                  value={route.accessibility.lastVerified}
                  onChange={(e) =>
                    update({
                      accessibility: {
                        ...route.accessibility!,
                        lastVerified: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">
                  Summary (the publisher&apos;s own wording)
                </label>
                <textarea
                  value={route.accessibility.summary}
                  onChange={(e) =>
                    update({
                      accessibility: {
                        ...route.accessibility!,
                        summary: e.target.value,
                      },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <Field
                label="Source (publishing body)"
                value={route.accessibility.source}
                onChange={(v) =>
                  update({ accessibility: { ...route.accessibility!, source: v } })
                }
              />
              <Field
                label="Source URL"
                value={route.accessibility.sourceUrl}
                onChange={(v) =>
                  update({ accessibility: { ...route.accessibility!, sourceUrl: v } })
                }
                mono
              />
            </div>
          )}
        </section>

        {/* Linked markers / POIs */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Linked Markers &amp; POIs
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                Nearest Marker IDs (comma-separated)
              </label>
              <input
                value={route.nearestMarkerIds.join(", ")}
                onChange={(e) =>
                  update({
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
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">
                POI IDs (comma-separated)
              </label>
              <input
                value={route.poiIds.join(", ")}
                onChange={(e) =>
                  update({
                    poiIds: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="poi-eight-bells, poi-campden-toilets"
                className="w-full px-4 py-3 rounded-md bg-surface-container border-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={recomputePois}
                disabled={recomputing || isNew || !geometrySource}
                className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">travel_explore</span>
                {recomputing ? "Recomputing..." : "Recompute nearby POIs from geometry"}
              </button>
              {recomputeMsg && (
                <p
                  className={`text-xs font-bold ${
                    recomputeMsg.startsWith("Error") ? "text-error" : "text-primary"
                  }`}
                >
                  {recomputeMsg}
                </p>
              )}
            </div>
            {(isNew || !geometrySource) && (
              <p className="text-xs text-on-surface-variant">
                Recompute needs a saved walk with geometry.
              </p>
            )}
          </div>
        </section>

        {/* Geometry */}
        <section className="bg-surface rounded-2xl p-6">
          <h2 className="font-headline font-bold text-primary text-lg mb-4">
            Geometry
          </h2>
          <div className="space-y-4">
            <p className="text-sm">
              {route.geometrySource === "admin-upload" && route.geometryUrl ? (
                <>
                  Uploaded:{" "}
                  <a
                    href={route.geometryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary break-all"
                  >
                    {route.geometryUrl}
                  </a>
                </>
              ) : route.geometryFile ? (
                <>
                  Official file:{" "}
                  <code className="text-xs bg-surface-container px-2 py-1 rounded-md font-mono">
                    {route.geometryFile}
                  </code>
                </>
              ) : (
                <span className="text-on-surface-variant italic">None</span>
              )}
            </p>

            {isNew ? (
              <p className="text-xs text-on-surface-variant">
                Save the walk first, then upload a GPX or GeoJSON track.
              </p>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gpx,.geojson,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadGeometry(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-on-primary text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">upload</span>
                  {uploading ? "Uploading..." : "Upload GPX / GeoJSON"}
                </button>
                <p className="text-xs text-on-surface-variant mt-2">
                  The track must be a closed loop inside the Cotswold Way corridor,
                  within 25% of the published distance.
                </p>
              </div>
            )}

            {uploadErrors && (
              <div className="bg-error-container text-on-error-container rounded-2xl p-4 text-sm font-medium">
                <p className="font-bold mb-1">Geometry rejected:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {uploadErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {uploadResult && (
              <div className="bg-tertiary-container text-on-tertiary-container rounded-2xl p-4 text-sm font-medium">
                <p className="font-bold">
                  Geometry saved — measured length {uploadResult.lengthMiles} mi.
                </p>
                {uploadResult.warnings.length > 0 && (
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    {uploadResult.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {geometrySource && (
              <div
                className="rounded-lg overflow-hidden border border-outline-variant/20"
                style={{ height: 320 }}
              >
                <RouteMap
                  geometryFile={geometrySource}
                  startLat={route.latitude}
                  startLng={route.longitude}
                  pois={[]}
                />
              </div>
            )}

            {uploadResult?.profile && uploadResult.profile.length >= 2 && (
              <RouteElevation points={uploadResult.profile} ascentM={route.ascentM} />
            )}
          </div>
        </section>

        {/* Save / Delete at bottom */}
        <div className="flex justify-between items-center pb-8">
          {!isNew ? (
            <button
              onClick={remove}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold text-error hover:bg-error-container transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Delete walk
            </button>
          ) : (
            <span />
          )}
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
              : isNew
              ? "Create Walk"
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
