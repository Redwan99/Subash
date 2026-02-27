"use client";

import { useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WeatherTheme =
  | "theme-bergamot"
  | "theme-neroli"
  | "theme-vetiver"
  | "theme-petrichor"
  | "theme-frost"
  | "theme-rose"
  | "theme-oud";

export type ClimateTag = "HOT" | "MILD" | "COLD" | "HUMID" | "DRY" | "RAINY";

interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  isNight: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function determineWeatherTheme(
  temp: number,
  condition: string,
  isNight: boolean
): WeatherTheme {
  if (isNight) return "theme-oud";
  if (["Rain", "Drizzle", "Thunderstorm"].includes(condition)) return "theme-petrichor";
  if (temp > 30 && condition === "Clear") return "theme-bergamot";
  if (temp > 25 && ["Clouds", "Haze", "Mist"].includes(condition)) return "theme-vetiver";
  if (temp < 15) return "theme-frost";
  if (temp > 22) return "theme-neroli";
  return "theme-rose";
}

/** Convert raw OWM data into universal climate tags used for DB queries. */
export function computeClimateTags(
  temp: number,
  humidity: number,
  condition: string
): ClimateTag[] {
  const tags: ClimateTag[] = [];
  if (temp > 28) tags.push("HOT");
  else if (temp < 15) tags.push("COLD");
  else tags.push("MILD");
  if (humidity > 70) tags.push("HUMID");
  else if (humidity < 40) tags.push("DRY");
  if (["Rain", "Drizzle", "Thunderstorm"].includes(condition)) tags.push("RAINY");
  return tags;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function WeatherThemeProvider() {
  useEffect(() => {
    let cancelled = false;

    function applyWeather(data: WeatherData) {
      if (cancelled) return;

      // 1. Visual theme
      const theme = determineWeatherTheme(data.temp, data.condition, data.isNight);
      document.documentElement.setAttribute("data-weather-theme", theme);

      // 2. Persist climate tags for client components (e.g. personalised recs)
      const tags = computeClimateTags(data.temp, data.humidity, data.condition);
      try {
        localStorage.setItem("current_climate", JSON.stringify(tags));
        localStorage.setItem("current_temp", String(Math.round(data.temp)));
      } catch {
        // Private browsing / storage blocked — ignore
      }

      // 3. Dispatch event so any mounted client component can react
      window.dispatchEvent(
        new CustomEvent("climate-update", { detail: { tags, data } })
      );
    }

    function fetchWeather(url: string) {
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: WeatherData | null) => {
          if (data) applyWeather(data);
        })
        .catch(() => {
          // Silently fail — base accent (violet) remains
        });
    }

    // Try browser geolocation; fall back to server default city
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          fetchWeather(
            `/api/weather?lat=${coords.latitude}&lon=${coords.longitude}`
          );
        },
        () => {
          // Permission denied or unavailable — use server default city
          fetchWeather("/api/weather");
        },
        { timeout: 5000, maximumAge: 300_000 }
      );
    } else {
      fetchWeather("/api/weather");
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
