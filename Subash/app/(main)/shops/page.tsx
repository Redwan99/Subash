// app/shops/page.tsx
// Phase 11 — Verified Boutiques Directory with Map View placeholder

import { Metadata } from "next";
import Link from "next/link";
import { ShopsClient } from "@/components/shops/ShopsClient";
import { getFeatureMap } from "@/lib/features";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Boutiques & Verified Shops | Subash",
    description: "Discover verified perfume boutiques and retailers in Bangladesh and beyond.",
    openGraph: {
        title: "Boutiques & Verified Shops | Subash",
        description: "Discover verified perfume boutiques and retailers in Bangladesh and beyond.",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Boutiques & Verified Shops | Subash",
        description: "Discover verified perfume boutiques and retailers in Bangladesh and beyond.",
    },
};

export default async function ShopsPage() {
    const features = await getFeatureMap();
    if (features.ENABLE_SHOPS === false) {
        notFound();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyPrisma = prisma as any;

    const shops = await anyPrisma.shop.findMany({
        orderBy: [{ isVerified: "desc" }, { name: "asc" }],
        include: {
            _count: { select: { deals: true } },
        },
    }).catch(() => [] as unknown[]);

    return <ShopsClient shops={shops as ShopWithCount[]} />;
}

export type ShopWithCount = {
    id: string;
    name: string;
    website: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    isVerified: boolean;
    description: string | null;
    imageUrl: string | null;
    _count: { deals: number };
};
