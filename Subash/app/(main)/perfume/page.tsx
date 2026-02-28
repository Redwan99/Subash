// app/perfume/page.tsx
// Phase 10 — Perfume Encyclopedia
// Server component: loads all perfumes + distinct brands/accords for filters.

import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { EncyclopediaClient } from "@/components/perfume/EncyclopediaClient";
import { getFeatureMap } from "@/lib/features";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
    title: "Perfume Encyclopedia | Subash",
    description: "Explore thousands of fragrances — filter by brand, gender, accord, and more.",
};

// Top 30 accords used globally (curated)
const FEATURED_ACCORDS = [
    "vanilla", "woody", "fresh", "citrus", "floral", "musky", "sweet",
    "spicy", "amber", "rose", "oud", "aquatic", "green", "fruity",
    "powdery", "leather", "tobacco", "iris", "sandalwood", "patchouli",
];

export default async function PerfumeEncyclopediaPage({
    searchParams,
}: {
    searchParams: Promise<{ brand?: string; gender?: string; accord?: string }>;
}) {
    const features = await getFeatureMap();
    if (features.ENABLE_ENCYCLOPEDIA === false) {
        notFound();
    }

    const params = await searchParams;
    const PAGE_SIZE = 60;
    const skip = 0;

    // Build filters
    const where: Record<string, unknown> = {};
    if (params.brand) where.brand = params.brand;
    if (params.gender) where.gender = params.gender;
    if (params.accord) where.accords = { has: params.accord };

    const [perfumes, totalCount, topBrands] = await Promise.all([
        prisma.perfume.findMany({
            where,
            select: {
                id: true, slug: true, name: true, brand: true,
                image_url: true, gender: true, accords: true,
                release_year: true, perfumer: true,
            },
            orderBy: [{ brand: "asc" }, { name: "asc" }],
            take: PAGE_SIZE,
            skip,
        }),
        prisma.perfume.count({ where }),
        prisma.perfume.groupBy({
            by: ["brand"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 60,
        }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const brands = topBrands.map((b) => b.brand).sort();

    return (
        <EncyclopediaClient
            perfumes={perfumes}
            brands={brands}
            accords={FEATURED_ACCORDS}
            totalCount={totalCount}
            totalPages={totalPages}
            currentPage={1}
            activeFilters={{
                brand: params.brand ?? null,
                gender: params.gender ?? null,
                accord: params.accord ?? null,
            }}
        />
    );
}
