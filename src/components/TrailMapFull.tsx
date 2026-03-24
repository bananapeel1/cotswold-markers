"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TRAIL } from "@/lib/constants";
import type { Marker } from "@/data/types";

export default function TrailMapFull({ markers }: { markers: Marker[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

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
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.current.on("load", () => {
      const m = map.current!;

      // Trail line
      m.addSource("trail", {
        type: "geojson",
        data: "/data/cotswold-way.geojson",
      });
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

      // Markers
      markers.forEach((marker) => {
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

        const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(`
          <div style="font-family:Manrope,sans-serif;max-width:200px">
            <strong style="font-size:14px">${marker.name}</strong>
            <p style="font-size:12px;color:#665d4e;margin:4px 0 0">
              Mile ${marker.trailMile} · ${marker.elevation_m}m
            </p>
            <a href="/m/${marker.shortCode}" style="font-size:12px;color:#541600;text-decoration:none;font-weight:600;display:inline-block;margin-top:6px">
              Open marker page →
            </a>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([marker.longitude, marker.latitude])
          .setPopup(popup)
          .addTo(m);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [markers]);

  return (
    <div ref={mapContainer} className="w-full h-full" style={{ minHeight: "100vh" }} />
  );
}
