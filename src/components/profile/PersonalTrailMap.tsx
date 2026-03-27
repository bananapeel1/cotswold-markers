"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TRAIL } from "@/lib/constants";
import { escapeHtml } from "@/lib/sanitize";

interface MarkerData {
  id: string;
  shortCode: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface PersonalTrailMapProps {
  markers: MarkerData[];
  scannedMarkerIds: string[];
}

export default function PersonalTrailMap({ markers, scannedMarkerIds }: PersonalTrailMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: TRAIL.mapStyle,
      center: TRAIL.center,
      zoom: TRAIL.zoom,
    });

    const m = map.current;

    m.on("load", async () => {
      // Trail line
      try {
        const res = await fetch("/data/cotswold-way.geojson");
        const geojson = await res.json();
        m.addSource("trail", { type: "geojson", data: geojson });
        m.addLayer({
          id: "trail-line",
          type: "line",
          source: "trail",
          paint: {
            "line-color": TRAIL.trailColor,
            "line-width": 3,
            "line-opacity": 0.6,
          },
        });
      } catch {}

      // Markers
      const scannedSet = new Set(scannedMarkerIds);

      // Add unscanned markers first (grey, behind)
      markers.forEach((marker) => {
        if (scannedSet.has(marker.id)) return;

        const el = document.createElement("div");
        el.className = "personal-marker unscanned";
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: #9e9e9e; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700; opacity: 0.5;
          border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        `;
        el.textContent = marker.shortCode.replace("CW", "");

        new mapboxgl.Marker({ element: el })
          .setLngLat([marker.longitude, marker.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 15, closeButton: false })
              .setHTML(`<div style="padding:4px 8px;font-size:12px;font-weight:600;color:#666">${escapeHtml(marker.name)}<br><span style="font-size:10px;font-weight:400">Not yet scanned</span></div>`)
          )
          .addTo(m);
      });

      // Add scanned markers on top (green)
      markers.forEach((marker) => {
        if (!scannedSet.has(marker.id)) return;

        const el = document.createElement("div");
        el.className = "personal-marker scanned";
        el.style.cssText = `
          width: 32px; height: 32px; border-radius: 50%;
          background: #173124; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        `;
        el.textContent = marker.shortCode.replace("CW", "");

        new mapboxgl.Marker({ element: el })
          .setLngLat([marker.longitude, marker.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 18, closeButton: false })
              .setHTML(`<div style="padding:6px 10px;font-size:13px;font-weight:700;color:#173124">${escapeHtml(marker.name)}<br><span style="font-size:10px;font-weight:400;color:#173124aa">✓ Scanned</span></div>`)
          )
          .addTo(m);
      });
    });

    return () => {
      m.remove();
      map.current = null;
    };
  }, [markers, scannedMarkerIds]);

  const scannedCount = scannedMarkerIds.length;
  const totalCount = markers.length;

  return (
    <div className="bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden">
      <div className="flex items-center gap-2 p-5 pb-3">
        <span className="material-symbols-outlined text-primary text-base">map</span>
        <h2 className="font-headline font-bold text-primary text-lg">My Trail Map</h2>
        <span className="text-xs text-secondary ml-auto">{scannedCount}/{totalCount} visited</span>
      </div>
      <div ref={mapContainer} className="h-[400px] w-full" />
    </div>
  );
}
