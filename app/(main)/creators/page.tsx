// app/creators/page.tsx
// Phase 10 — Master Noses (Creators / Perfumers) Directory

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { Users, Sparkles } from "lucide-react";
import { getFeatureMap } from "@/lib/features";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
    title: "The Noses — Master Perfumers | Subash",
    description: "Discover the master perfumers behind the world's greatest fragrances.",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyPrisma = prisma as any;

type CreatorEntry = { id: string | null; name: string; count: number; bio: string | null; image: string | null };

export default async function CreatorsPage() {
    const features = await getFeatureMap();
    if (features.ENABLE_CREATORS === false) {
        notFound();
    }

    const [dbCreators, topPerfumers] = await Promise.all([
        anyPrisma.creator.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { perfumes: true } } },
        }).catch(() => []),
        prisma.perfume.groupBy({
            by: ["perfumer"],
            where: { perfumer: { not: null } },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 120,
        }),
    ]);

    const dbNames = new Set(
        (dbCreators as { name: string }[]).map((c) => c.name.toLowerCase())
    );

    const fallbackPerfumersInitial = topPerfumers
        .filter((p) => p.perfumer && !dbNames.has(p.perfumer.toLowerCase()))
        .map((p) => ({ id: null, name: p.perfumer!, count: p._count.id, bio: null, image: null }));

    // Fetch one perfume image for each fallback perfumer to use as avatar
    const perfumerNames = fallbackPerfumersInitial.map(p => p.name);
    const fallbackImages = await prisma.perfume.findMany({
        where: { perfumer: { in: perfumerNames }, image_url: { not: null } },
        distinct: ["perfumer"],
        select: { perfumer: true, image_url: true },
    });
    const imageMap = new Map(fallbackImages.map(img => [img.perfumer, img.image_url]));

    const fallbackPerfumers: CreatorEntry[] = fallbackPerfumersInitial.map(p => ({
        ...p,
        image: imageMap.get(p.name) || null
    }));

    const dbList: CreatorEntry[] = (dbCreators as { id: string; name: string; bio: string | null; image: string | null; _count: { perfumes: number } }[])
        .map((c) => ({ id: c.id, name: c.name, count: c._count.perfumes, bio: c.bio, image: c.image }));

    const allCreators = [...dbList, ...fallbackPerfumers];

    return (
        <div className="min-h-screen px-4 md:px-6 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                    <Sparkles size={17} className="text-[#F59E0B]" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[var(--text-primary)]">The Noses</h1>
                    <p className="text-xs text-[var(--text-muted)]">Master perfumers behind the world&apos;s greatest fragrances</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6 ml-12">
                <Users size={13} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-muted)]">{allCreators.length} creators</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {allCreators.map((creator, i) => {
                    const initials = creator.name
                        .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                    const href = creator.id
                        ? `/creators/${creator.id}`
                        : `/creators/name/${encodeURIComponent(creator.name)}`;

                    return (
                        <Link key={`${creator.name}-${i}`} href={href} prefetch={false}>
                            <div className="group relative rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)] glass border border-[var(--bg-glass-border)] hover:border-[rgba(245,158,11,0.25)] cursor-pointer">
                                {/* Avatar */}
                                <div className="relative w-16 h-16 mx-auto mb-3">
                                    {creator.image ? (
                                        <Image src={creator.image} alt={creator.name} fill className="rounded-full object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-black text-white"
                                            style={{ background: `linear-gradient(135deg, hsl(${(i * 47) % 360}, 70%, 50%), hsl(${(i * 47 + 40) % 360}, 70%, 35%))` }}>
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)] leading-snug line-clamp-2 mb-1">{creator.name}</h2>
                                <p className="text-[10px] text-[var(--text-muted)]">{creator.count} {creator.count === 1 ? "perfume" : "perfumes"}</p>
                                {creator.bio && (
                                    <p className="text-[10px] mt-1.5 text-[var(--text-secondary)] line-clamp-2 opacity-75">{creator.bio}</p>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {allCreators.length === 0 && (
                <div className="flex flex-col items-center py-24 text-[var(--text-muted)]">
                    <span className="text-4xl mb-3">👃</span>
                    <p className="font-semibold">No creators found yet.</p>
                    <p className="text-sm mt-1">Perfumers from the catalogue will appear here once the database is synced.</p>
                </div>
            )}
        </div>
    );
}
