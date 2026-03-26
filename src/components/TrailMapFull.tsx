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

      const defaultImg = "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&q=80";
      const heroImg = marker.imageUrl || defaultImg;

      const popup = new mapboxgl.Popup({ offset: 20, maxWidth: "240px", anchor: "bottom", className: "ttp-popup" }).setHTML(`
        <style>
          .ttp-popup .mapboxgl-popup-content { padding:0; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.15); font-family:Manrope,sans-serif; }
          .ttp-popup .mapboxgl-popup-close-button { color:white; font-size:16px; right:6px; top:6px; z-index:2; background:rgba(0,0,0,0.3); width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; line-height:1; }
          .ttp-popup .mapboxgl-popup-close-button:hover { background:rgba(0,0,0,0.5); }
          .ttp-hero { position:relative; height:90px; background:url('${heroImg}') center/cover no-repeat; }
          .ttp-hero::after { content:''; position:absolute; inset:0; background:linear-gradient(to bottom, transparent 30%, rgba(23,49,36,0.5)); }
          .ttp-badge { position:absolute; bottom:8px; left:8px; z-index:1; background:white; color:#173124; font-size:10px; font-weight:800; padding:2px 7px; border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.15); }
          .ttp-body { padding:10px 12px 12px; }
          .ttp-name { font-size:14px; font-weight:700; color:#173124; margin:0 0 2px; line-height:1.2; }
          .ttp-stats { font-size:11px; color:#665d4e; margin-bottom:8px; }
          .ttp-cta { display:block; background:#173124; color:white; text-decoration:none; font-size:12px; font-weight:700; padding:8px; border-radius:8px; text-align:center; }
          .ttp-cta:hover { opacity:0.9; }
        </style>
        <div class="ttp-hero">
          <span class="ttp-badge">${marker.shortCode.replace("CW", "")}</span>
        </div>
        <div class="ttp-body">
          <p class="ttp-name">${marker.name}</p>
          <p class="ttp-stats">Mile ${marker.trailMile} · ${marker.elevation_m}m · Day ${marker.dayOnTrail}</p>
          <a class="ttp-cta" href="/m/${marker.shortCode}">View Marker →</a>
        </div>
      `);

      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat([marker.longitude, marker.latitude])
        .setPopup(popup)
        .addTo(m);

      // When popup opens, fly map so popup is visible above the bottom panel
      mapboxMarker.getElement().addEventListener("click", () => {
        const container = m.getContainer();
        const targetY = container.clientHeight * 0.3; // Position marker at 30% from top
        const point = m.project([marker.longitude, marker.latitude]);
        const offsetY = point.y - targetY;
        const center = m.unproject([point.x, point.y - offsetY]);

        m.easeTo({
          center: [center.lng, center.lat],
          duration: 500,
        });
      });
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
