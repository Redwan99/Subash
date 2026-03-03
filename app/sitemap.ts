import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Fetch all Perfume slugs
    const perfumes = await prisma.perfume.findMany({
        select: { slug: true, updatedAt: true },
    });

    // Fetch all Creator IDs
    const creators = await prisma.creator.findMany({
        select: { id: true, createdAt: true },
    });

    const perfumeUrls = perfumes.map((perfume) => ({
        url: `${baseUrl}/perfume/${perfume.slug}`,
        lastModified: perfume.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creatorUrls = creators.map((creator: any) => ({
        url: `${baseUrl}/creators/${creator.id}`,
        lastModified: creator.createdAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
    }));

    const staticUrls = ["", "/perfume", "/creators", "/shops", "/fragram"].map(
        (route) => ({
            url: `${baseUrl}${route}`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: route === "" ? 1.0 : 0.9,
        })
    );

    return [...staticUrls, ...perfumeUrls, ...creatorUrls];
}
