// app/api/weather/route.ts
// Geo-aware weather + climate-matched perfume picks.
// Accepts ?lat=X&lon=Y (browser Geolocation) or ?city=Name (fallback).
// Returns: { weather, climateTags, weatherTheme, picks }

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function computeClimateTags(temp: number, humidity: number, condition: string): string[] {
  const tags: string[] = [];
  if (temp > 28) tags.push("HOT");
  else if (temp < 15) tags.push("COLD");
  else tags.push("MILD");
  if (humidity > 70) tags.push("HUMID");
  else if (humidity < 40) tags.push("DRY");
  if (["Rain", "Drizzle", "Thunderstorm"].includes(condition)) tags.push("RAINY");
  return tags;
}

function pickWeatherTheme(tags: string[], hour: number): string {
  if (tags.includes("RAINY")) return "theme-petrichor";
  if (tags.includes("COLD")) return "theme-frost";
  if (tags.includes("HOT") && tags.includes("HUMID")) return "theme-vetiver";
  if (tags.includes("HOT") && tags.includes("DRY")) return "theme-bergamot";
  if (tags.includes("HOT")) return "theme-neroli";
  if (hour >= 17 && hour < 20) return "theme-neroli";
  if (hour >= 20 || hour < 6) return "theme-oud";
  return "theme-rose";
}

// Map climate tags to fragrance accords that suit the weather
const CLIMATE_ACCORD_MAP: Record<string, string[]> = {
  HOT: ["citrus", "aquatic", "fresh", "ozonic", "green", "aromatic"],
  COLD: ["amber", "vanilla", "woody", "warm spicy", "oud", "balsamic", "tobacco"],
  MILD: ["floral", "rose", "powdery", "musk", "violet", "lavender"],
  HUMID: ["aquatic", "fresh", "ozonic", "citrus", "marine"],
  DRY: ["woody", "leather", "aromatic", "earthy", "vetiver"],
  RAINY: ["petrichor", "earthy", "green", "woody", "musk", "moss"],
};

async function _getClimatePicks(climateTags: string[]) {
  const TARGET = 12;

  const climateWhere = climateTags.length
    ? { OR: climateTags.map((tag) => ({ weather_tags: { contains: `"${tag}"` } })) }
    : undefined;

  const [grouped, accordPerfumes, fallback] = await Promise.all([
    climateWhere
      ? prisma.review.groupBy({
          by: ["perfumeId"],
          where: climateWhere,
          _avg: { overall_rating: true },
          _count: { id: true },
          orderBy: [{ _avg: { overall_rating: "desc" } }, { _count: { id: "desc" } }],
          take: TARGET,
        })
      : Promise.resolve([]),
    (async () => {
      const accords = climateTags.flatMap((t) => CLIMATE_ACCORD_MAP[t] ?? []);
      if (!accords.length) return [];
      return prisma.perfume.findMany({
        where: { OR: accords.map((a) => ({ accords: { contains: a } })) },
        select: { id: true, slug: true, name: true, brand: true, image_url: true },
        orderBy: { searchCount: "desc" },
        take: TARGET,
      });
    })(),
    prisma.perfume.findMany({
      select: { id: true, slug: true, name: true, brand: true, image_url: true },
      orderBy: { searchCount: "desc" },
      take: TARGET,
    }),
  ]);

  const seen = new Set<string>();
  const results: Array<{ id: string; slug: string; name: string; brand: string; image_url: string | null; rating: number; reviewCount: number }> = [];

  if (grouped.length) {
    const perfumes = await prisma.perfume.findMany({
      where: { id: { in: grouped.map((g) => g.perfumeId) } },
      select: { id: true, slug: true, name: true, brand: true, image_url: true },
    });
    const byId = new Map(perfumes.map((p) => [p.id, p]));
    for (const g of grouped) {
      const p = byId.get(g.perfumeId);
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        results.push({ ...p, rating: g._avg?.overall_rating ?? 0, reviewCount: g._count?.id ?? 0 });
      }
    }
  }

  for (const p of accordPerfumes) {
    if (results.length >= TARGET) break;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      results.push({ ...p, rating: 0, reviewCount: 0 });
    }
  }

  for (const p of fallback) {
    if (results.length >= TARGET) break;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      results.push({ ...p, rating: 0, reviewCount: 0 });
    }
  }

  return results;
}

// Cache picks per unique tag combination for 30 min, tagged for revalidation
const getClimatePicks = (climateTags: string[]) =>
  unstable_cache(
    () => _getClimatePicks(climateTags),
    ["weather-climate-picks", ...climateTags.slice().sort()],
    { revalidate: 1800, tags: ["trending"] }
  )();

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const defaultCity = process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "Dhaka";

  if (!apiKey) {
    return NextResponse.json({ error: "No OWM key" }, { status: 503 });
  }

  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city");

  const owmUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
  owmUrl.searchParams.set("units", "metric");
  owmUrl.searchParams.set("appid", apiKey);

  if (lat && lon) {
    // Precise GPS coordinates from browser geolocation
    owmUrl.searchParams.set("lat", lat);
    owmUrl.searchParams.set("lon", lon);
  } else if (city) {
    owmUrl.searchParams.set("q", city);
  } else {
    // No coords or city — detect from client IP
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;

    let resolvedLat: number | null = null;
    let resolvedLon: number | null = null;

    if (clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1") {
      try {
        const ipRes = await fetch(
          `https://ip-api.com/json/${clientIp}?fields=status,city,lat,lon,country`,
          { next: { revalidate: 3600 } } // cache IP lookup for 1 hour
        );
        if (ipRes.ok) {
          const ipData = (await ipRes.json()) as {
            status: string;
            city?: string;
            lat?: number;
            lon?: number;
            country?: string;
          };
          if (ipData.status === "success" && ipData.lat && ipData.lon) {
            resolvedLat = ipData.lat;
            resolvedLon = ipData.lon;
          }
        }
      } catch {
        // IP lookup failed — fall through to default city
      }
    }

    if (resolvedLat !== null && resolvedLon !== null) {
      owmUrl.searchParams.set("lat", String(resolvedLat));
      owmUrl.searchParams.set("lon", String(resolvedLon));
    } else {
      owmUrl.searchParams.set("q", defaultCity);
    }
  }

  try {
    const owmRes = await fetch(owmUrl.toString(), { next: { revalidate: 600 } });
    if (!owmRes.ok) {
      return NextResponse.json({ error: "OWM failed" }, { status: 502 });
    }

    const data = (await owmRes.json()) as {
      main?: { temp?: number; humidity?: number };
      weather?: { main?: string; description?: string; icon?: string }[];
      name?: string;
      sys?: { country?: string };
      timezone?: number; // UTC offset in seconds
    };

    const temp = data.main?.temp ?? 25;
    const humidity = data.main?.humidity ?? 60;
    const condition = data.weather?.[0]?.main ?? "Clear";
    const icon = data.weather?.[0]?.icon ?? "01d";
    const isNight = icon.endsWith("n");

    const weather = {
      temp,
      humidity,
      condition,
      description: data.weather?.[0]?.description ?? "",
      icon,
      isNight,
      city: data.name ?? city ?? defaultCity,
      country: data.sys?.country ?? "",
    };

    const climateTags = computeClimateTags(temp, humidity, condition);
    // Use OWM's own timezone offset (seconds) — works regardless of how we resolved the location
    const tzOffsetHours = (data.timezone ?? 0) / 3600;
    const localHour = ((new Date().getUTCHours() + tzOffsetHours) % 24 + 24) % 24;
    const weatherTheme = pickWeatherTheme(climateTags, localHour);
    const picks = await getClimatePicks(climateTags);

    return NextResponse.json(
      { weather, climateTags, weatherTheme, picks },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("[/api/weather]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}