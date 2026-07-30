"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CircularRoute,
  TrailSection,
  getAccessibilityGradeLabel,
  getDifficultyLabel,
} from "@/data/types";

const GRADE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  "for-all": { bg: "#e8f5e9", text: "#1b5e20", icon: "accessible" },
  "for-many": { bg: "#fff8e1", text: "#8d6e00", icon: "accessible" },
  "for-some": { bg: "#fff3e0", text: "#a35a00", icon: "accessible" },
  ungraded: { bg: "#f0efe9", text: "#5e5e5e", icon: "help" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#27AE60",
  moderate: "#E67E22",
  challenging: "#C0392B",
};

const DISTANCE_BANDS = [
  { id: "short", label: "Under 3 mi", test: (d: number) => d < 3 },
  { id: "medium", label: "3–5 mi", test: (d: number) => d >= 3 && d < 5 },
  { id: "long", label: "5–8 mi", test: (d: number) => d >= 5 && d < 8 },
  { id: "epic", label: "8 mi+", test: (d: number) => d >= 8 },
];

const DIFFICULTIES = ["easy", "moderate", "challenging"] as const;

const SECTIONS: { id: TrailSection; label: string }[] = [
  { id: "north", label: "North" },
  { id: "middle", label: "Middle" },
  { id: "south", label: "South" },
];

type SortKey = "north-south" | "nearest" | "shortest" | "longest";

function milesBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = 3958.8;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function Chip({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
        active
          ? "bg-primary text-on-primary"
          : "bg-surface-container text-secondary hover:bg-surface-container-high"
      }`}
    >
      {icon && <span className="material-symbols-outlined text-[13px]">{icon}</span>}
      {children}
    </button>
  );
}

export default function RoutesList({ routes }: { routes: CircularRoute[] }) {
  const [query, setQuery] = useState("");
  const [bands, setBands] = useState<Set<string>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<Set<string>>(new Set());
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [mappedOnly, setMappedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("north-south");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locState, setLocState] = useState<"idle" | "loading" | "denied">("idle");

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  function findNearMe() {
    if (userLoc) {
      setUserLoc(null);
      setLocState("idle");
      if (sort === "nearest") setSort("north-south");
      return;
    }
    if (!navigator.geolocation) {
      setLocState("denied");
      return;
    }
    setLocState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocState("idle");
        setSort("nearest");
      },
      () => setLocState("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const activeFilterCount =
    bands.size +
    difficulties.size +
    sections.size +
    (accessibleOnly ? 1 : 0) +
    (mappedOnly ? 1 : 0) +
    (query.trim() ? 1 : 0);

  function clearAll() {
    setQuery("");
    setBands(new Set());
    setDifficulties(new Set());
    setSections(new Set());
    setAccessibleOnly(false);
    setMappedOnly(false);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withDistance = routes.map((r) => ({
      route: r,
      away: userLoc ? milesBetween(userLoc.lat, userLoc.lng, r.latitude, r.longitude) : null,
    }));

    const filtered = withDistance.filter(({ route: r }) => {
      if (q) {
        const hay = `${r.name} ${r.area} ${r.startLocation} ${r.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (bands.size > 0) {
        const match = DISTANCE_BANDS.some((b) => bands.has(b.id) && b.test(r.distanceMiles));
        if (!match) return false;
      }
      if (difficulties.size > 0 && !difficulties.has(r.difficulty)) return false;
      if (sections.size > 0 && !sections.has(r.section)) return false;
      if (accessibleOnly && (!r.accessibility || r.accessibility.grade === "ungraded")) return false;
      if (mappedOnly && !r.geometryFile) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === "nearest" && userLoc) {
      sorted.sort((a, b) => (a.away ?? Infinity) - (b.away ?? Infinity));
    } else if (sort === "shortest") {
      sorted.sort((a, b) => a.route.distanceMiles - b.route.distanceMiles);
    } else if (sort === "longest") {
      sorted.sort((a, b) => b.route.distanceMiles - a.route.distanceMiles);
    } else {
      sorted.sort((a, b) => b.route.latitude - a.route.latitude);
    }
    return sorted;
  }, [routes, query, bands, difficulties, sections, accessibleOnly, mappedOnly, sort, userLoc]);

  const accessibleCount = routes.filter(
    (r) => r.accessibility && r.accessibility.grade !== "ungraded"
  ).length;
  const mappedCount = routes.filter((r) => r.geometryFile).length;

  return (
    <div>
      {/* Search + near me */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg pointer-events-none">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a town, walk or feature — try “Winchcombe” or “hillfort”"
            className="w-full pl-10 pr-3 py-3 rounded-full bg-surface-container border-none text-sm text-on-surface placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={findNearMe}
          disabled={locState === "loading"}
          className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-full text-xs font-bold transition-all active:scale-95 flex-shrink-0 ${
            userLoc
              ? "bg-blue-500 text-white"
              : "bg-surface-container text-on-surface hover:bg-surface-container-high"
          } ${locState === "loading" ? "opacity-60" : ""}`}
        >
          <span className="material-symbols-outlined text-sm">
            {locState === "loading" ? "progress_activity" : "near_me"}
          </span>
          {userLoc ? "Near me: on" : "Near me"}
        </button>
      </div>

      {locState === "denied" && (
        <p className="text-[11px] text-secondary mb-3 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">info</span>
          Couldn&apos;t get your location — search for a town instead.
        </p>
      )}

      {/* Filter chips */}
      <div className="space-y-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-bold text-secondary/70 uppercase tracking-[0.12em] w-14">Length</span>
          {DISTANCE_BANDS.map((b) => (
            <Chip key={b.id} active={bands.has(b.id)} onClick={() => toggle(bands, setBands, b.id)}>
              {b.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-bold text-secondary/70 uppercase tracking-[0.12em] w-14">Effort</span>
          {DIFFICULTIES.map((d) => (
            <Chip key={d} active={difficulties.has(d)} onClick={() => toggle(difficulties, setDifficulties, d)}>
              {getDifficultyLabel(d)}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-bold text-secondary/70 uppercase tracking-[0.12em] w-14">Where</span>
          {SECTIONS.map((s) => (
            <Chip key={s.id} active={sections.has(s.id)} onClick={() => toggle(sections, setSections, s.id)}>
              {s.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-bold text-secondary/70 uppercase tracking-[0.12em] w-14">Only</span>
          <Chip active={accessibleOnly} onClick={() => setAccessibleOnly(!accessibleOnly)} icon="accessible">
            Graded access ({accessibleCount})
          </Chip>
          <Chip active={mappedOnly} onClick={() => setMappedOnly(!mappedOnly)} icon="map">
            With route map ({mappedCount})
          </Chip>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-outline-variant/15">
        <p className="text-xs text-secondary">
          <span className="font-bold text-on-surface">{visible.length}</span>
          {visible.length !== routes.length && <> of {routes.length}</>} routes
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="ml-2 text-primary font-bold hover:underline">
              Clear all
            </button>
          )}
        </p>
        <label className="flex items-center gap-1.5 text-[11px] text-secondary">
          <span className="hidden sm:inline">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-surface-container rounded-full px-3 py-1.5 text-[11px] font-bold text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="north-south">North → south</option>
            {userLoc && <option value="nearest">Nearest to me</option>}
            <option value="shortest">Shortest first</option>
            <option value="longest">Longest first</option>
          </select>
        </label>
      </div>

      {/* Route cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map(({ route, away }) => {
          const grade = route.accessibility?.grade;
          const gradeStyle = grade ? GRADE_STYLES[grade] : null;
          return (
            <Link
              key={route.id}
              href={`/routes/${route.slug}`}
              className="bg-surface-container-lowest rounded-md p-5 shadow-ambient hover:shadow-lg transition-all active:scale-[0.98] flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-headline font-bold text-base text-on-surface leading-tight">
                    {route.name}
                  </h3>
                  <p className="text-xs text-secondary mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {route.startLocation}
                  </p>
                </div>
                <span
                  className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${DIFFICULTY_COLORS[route.difficulty]}18`,
                    color: DIFFICULTY_COLORS[route.difficulty],
                  }}
                >
                  {getDifficultyLabel(route.difficulty)}
                </span>
              </div>

              <p className="text-xs text-secondary leading-snug line-clamp-2">{route.description}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant mt-auto">
                <span className="flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-sm">route</span>
                  {route.distanceMiles} mi
                </span>
                {route.ascentM != null && (
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-sm">terrain</span>
                    {route.ascentM} m
                  </span>
                )}
                {route.estimatedTime && (
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {route.estimatedTime}
                  </span>
                )}
                {route.poiIds.length > 0 && (
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-sm">pin_drop</span>
                    {route.poiIds.length} places
                  </span>
                )}
                {route.geometryFile && (
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <span className="material-symbols-outlined text-sm">map</span>
                    Route map
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {away != null && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                    <span className="material-symbols-outlined text-[13px]">near_me</span>
                    {away < 10 ? away.toFixed(1) : Math.round(away)} mi away
                  </span>
                )}
                {gradeStyle && grade && (
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-lg"
                    style={{ backgroundColor: gradeStyle.bg, color: gradeStyle.text }}
                  >
                    <span className="material-symbols-outlined text-sm">{gradeStyle.icon}</span>
                    {getAccessibilityGradeLabel(grade)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-secondary/50 text-4xl">search_off</span>
          <p className="text-sm text-secondary mt-2">No routes match those filters.</p>
          <button onClick={clearAll} className="text-xs font-bold text-primary mt-2 hover:underline">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
