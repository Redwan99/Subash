"use client";
// components/ClimateSection.tsx
// Client wrapper for the weather + climate picks panel.
// 1. Server renders with fallback Dhaka data (SSR).
// 2. On mount, requests browser Geolocation.
// 3. If granted, re-fetches from /api/weather?lat=X&lon=Y for real data.
// 4. Applies data-weather-theme to <html> for the full-site color shift.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, CloudRain, Sun, Flame, Snowflake, Wind, Droplets } from "lucide-react";
import { ClimatePerfumeSlider, type SliderPerfume } from "@/components/perfume/ClimatePerfumeSlider";

export interface InitialWeatherData {
  temp: number;
  humidity: number;
  condition: string;
  city: string;
  country: string;
  icon?: string;
  isNight?: boolean;
}

interface ClimateState {
  weather: InitialWeatherData | null;
  climateTags: string[];
  weatherTheme: string;
  picks: SliderPerfume[];
}

type GeoStatus = "idle" | "requesting" | "granted" | "denied" | "ip" | "unavailable";

// Map OWM condition to a lucide icon + color
function WeatherIcon({ condition, isNight, size = 20 }: { condition: string; isNight?: boolean; size?: number }) {
  if (["Rain", "Drizzle", "Thunderstorm"].includes(condition)) {
    return <CloudRain size={size} className="text-[#7AAACE]" />;
  }
  if (condition === "Snow") return <Snowflake size={size} className="text-[#AECDE0]" />;
  if (condition === "Clouds") return <Wind size={size} className="text-[var(--text-muted)]" />;
  if (isNight) return <span style={{ fontSize: size }}>🌙</span>;
  return <Sun size={size} className="text-[#C9A84C]" />;
}

// Map climate tag to a readable label + icon
function ClimateTag({ tag }: { tag: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    HOT:   { label: "HOT",   icon: <Flame size={10} />,     color: "text-[#C87C42] bg-[rgba(200,124,66,0.12)] border-[rgba(200,124,66,0.3)]" },
    COLD:  { label: "COLD",  icon: <Snowflake size={10} />, color: "text-[#8BAEC8] bg-[rgba(139,174,200,0.12)] border-[rgba(139,174,200,0.3)]" },
    MILD:  { label: "MILD",  icon: <Sun size={10} />,       color: "text-[var(--accent)] bg-[rgba(139,92,246,0.12)] border-[rgba(139,92,246,0.3)]" },
    HUMID: { label: "HUMID", icon: <Droplets size={10} />,  color: "text-[#3D9E8C] bg-[rgba(61,158,140,0.12)] border-[rgba(61,158,140,0.3)]" },
    DRY:   { label: "DRY",   icon: <Wind size={10} />,      color: "text-[var(--text-muted)] bg-[rgba(139,92,246,0.08)] border-[rgba(139,92,246,0.2)]" },
    RAINY: { label: "RAINY", icon: <CloudRain size={10} />, color: "text-[#5882A8] bg-[rgba(88,130,168,0.12)] border-[rgba(88,130,168,0.3)]" },
  };
  const m = map[tag] ?? { label: tag, icon: null, color: "text-[var(--accent)] bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.25)]" };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
}

interface Props {
  initialWeather: InitialWeatherData | null;
  initialTags: string[];
  initialTheme: string;
  initialPicks: SliderPerfume[];
}

export function ClimateSection({ initialWeather, initialTags, initialTheme, initialPicks }: Props) {
  const [state, setState] = useState<ClimateState>({
    weather: initialWeather,
    climateTags: initialTags,
    weatherTheme: initialTheme,
    picks: initialPicks,
  });
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const appliedTheme = useRef<string>("");

  // Apply the weather theme to <html> element
  const applyTheme = (theme: string) => {
    if (appliedTheme.current === theme) return;
    const html = document.documentElement;
    // Remove all theme-* classes from data-weather-theme attribute
    html.removeAttribute("data-weather-theme");
    if (theme) html.setAttribute("data-weather-theme", theme);
    appliedTheme.current = theme;
  };

  // Apply initial theme on mount (SSR theme)
  useEffect(() => {
    if (initialTheme) applyTheme(initialTheme);
  }, [initialTheme]);

  // Geo detection + real weather fetch
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      // Fall back to IP-based location immediately
      void fetchIpWeather();
      return;
    }
    setGeoStatus("requesting");

    const timeout = setTimeout(() => {
      // Geolocation timed out — try IP fallback
      setGeoStatus("ip");
      void fetchIpWeather();
    }, 6000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeout);
        setGeoStatus("granted");
        const { latitude: lat, longitude: lon } = position.coords;
        try {
          const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
          if (!res.ok) throw new Error("Weather fetch failed");
          const data = await res.json() as {
            weather: InitialWeatherData;
            climateTags: string[];
            weatherTheme: string;
            picks: SliderPerfume[];
          };
          setState({
            weather: data.weather,
            climateTags: data.climateTags,
            weatherTheme: data.weatherTheme,
            picks: data.picks,
          });
          applyTheme(data.weatherTheme);
        } catch {
          // Keep showing initial data silently
        }
      },
      () => {
        clearTimeout(timeout);
        // Browser geo denied — try IP-based fallback
        setGeoStatus("ip");
        void fetchIpWeather();
      },
      { timeout: 5500, maximumAge: 300_000 }
    );
  }, []);

  async function fetchIpWeather() {
    try {
      // /api/weather with no params — server reads client IP
      const res = await fetch("/api/weather?source=ip");
      if (!res.ok) return;
      const data = await res.json() as {
        weather: InitialWeatherData;
        climateTags: string[];
        weatherTheme: string;
        picks: SliderPerfume[];
      };
      setState({
        weather: data.weather,
        climateTags: data.climateTags,
        weatherTheme: data.weatherTheme,
        picks: data.picks,
      });
      applyTheme(data.weatherTheme);
    } catch {
      // Silently keep SSR data
    }
  }

  const { weather, climateTags, picks } = state;
  const isRealLocation = geoStatus === "granted";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      {/* ── Left: weather info ─────────────────────────────────── */}
      <div className="space-y-3 lg:flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Climate Lens</p>
          {geoStatus === "requesting" && (
            <Loader2 size={11} className="animate-spin text-[var(--text-muted)]" />
          )}
          {isRealLocation && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-[10px] text-[#34D399] font-medium"
            >
              <MapPin size={9} /> Live Location
            </motion.span>
          )}
          {geoStatus === "ip" && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-medium"
            >
              <MapPin size={9} /> Auto-detected
            </motion.span>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={weather?.city ?? "loading"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-start gap-3">
              {weather && (
                <div className="mt-1 shrink-0">
                  <WeatherIcon condition={weather.condition} isNight={weather.isNight} size={28} />
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-semibold leading-tight text-[var(--text-primary)]">
                  {weather ? (
                    <>
                      It&apos;s {Math.round(weather.temp)}°C in {weather.city}
                      {weather.country ? `, ${weather.country}` : ""}.
                    </>
                  ) : (
                    <>Showing community top picks.</>
                  )}
                </h1>
                <p className="text-sm mt-1 text-[var(--text-secondary)]">
                  Climate-matched scents for right now.
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-wrap items-center gap-2">
          {climateTags.map((tag) => <ClimateTag key={tag} tag={tag} />)}
          {weather && (
            <span className="text-xs flex items-center gap-1 text-[var(--text-muted)]">
              <Droplets size={11} /> {weather.humidity}%
            </span>
          )}
        </div>

        {/* Geo permission prompt — only shown once before a decision */}
        {geoStatus === "idle" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-[var(--text-muted)]"
          >
            Allow location access for real-time scent suggestions.
          </motion.p>
        )}
      </div>

      {/* ── Right: animated product slider ──────────────────── */}
      <div className="w-full lg:max-w-sm mx-auto lg:mx-0 shrink-0">
        {picks.length === 0 ? (
          <p className="text-sm text-center py-6 text-[var(--text-muted)]">
            No climate-matched reviews yet — add a review to help build picks.
          </p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={state.weatherTheme}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ClimatePerfumeSlider picks={picks} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}