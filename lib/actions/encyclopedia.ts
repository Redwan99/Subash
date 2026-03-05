"use server";
import prisma from "@/lib/prisma";

// Mood → accords mapping for mood-based filtering
const MOOD_ACCORD_MAP: Record<string, string[]> = {
  romantic: ["floral", "vanilla", "musk", "rose", "jasmine"],
  fresh: ["citrus", "aquatic", "green", "ozonic", "aromatic"],
  cozy: ["amber", "vanilla", "woody", "warm spicy", "balsamic"],
  confident: ["leather", "oud", "spicy", "tobacco", "vetiver"],
  mysterious: ["smoky", "incense", "dark", "patchouli", "labdanum"],
};

export async function searchEncyclopedia(filters: {
  query?: string;
  brands?: string[];
  accords?: string[];
  gender?: string;
  notes?: string;
  mood?: string;
  weatherTags?: string[];
  timeTags?: string[];
  sort?: string;
  skip?: number;
  take?: number;
}) {
  try {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const where: any = {};
    const andClauses: any[] = [];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query } },
        { brand: { contains: filters.query } },
      ];
    }

    if (filters.brands && filters.brands.length > 0) {
      where.brand = { in: filters.brands };
    }

    if (filters.accords && filters.accords.length > 0) {
      // SQLite JSON string search workaround
      filters.accords.forEach((accord) => {
        andClauses.push({ accords: { contains: accord } });
      });
    }

    if (filters.gender) {
      where.gender = filters.gender;
    }

    // Notes text search across top/heart/base notes
    if (filters.notes && filters.notes.trim()) {
      const q = filters.notes.trim();
      andClauses.push({
        OR: [
          { top_notes: { contains: q } },
          { heart_notes: { contains: q } },
          { base_notes: { contains: q } },
        ],
      });
    }

    // Mood → translate to accords-based search
    if (filters.mood && MOOD_ACCORD_MAP[filters.mood]) {
      const moodAccords = MOOD_ACCORD_MAP[filters.mood];
      andClauses.push({
        OR: moodAccords.map((a) => ({ accords: { contains: a } })),
      });
    }

    // Weather tags — find perfumes whose reviews include these weather tags
    if (filters.weatherTags && filters.weatherTags.length > 0) {
      andClauses.push({
        reviews: {
          some: {
            AND: filters.weatherTags.map((tag) => ({
              weather_tags: { contains: tag },
            })),
          },
        },
      });
    }

    // Time tags — find perfumes whose reviews include these time tags
    if (filters.timeTags && filters.timeTags.length > 0) {
      andClauses.push({
        reviews: {
          some: {
            AND: filters.timeTags.map((tag) => ({
              time_tags: { contains: tag },
            })),
          },
        },
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { searchCount: "desc" }; // Default sort
    if (filters.sort === "newest") orderBy = { release_year: "desc" };
    if (filters.sort === "a-z") orderBy = { name: "asc" };
    if (filters.sort === "most-reviewed") orderBy = { reviews: { _count: "desc" } };

    // If take is explicitly set, use it; otherwise, fetch all perfumes
    const take = typeof filters.take === "number" ? filters.take : undefined;
    const skip = filters.skip ?? 0;

    const results = await prisma.perfume.findMany({
      where,
      orderBy,
      skip,
      ...(take !== undefined ? { take } : {}),
      select: {
        id: true, slug: true, name: true, brand: true,
        image_url: true, transparentImageUrl: true, searchCount: true,
        gender: true,
      },
    });

    return results;
  } catch (error) {
    console.error("Matrix Search Error:", error);
    return [];
  }
}
