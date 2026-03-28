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

const TRAIL_POINTS = [
  { name: "Chipping Campden", lat: 52.0507, lng: -1.7809 },
  { name: "Cheltenham", lat: 51.9013, lng: -2.0640 },
  { name: "Bath", lat: 51.3811, lng: -2.3590 },
];

export default function HeroWeather() {
  const [weather, setWeather] = useState<TrailWeather[]>([]);

  useEffect(() => {
    const lats = TRAIL_POINTS.map((p) => p.lat).join(",");
    const lngs = TRAIL_POINTS.map((p) => p.lng).join(",");

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current_weather=true`
    )
      .then((r) => r.json())
      .then((data) => {
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

  if (weather.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-2xl animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto" />
              <div className="h-6 bg-gray-200 rounded w-12 mx-auto" />
              <div className="h-3 bg-gray-100 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-2xl">
      <h3 className="font-headline font-bold text-on-surface text-base mb-1">
        Trail Weather Now
      </h3>
      <p className="text-xs text-secondary mb-4">
        Live conditions along the Cotswold Way.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {weather.map((w) => (
          <div key={w.location} className="text-center">
            <span className="material-symbols-outlined text-3xl text-primary mb-1 block">
              {weatherIcon(w.code)}
            </span>
            <p className="text-2xl font-black font-headline text-on-surface">{w.temp}°</p>
            <p className="text-[11px] text-secondary font-medium">{w.description}</p>
            <p className="text-[9px] text-secondary/60 mt-0.5">{w.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
