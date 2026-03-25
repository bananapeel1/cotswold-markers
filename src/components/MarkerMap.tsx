"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TRAIL } from "@/lib/constants";

interface MarkerMapProps {
  latitude: number;
  longitude: number;
  name: string;
  nextMarker?: { latitude: number; longitude: number; name: string } | null;
  prevMarker?: { latitude: number; longitude: number; name: string } | null;
}

export default function MarkerMap({
  latitude,
  longitude,
  name,
  nextMarker,
  prevMarker,
}: MarkerMapProps) {
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
      center: [longitude, latitude],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    });

    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.current.on("load", () => {
      const m = map.current!;

      // Add trail line
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
          "line-width": 3,
          "line-opacity": 0.6,
        },
      });

      // Current marker
      const el = document.createElement("div");
      el.className = "current-marker";
      el.style.cssText =
        "width:24px;height:24px;background:#154212;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);";
      new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(
            `<strong style="font-family:Manrope,sans-serif;font-size:13px">${name}</strong>`
          )
        )
        .addTo(m);

      // Next/prev markers
      [nextMarker, prevMarker].forEach((adj) => {
        if (!adj) return;
        const adjEl = document.createElement("div");
        adjEl.style.cssText =
          "width:14px;height:14px;background:#154212;border:2px solid white;border-radius:50%;opacity:0.6;";
        new mapboxgl.Marker(adjEl)
          .setLngLat([adj.longitude, adj.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 10 }).setHTML(
              `<span style="font-family:Manrope,sans-serif;font-size:12px">${adj.name}</span>`
            )
          )
          .addTo(m);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, name, nextMarker, prevMarker]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-md overflow-hidden"
    />
  );
}
