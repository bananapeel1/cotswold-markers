"use client";

import { useEffect, useState } from "react";

interface TrailWeather {
  location: string;
  temp: number;
  code: number;
  description: string;
}

function weatherIcon(code: number): string {
  if (code <= 1) return "wb_sunny";
  if (code <= 3) return "partly_cloudy_day";
  if (code <= 48) return "cloud";
  if (code <= 57) return "grain";
  if (code <= 67) return "rainy";
  if (code <= 77) return "weather_snowy";
  if (code <= 82) return "rainy";
  if (code >= 95) return "thunderstorm";
  return "cloud";
}

function describeWeather(code: number): string {
  if (code <= 1) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Overcast";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code >= 95) return "Storms";
  return "Cloudy";
}

// Three points along the Cotswold Way: north, middle, south
const TRAIL_POINTS = [
  { name: "Chipping Campden", lat: 52.0507, lng: -1.7809 },
  { name: "Cheltenham", lat: 51.9013, lng: -2.0640 },
  { name: "Bath", lat: 51.3811, lng: -2.3590 },
];

export default function WeatherStrip() {
  const [weather, setWeather] = useState<TrailWeather[]>([]);

  useEffect(() => {
    const lats = TRAIL_POINTS.map((p) => p.lat).join(",");
    const lngs = TRAIL_POINTS.map((p) => p.lng).join(",");

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current_weather=true`
    )
      .then((r) => r.json())
      .then((data) => {
        // API returns array when multiple coordinates
        const results = Array.isArray(data) ? data : [data];
        const parsed = results.map((d, i) => ({
          location: TRAIL_POINTS[i].name,
          temp: Math.round(d.current_weather.temperature),
          code: d.current_weather.weathercode,
          description: describeWeather(d.current_weather.weathercode),
        }));
        setWeather(parsed);
      })
      .catch(() => {});
  }, []);

  if (weather.length === 0) return null;

  return (
    <section className="py-4 px-6 max-w-7xl mx-auto">
      <div className="bg-surface-container rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-sm">cloud</span>
          <span className="text-xs font-bold text-secondary uppercase tracking-widest">
            Trail Weather Now
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {weather.map((w) => (
            <div key={w.location} className="text-center">
              <span className="material-symbols-outlined text-2xl text-primary mb-1 block">
                {weatherIcon(w.code)}
              </span>
              <p className="text-lg font-bold text-on-surface">{w.temp}°</p>
              <p className="text-[10px] text-secondary">{w.description}</p>
              <p className="text-[9px] text-secondary/60 mt-0.5">{w.location}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
