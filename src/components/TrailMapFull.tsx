"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TRAIL } from "@/lib/constants";
import type { Marker, POI } from "@/data/types";

const SATELLITE_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

const POI_CATEGORIES = [
  { id: "food", types: ["pub", "cafe"], color: "#E67E22" },
  { id: "water", types: ["water"], color: "#3498DB" },
  { id: "toilets", types: ["toilets"], color: "#7F8C8D" },
  { id: "shops", types: ["shop"], color: "#27AE60" },
  { id: "accommodation", types: ["accommodation", "campsite"], color: "#8E44AD" },
] as const;

const POI_TYPE_LABELS: Record<string, string> = {
  pub: "Pub", cafe: "Café", water: "Water", toilets: "Toilets",
  shop: "Shop", accommodation: "Accommodation", campsite: "Campsite",
};

const POI_TYPE_ICON: Record<string, string> = {
  pub: "sports_bar", cafe: "local_cafe", water: "water_drop", toilets: "wc",
  shop: "shopping_bag", accommodation: "bed", campsite: "camping",
};

function createCircleGeoJSON(lng: number, lat: number, radiusKm: number, points = 64) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusKm * Math.cos(angle);
    const dy = radiusKm * Math.sin(angle);
    const dLng = dx / (111.32 * Math.cos((lat * Math.PI) / 180));
    const dLat = dy / 110.574;
    coords.push([lng + dLng, lat + dLat]);
  }
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coords] },
    properties: {},
  };
}

export default function TrailMapFull({ markers, pois = [] }: { markers: Marker[]; pois?: POI[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const activePopup = useRef<mapboxgl.Popup | null>(null);
  const poisRef = useRef<POI[]>(pois);
  poisRef.current = pois;

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
      addPOILayers(map.current!, poisRef.current);
    });

    // Listen for POI toggle events
    function handlePOIToggle(e: Event) {
      const detail = (e as CustomEvent).detail;
      const m = map.current;
      if (!m) return;
      const layerId = `pois-${detail.category}`;
      if (m.getLayer(layerId)) {
        m.setLayoutProperty(layerId, "visibility", detail.visible ? "visible" : "none");
      }
    }

    // Listen for Near Me events
    function handleNearMe(e: Event) {
      const detail = (e as CustomEvent).detail;
      const m = map.current;
      if (!m) return;

      if (detail.active && detail.lat != null && detail.lng != null) {
        // Add/update radius circle
        const circleGeoJSON = createCircleGeoJSON(detail.lng, detail.lat, 1);
        if (m.getSource("near-me-radius")) {
          (m.getSource("near-me-radius") as mapboxgl.GeoJSONSource).setData(circleGeoJSON as GeoJSON.Feature);
        } else {
          m.addSource("near-me-radius", { type: "geojson", data: circleGeoJSON as GeoJSON.Feature });
          m.addLayer({
            id: "near-me-fill",
            type: "fill",
            source: "near-me-radius",
            paint: { "fill-color": "#3b82f6", "fill-opacity": 0.08 },
          }, "trail-line");
          m.addLayer({
            id: "near-me-border",
            type: "line",
            source: "near-me-radius",
            paint: { "line-color": "#3b82f6", "line-width": 2, "line-opacity": 0.4 },
          }, "trail-line");
        }

        // Fly to user location
        m.flyTo({ center: [detail.lng, detail.lat], zoom: 14 });

        // Add user marker
        userMarker.current?.remove();
        const el = document.createElement("div");
        el.style.cssText = "width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);";
        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat([detail.lng, detail.lat])
          .addTo(m);

        // Count nearby POIs and dispatch back
        const nearbyCount = poisRef.current.filter((p) => {
          const dlat = p.latitude - detail.lat;
          const dlng = p.longitude - detail.lng;
          const dist = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
          return dist <= 1;
        }).length;
        window.dispatchEvent(new CustomEvent("trailtap:near-me-count", { detail: { count: nearbyCount } }));

      } else {
        // Remove radius
        if (m.getLayer("near-me-fill")) m.removeLayer("near-me-fill");
        if (m.getLayer("near-me-border")) m.removeLayer("near-me-border");
        if (m.getSource("near-me-radius")) m.removeSource("near-me-radius");
        userMarker.current?.remove();
        userMarker.current = null;
      }
    }

    window.addEventListener("trailtap:poi-toggle", handlePOIToggle);
    window.addEventListener("trailtap:near-me", handleNearMe);

    return () => {
      window.removeEventListener("trailtap:poi-toggle", handlePOIToggle);
      window.removeEventListener("trailtap:near-me", handleNearMe);
      map.current?.remove();
    };
  }, [markers]);

  function addPOILayers(m: mapboxgl.Map, allPois: POI[]) {
    // Build GeoJSON FeatureCollection
    const features = allPois.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.longitude, p.latitude] },
      properties: {
        id: p.id,
        name: p.name,
        type: p.type,
        description: p.description,
        openingHours: p.openingHours || "",
      },
    }));

    if (!m.getSource("pois")) {
      m.addSource("pois", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });
    }

    // Add a circle layer per category (all hidden by default)
    POI_CATEGORIES.forEach((cat) => {
      const layerId = `pois-${cat.id}`;
      if (m.getLayer(layerId)) return;

      const filter: mapboxgl.FilterSpecification = cat.types.length === 1
        ? ["==", ["get", "type"], cat.types[0]]
        : ["in", ["get", "type"], ["literal", cat.types]];

      m.addLayer({
        id: layerId,
        type: "circle",
        source: "pois",
        filter,
        paint: {
          "circle-radius": 7,
          "circle-color": cat.color,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-opacity": 0.9,
        },
        layout: { visibility: "none" },
      });

      // Click handler for POI popups
      m.on("click", layerId, (e) => {
        if (!e.features?.[0]) return;
        const props = e.features[0].properties!;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        const icon = POI_TYPE_ICON[props.type] || "pin_drop";
        const label = POI_TYPE_LABELS[props.type] || props.type;
        const color = cat.color;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}&travelmode=walking`;

        const poiHTML = `
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=schedule,navigation,${icon}" rel="stylesheet" />
            <style>
              .poi-popup .mapboxgl-popup-content { padding:0; border-radius:14px; font-family:Manrope,sans-serif; box-shadow:0 8px 30px rgba(0,0,0,0.12); overflow:hidden; border:none; width:240px; }
              .poi-popup .mapboxgl-popup-close-button { font-size:14px; color:#72796e; right:6px; top:6px; z-index:2; background:rgba(0,0,0,0.05); width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; line-height:1; }
              .poi-popup .mapboxgl-popup-close-button:hover { background:rgba(0,0,0,0.1); }
              .poi-popup .mapboxgl-popup-tip { border-top-color: white; }
            </style>
            <div>
              <div style="padding:14px 14px 10px; display:flex; align-items:flex-start; gap:10px;">
                <div style="width:32px; height:32px; border-radius:8px; background:${color}12; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <span class="material-symbols-outlined" style="font-size:18px; color:${color};">${icon}</span>
                </div>
                <div style="min-width:0;">
                  <p style="font-size:13px; font-weight:700; color:#173124; margin:0; line-height:1.3;">${props.name}</p>
                  <p style="font-size:10px; font-weight:600; color:#72796e; margin:2px 0 0; text-transform:uppercase; letter-spacing:0.04em;">${label}</p>
                </div>
              </div>
              <div style="padding:0 14px 14px;">
                ${props.openingHours ? `<div style="display:flex; align-items:center; gap:5px; margin-bottom:8px; padding:6px 8px; background:#f5f3ee; border-radius:6px;"><span class="material-symbols-outlined" style="font-size:14px; color:#72796e;">schedule</span><span style="font-size:10px; color:#5e5e5e; line-height:1.3;">${props.openingHours}</span></div>` : ""}
                ${props.description ? `<p style="font-size:11px; color:#72796e; margin:0 0 10px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${props.description}</p>` : ""}
                <a href="${directionsUrl}" target="_blank" rel="noopener" style="display:flex; align-items:center; justify-content:center; gap:5px; background:#173124; color:white; text-decoration:none; font-size:11px; font-weight:700; padding:9px 12px; border-radius:8px;">
                  <span class="material-symbols-outlined" style="font-size:14px;">navigation</span> Get Directions
                </a>
              </div>
            </div>
          `;

        // Always close any existing popup first
        if (activePopup.current) {
          activePopup.current.remove();
          activePopup.current = null;
        }

        // Hide bottom panel on mobile so popup has full visible area
        const bottomPanel = document.getElementById("map-bottom-panel");
        if (bottomPanel) {
          bottomPanel.style.transform = "translateY(calc(100% + 16px))";
        }

        // Fly to POI — no zoom change, just center it
        m.flyTo({
          center: [coords[0], coords[1]],
          offset: [0, 60],
          duration: 500,
        });

        // Show popup after animation completes
        m.once("moveend", () => {
          const popup = new mapboxgl.Popup({ offset: 12, maxWidth: "240px", className: "poi-popup", anchor: "bottom" })
            .setLngLat(coords)
            .setHTML(poiHTML)
            .addTo(m);
          activePopup.current = popup;
          popup.on("close", () => {
            activePopup.current = null;
            // Restore bottom panel when popup closes
            if (bottomPanel) {
              bottomPanel.style.transform = "";
            }
          });
        });
      });

      // Cursor pointer on hover
      m.on("mouseenter", layerId, () => { m.getCanvas().style.cursor = "pointer"; });
      m.on("mouseleave", layerId, () => { m.getCanvas().style.cursor = ""; });
    });
  }

  function addTrailAndMarkers(m: mapboxgl.Map, mkrs: Marker[]) {
    // Trail line
    if (!m.getSource("trail")) {
      m.addSource("trail", { type: "geojson", data: "/data/cotswold-way.geojson" });
    }
    if (!m.getLayer("trail-line")) {
      m.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: { "line-color": TRAIL.trailColor, "line-width": 4, "line-opacity": 0.7 },
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

      const markerPopupHTML = `
        <style>
          .ttp-popup .mapboxgl-popup-content { padding:0; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.15); font-family:Manrope,sans-serif; width:240px; }
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
      `;

      // Don't use .setPopup() — it toggles and causes issues on second click
      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat([marker.longitude, marker.latitude])
        .addTo(m);

      mapboxMarker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();

        // Always close any existing popup first
        if (activePopup.current) {
          activePopup.current.remove();
          activePopup.current = null;
        }

        // Hide bottom panel on mobile so popup has full visible area
        const bottomPanel = document.getElementById("map-bottom-panel");
        if (bottomPanel) {
          bottomPanel.style.transform = "translateY(calc(100% + 16px))";
        }

        // Fly to marker — no zoom change, just center it
        // Slight upward offset so popup (which appears above) is also visible
        m.flyTo({
          center: [marker.longitude, marker.latitude],
          offset: [0, 60],
          duration: 500,
        });

        // Show popup after animation completes
        m.once("moveend", () => {
          const popup = new mapboxgl.Popup({ offset: 20, maxWidth: "240px", anchor: "bottom", className: "ttp-popup" })
            .setLngLat([marker.longitude, marker.latitude])
            .setHTML(markerPopupHTML)
            .addTo(m);
          activePopup.current = popup;
          popup.on("close", () => {
            activePopup.current = null;
            // Restore bottom panel when popup closes
            if (bottomPanel) {
              bottomPanel.style.transform = "";
            }
          });
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
      addPOILayers(m, poisRef.current);
    });
  }

  function locateUser() {
    if (!navigator.geolocation || !map.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.current?.flyTo({ center: [longitude, latitude], zoom: 14 });
        userMarker.current?.remove();
        const el = document.createElement("div");
        el.style.cssText = "width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);";
        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current!);
      },
      () => { alert("Unable to get your location. Please enable location services."); },
      { enableHighAccuracy: true }
    );
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: "100vh" }}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map controls */}
      <div className="absolute right-4 top-24 flex flex-col gap-2 z-10">
        <button onClick={() => map.current?.zoomIn()} className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-on-surface active:scale-90 transition-all border border-outline-variant/20" aria-label="Zoom in">
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
        <button onClick={() => map.current?.zoomOut()} className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-on-surface active:scale-90 transition-all border border-outline-variant/20" aria-label="Zoom out">
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        <div className="h-1" />
        <button onClick={locateUser} className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-primary active:scale-90 transition-all border border-outline-variant/20" aria-label="My location">
          <span className="material-symbols-outlined text-lg">my_location</span>
        </button>
        <button onClick={toggleSatellite} className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-primary active:scale-90 transition-all border border-outline-variant/20" aria-label="Toggle satellite view">
          <span className="material-symbols-outlined text-lg">satellite_alt</span>
        </button>
      </div>
    </div>
  );
}
