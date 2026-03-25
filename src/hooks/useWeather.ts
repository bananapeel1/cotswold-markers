"use client";

import { useState, useEffect } from "react";

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isRaining: boolean;
  isHot: boolean;
  windSpeed: number;
  description: string;
}

const CACHE_KEY = "trailtap-weather";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// WMO Weather interpretation codes
function describeWeather(code: number): string {
  if (code <= 1) return "Clear skies";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Overcast";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

export function useWeather(lat: number, lng: number): WeatherData | null {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // Check cache
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        setWeather(data);
        return;
      }
    }

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.current_weather) {
          const cw = json.current_weather;
          const data: WeatherData = {
            temperature: cw.temperature,
            weatherCode: cw.weathercode,
            isRaining: cw.weathercode >= 51 && cw.weathercode <= 82,
            isHot: cw.temperature >= 25,
            windSpeed: cw.windspeed,
            description: describeWeather(cw.weathercode),
          };
          setWeather(data);
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data, timestamp: Date.now() })
          );
        }
      })
      .catch(() => {
        // Silently fail — weather is a nice-to-have
      });
  }, [lat, lng]);

  return weather;
}
