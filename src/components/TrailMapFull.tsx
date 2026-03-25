"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TRAIL } from "@/lib/constants";
import type { Marker } from "@/data/types";

const SATELLITE_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

export default function TrailMapFull({ markers }: { markers: Marker[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: TRAIL.mapStyle,
      center: TRAIL.center,
      zoom: TRAIL.zoom,
      pitch: 20,
      attributionControl: false,
    });

    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.current.on("load", () => {
      addTrailAndMarkers(map.current!, markers);
    });

    return () => {
      map.current?.remove();
    };
  }, [markers]);

  function addTrailAndMarkers(m: mapboxgl.Map, mkrs: Marker[]) {
    // Trail line
    if (!m.getSource("trail")) {
      m.addSource("trail", {
        type: "geojson",
        data: "/data/cotswold-way.geojson",
      });
    }
    if (!m.getLayer("trail-line")) {
      m.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: {
          "line-color": TRAIL.trailColor,
          "line-width": 4,
          "line-opacity": 0.7,
        },
      });
    }

    // Markers
    mkrs.forEach((marker) => {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 28px; height: 28px;
        background: ${TRAIL.markerColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; color: white; font-weight: 700;
        font-family: Manrope, sans-serif;
      `;
      el.textContent = marker.shortCode.replace("CW", "");

      const facilityEmojis: Record<string, string> = {
        pub: "🍺", cafe: "☕", water: "💧", toilets: "🚻", shop: "🛒",
        parking: "🅿️", bus: "🚌", campsite: "⛺", accommodation: "🛏️",
      };
      const facilityHtml = marker.facilities.length > 0
        ? `<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">${marker.facilities.slice(0, 5).map(f =>
            `<span style="font-size:11px;background:#f3f0eb;padding:2px 6px;border-radius:99px">${facilityEmojis[f] || "📍"} ${f}</span>`
          ).join("")}</div>`
        : "";

      const statusDot = marker.isActive
        ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#2d6a2e;margin-right:4px;vertical-align:middle"></span>`
        : `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#b3261e;margin-right:4px;vertical-align:middle"></span>`;

      const popup = new mapboxgl.Popup({ offset: 18, maxWidth: "260px" }).setHTML(`
        <div style="font-family:Manrope,sans-serif;padding:2px 0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="background:#173124;color:white;font-size:9px;font-weight:800;padding:2px 6px;border-radius:99px;letter-spacing:0.5px">${marker.shortCode}</span>
            <span style="font-size:10px;color:#665d4e">${statusDot}${marker.isActive ? "Active" : "Inactive"}</span>
          </div>
          <strong style="font-size:15px;display:block;margin:4px 0 2px;color:#173124">${marker.name}</strong>
          ${marker.subtitle ? `<p style="font-size:11px;color:#8a7f6f;margin:0 0 4px;font-style:italic">${marker.subtitle}</p>` : ""}
          <p style="font-size:11px;color:#665d4e;margin:0">
            Mile ${marker.trailMile} · ${marker.elevation_m}m · Day ${marker.dayOnTrail}
          </p>
          ${facilityHtml}
          <a href="/m/${marker.shortCode}" style="font-size:12px;color:white;background:#173124;text-decoration:none;font-weight:600;display:block;text-align:center;margin-top:10px;padding:8px 12px;border-radius:99px">
            View Marker
          </a>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([marker.longitude, marker.latitude])
        .setPopup(popup)
        .addTo(m);
    });
  }

  function toggleSatellite() {
    const m = map.current;
    if (!m) return;
    const currentStyle = m.getStyle()?.name;
    const isSatellite = currentStyle?.toLowerCase().includes("satellite");
    m.setStyle(isSatellite ? TRAIL.mapStyle : SATELLITE_STYLE);
    m.once("style.load", () => {
      addTrailAndMarkers(m, markers);
    });
  }

  function locateUser() {
    if (!navigator.geolocation || !map.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.current?.flyTo({ center: [longitude, latitude], zoom: 14 });

        // Remove old marker
        userMarker.current?.remove();

        // Add user location marker
        const el = document.createElement("div");
        el.style.cssText =
          "width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);";
        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current!);
      },
      () => {
        alert("Unable to get your location. Please enable location services.");
      },
      { enableHighAccuracy: true }
    );
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: "100vh" }}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map controls — right side, unified column */}
      <div className="absolute right-4 top-24 flex flex-col gap-2 z-10">
        <button
          onClick={() => map.current?.zoomIn()}
          className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-on-surface active:scale-90 transition-all border border-outline-variant/20"
          aria-label="Zoom in"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
        <button
          onClick={() => map.current?.zoomOut()}
          className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-on-surface active:scale-90 transition-all border border-outline-variant/20"
          aria-label="Zoom out"
        >
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        <div className="h-1" />
        <button
          onClick={locateUser}
          className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-primary active:scale-90 transition-all border border-outline-variant/20"
          aria-label="My location"
        >
          <span className="material-symbols-outlined text-lg">my_location</span>
        </button>
        <button
          onClick={toggleSatellite}
          className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-primary active:scale-90 transition-all border border-outline-variant/20"
          aria-label="Toggle satellite view"
        >
          <span className="material-symbols-outlined text-lg">layers</span>
        </button>
      </div>
    </div>
  );
}
