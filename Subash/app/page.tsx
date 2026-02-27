import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { truncate } from "@/lib/utils";
import { ClimateSection } from "@/components/ClimateSection";

// Data is cached via unstable_cache; page rendered dynamically (no DB at build time)
export const dynamic = 'force-dynamic';

type PerfumeCard = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image_url: string | null;
};

/** Convert OWM data into universal climate tags that match Review.weather_tags */
function computeClimateTags(
  temp: number,
  humidity: number,
  condition: string
): string[] {
  const tags: string[] = [];
  if (temp > 28) tags.push("HOT");
  else if (temp < 15) tags.push("COLD");
  else tags.push("MILD");
  if (humidity > 70) tags.push("HUMID");
  else if (humidity < 40) tags.push("DRY");
  if (["Rain", "Drizzle", "Thunderstorm"].includes(condition)) tags.push("RAINY");
  return tags;
}

function pickWeatherTheme(tags: string[]): string {
  if (tags.includes("RAINY")) return "theme-petrichor";
  if (tags.includes("COLD")) return "theme-frost";
  if (tags.includes("HOT") && tags.includes("HUMID")) return "theme-vetiver";
  if (tags.includes("HOT") && tags.includes("DRY")) return "theme-bergamot";
  if (tags.includes("HOT")) return "theme-neroli";
  return "theme-rose";
}

async function getWeather(city: string) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", city);
  url.searchParams.set("units", "metric");
  url.searchParams.set("appid", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    main?: { temp?: number; humidity?: number };
    weather?: { main?: string }[];
    name?: string;
  };

  if (!data.main?.temp || !data.main?.humidity) return null;
  return {
    temp: data.main.temp,
    humidity: data.main.humidity,
    condition: data.weather?.[0]?.main ?? "Clear",
    city: data.name ?? city,
  };
}

// ── Cached DB fetchers (independent per-function TTLs) ────────────────────
// unstable_cache deduplicates across simultaneous renders and survives
// across ISR re-validation cycles without blocking the initial response.

const getTrending = unstable_cache(
  async () =>
    prisma.perfume.findMany({
      select: {
        id: true, slug: true, name: true, brand: true, image_url: true,
        _count: { select: { reviews: true } },
      },
      orderBy: [{ reviews: { _count: "desc" } }, { release_year: "desc" }],
      take: 12,
    }),
  ["homepage-trending"],
  { revalidate: 3600, tags: ["trending"] }
);

const getLatestReviews = unstable_cache(
  async () =>
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, text: true, overall_rating: true,
        user:    { select: { id: true, name: true, image: true } },
        perfume: { select: { id: true, slug: true, name: true, brand: true, image_url: true } },
      },
    }),
  ["homepage-latest-reviews"],
  { revalidate: 300, tags: ["reviews"] }
);

async function getClimatePicks(climateTags: string[]) {
  // Parallel: run groupBy and a fallback prefetch together — if groupBy
  // returns results we discard the fallback; if not, it's already ready.
  const [grouped, fallback] = await Promise.all([
    prisma.review.groupBy({
      by: ["perfumeId"],
      where: { weather_tags: { hasSome: climateTags } },
      _avg: { overall_rating: true },
      _count: { id: true },
      orderBy: [{ _avg: { overall_rating: "desc" } }, { _count: { id: "desc" } }],
      take: 12,
    }),
    prisma.perfume.findMany({
      select: { id: true, slug: true, name: true, brand: true, image_url: true },
      orderBy: [{ release_year: "desc" }, { name: "asc" }],
      take: 12,
    }),
  ]);

  if (!grouped.length) {
    return (fallback as PerfumeCard[]).map((p) => ({ ...p, rating: 0, reviewCount: 0 }));
  }

  const ids = grouped.map((g) => g.perfumeId);
  const perfumes = (await prisma.perfume.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true, name: true, brand: true, image_url: true },
  })) as PerfumeCard[];

  const byId = new Map(perfumes.map((p) => [p.id, p]));
  return grouped
    .map((g) => {
      const perfume = byId.get(g.perfumeId);
      if (!perfume) return null;
      return { ...perfume, rating: g._avg?.overall_rating ?? 0, reviewCount: g._count?.id ?? 0 };
    })
    .filter(Boolean) as Array<{
    id: string; slug: string; name: string; brand: string;
    image_url: string | null; rating: number; reviewCount: number;
  }>;
}

export default async function HomePage() {
  const city = process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "Dhaka";

  // ⚡ Fan out: weather + trending + reviews all start at the same time.
  // climatePicks depends on weather tags — it starts after weather resolves,
  // but by then trending and reviews are already in flight.
  const [weather, trending, latestReviews] = await Promise.all([
    getWeather(city),
    getTrending(),
    getLatestReviews(),
  ]);

  const climateTags = weather
    ? computeClimateTags(weather.temp, weather.humidity, weather.condition)
    : ["MILD"];
  const initialTheme = pickWeatherTheme(climateTags);
  const climatePicks = await getClimatePicks(climateTags);

  return (
    <main className="min-h-screen px-4 md:px-6 pt-20 md:pt-24 pb-20">

      {/* Weather Picks — live geolocation via ClimateSection client component */}
      <section className="max-w-6xl mx-auto">
        <div className="rounded-3xl p-6 md:p-8 glass">
          <ClimateSection
            initialWeather={weather ? {
              temp: weather.temp,
              humidity: weather.humidity,
              condition: weather.condition,
              city: weather.city,
              country: "",
            } : null}
            initialTags={climateTags}
            initialTheme={initialTheme}
            initialPicks={climatePicks}
          />
        </div>
      </section>

      {/* Trending + Latest Reviews */}
      <section className="max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-[var(--text-primary)]">
              Trending This Week
            </h2>
            <Link href="/leaderboards" className="text-xs text-[var(--accent)]">
              View Leaderboards →
            </Link>
          </div>
          {/* auto-fill: columns size themselves to fit, min 140px each */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
          >
            {trending.map((p) => (
              <Link
                key={p.id}
                href={`/perfume/${p.slug}`}
                className="rounded-2xl p-3 transition glass-subtle flex flex-col"
              >
                {/* Image area — fixed height so all cards align */}
                <div className="w-full rounded-xl flex items-center justify-center overflow-hidden bg-[rgba(139,92,246,0.06)] dark:bg-[rgba(139,92,246,0.10)]" style={{ height: 120 }}>
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      width={100}
                      height={116}
                      className="object-contain w-auto mix-blend-multiply dark:mix-blend-normal bg-white dark:bg-transparent rounded"
                      style={{ maxHeight: 112 }}
                      unoptimized
                    />
                  ) : (
                    <span className="text-3xl">🧴</span>
                  )}
                </div>
                <div className="mt-2 flex-1 min-w-0">
                  <p className="text-xs font-semibold line-clamp-2 leading-snug text-[var(--text-primary)]">
                    {p.name}
                  </p>
                  <p className="text-[11px] line-clamp-1 mt-0.5 text-[var(--text-secondary)]">
                    {p.brand}
                  </p>
                  <p className="text-[10px] mt-1 text-[var(--text-muted)]">
                    {p._count.reviews} {p._count.reviews === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold text-[var(--text-primary)]">
            Latest Community Reviews
          </h2>
          <div className="space-y-3">
            {latestReviews.map((review) => (
              <Link
                key={review.id}
                href={`/perfume/${review.perfume.slug}`}
                className="block rounded-2xl p-4 transition glass-subtle"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-[rgba(139,92,246,0.15)]">
                    {review.user.image ? (
                      <Image
                        src={review.user.image}
                        alt={review.user.name ?? "User"}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[var(--accent)]">
                        {(review.user.name ?? "U").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate text-[var(--text-primary)]">
                      {review.user.name ?? "Anonymous"}
                    </p>
                    <p className="text-[11px] truncate text-[var(--text-secondary)]">
                      {review.perfume.name} · {review.perfume.brand}
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-[rgba(139,92,246,0.12)] text-[var(--accent)]">
                    {review.overall_rating.toFixed(1)}★
                  </span>
                </div>
                <p className="text-xs mt-3 text-[var(--text-secondary)]">
                  {truncate(review.text, 120)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
