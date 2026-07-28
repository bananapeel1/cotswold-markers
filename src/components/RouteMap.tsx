"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TRAIL } from "@/lib/constants";
import { getPOIEmoji } from "@/data/types";
import type { POI } from "@/data/types";

interface RouteMapProps {
  geometryFile: string | null;
  startLat: number;
  startLng: number;
  pois: POI[];
}

export default function RouteMap({ geometryFile, startLat, startLng, pois }: RouteMapProps) {
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
      center: [startLng, startLat],
      zoom: 12.5,
      attributionControl: false,
    });
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.current.on("load", () => {
      const m = map.current!;

      // Cotswold Way for context
      m.addSource("trail", { type: "geojson", data: "/data/cotswold-way.geojson" });
      m.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: { "line-color": TRAIL.trailColor, "line-width": 3, "line-opacity": 0.45 },
      });

      // The circular route itself
      if (geometryFile) {
        m.addSource("route", { type: "geojson", data: geometryFile });
        m.addLayer({
          id: "route-casing",
          type: "line",
          source: "route",
          paint: { "line-color": "#ffffff", "line-width": 7, "line-opacity": 0.9 },
        });
        m.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: { "line-color": "#8E44AD", "line-width": 4, "line-opacity": 0.95 },
        });

        // Fit map to route bounds once loaded
        fetch(geometryFile)
          .then((r) => r.json())
          .then((gj) => {
            const coords: [number, number][] = [];
            const collect = (geom: { type: string; coordinates: unknown }) => {
              if (geom.type === "LineString") {
                coords.push(...(geom.coordinates as [number, number][]));
              } else if (geom.type === "MultiLineString") {
                (geom.coordinates as [number, number][][]).forEach((line) => coords.push(...line));
              }
            };
            if (gj.type === "FeatureCollection") {
              gj.features.forEach((f: { geometry: { type: string; coordinates: unknown } }) => collect(f.geometry));
            } else if (gj.type === "Feature") {
              collect(gj.geometry);
            } else {
              collect(gj);
            }
            if (coords.length > 1) {
              const bounds = coords.reduce(
                (b, c) => b.extend(c as [number, number]),
                new mapboxgl.LngLatBounds(coords[0], coords[0])
              );
              m.fitBounds(bounds, { padding: 48, duration: 0 });
            }
          })
          .catch(() => {});
      }

      // Start marker
      const startEl = document.createElement("div");
      startEl.style.cssText =
        "width:26px;height:26px;background:#154212;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;";
      startEl.textContent = "▶";
      new mapboxgl.Marker(startEl).setLngLat([startLng, startLat]).addTo(m);

      // POIs along the route
      pois.forEach((poi) => {
        const el = document.createElement("div");
        el.style.cssText =
          "width:24px;height:24px;background:white;border:1.5px solid rgba(0,0,0,0.12);border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;";
        el.textContent = getPOIEmoji(poi.type);
        el.title = poi.name;
        new mapboxgl.Marker(el).setLngLat([poi.longitude, poi.latitude]).addTo(m);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [geometryFile, startLat, startLng, pois]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
