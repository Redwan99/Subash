"use server";
import prisma from "@/lib/prisma";

export async function searchEncyclopedia(filters: {
  query?: string;
  brands?: string[];
  accords?: string[];
  sort?: string;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    
    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query } },
        { brand: { contains: filters.query } }
      ];
    }

    if (filters.brands && filters.brands.length > 0) {
      where.brand = { in: filters.brands };
    }

    if (filters.accords && filters.accords.length > 0) {
      // SQLite JSON string search workaround
      where.AND = filters.accords.map(accord => ({
        main_accords: { contains: accord }
      }));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { searchCount: 'desc' }; // Default sort
    if (filters.sort === 'newest') orderBy = { release_year: 'desc' };
    if (filters.sort === 'a-z') orderBy = { name: 'asc' };

    const results = await prisma.perfume.findMany({
      where,
      orderBy,
      take: 50,
      select: { id: true, slug: true, name: true, brand: true, image_url: true, transparentImageUrl: true, searchCount: true }
    });

    return results;
  } catch (error) {
    console.error("Matrix Search Error:", error);
    return [];
  }
}
