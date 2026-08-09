"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface CoordPickerMapProps {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
  label?: string;
  height?: number;
}

/**
 * Drag-pin coordinate picker for admin forms. Shows the Cotswold Way for
 * context; click or drag the pin to set a location (rounded to 4dp).
 */
export default function CoordPickerMap({
  lat,
  lng,
  onMove,
  label = "Map preview — click or drag pin to set location",
  height = 300,
}: CoordPickerMapProps) {
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
        {label}
      </label>
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden border border-outline-variant/20"
        style={{ height }}
      />
    </div>
  );
}
