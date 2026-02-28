// app/creators/[id]/page.tsx
// Phase 10 — Creator Profile Page (by DB creator ID)

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Globe, BookOpen, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyPrisma = prisma as any;

type Perfume = { id: string; slug: string; name: string; brand: string; image_url: string | null; accords: string[]; gender: string | null };
type Creator = { id: string; name: string; bio: string | null; image: string | null; website: string | null; perfumes: Perfume[] };

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const creator = await anyPrisma.creator.findUnique({ where: { id }, select: { name: true, bio: true } }).catch(() => null);
    if (!creator) return { title: "Creator | Subash" };

    const title = `${creator.name} — Master Nose | Subash`;
    const description = creator.bio?.slice(0, 160) ?? `Explore the fragrance portfolio of ${creator.name}.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "profile",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        }
    };
}

export default async function CreatorProfilePage({ params }: Props) {
    const { id } = await params;

    const creator: Creator | null = await anyPrisma.creator.findUnique({
        where: { id },
        include: {
            perfumes: {
                select: { id: true, slug: true, name: true, brand: true, image_url: true, accords: true, gender: true },
                orderBy: [{ brand: "asc" }, { name: "asc" }],
            },
        },
    }).catch(() => null);

    if (!creator) notFound();

    const initials = creator.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

    return (
        <div className="min-h-screen px-4 md:px-6 py-6 max-w-6xl mx-auto">
            <Link href="/creators" className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
                <ChevronLeft size={14} /> All Creators
            </Link>

            {/* Profile header */}
            <div className="glass rounded-3xl border border-[var(--bg-glass-border)] p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="relative w-24 h-24 shrink-0">
                        {creator.image ? (
                            <Image src={creator.image} alt={creator.name} fill className="rounded-full object-cover" />
                        ) : (
                            <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-[0_0_32px_rgba(245,158,11,0.3)]"
                                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-1">{creator.name}</h1>
                        <p className="text-sm text-[var(--accent)] font-semibold mb-3">
                            {creator.perfumes.length} {creator.perfumes.length === 1 ? "fragrance" : "fragrances"} in the portfolio
                        </p>
                        {creator.bio && (
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-2xl">{creator.bio}</p>
                        )}
                        {creator.website && (
                            <a href={creator.website} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-3 text-xs text-[var(--accent)] hover:underline">
                                <Globe size={12} /> Visit website
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Portfolio */}
            <div className="flex items-center gap-2 mb-4">
                <BookOpen size={15} className="text-[var(--accent)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Portfolio</h2>
            </div>

            {creator.perfumes.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-muted)]">
                    <span className="text-3xl block mb-2">🧴</span>
                    No perfumes linked to this creator yet.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {creator.perfumes.map((p: Perfume) => (
                        <Link key={p.id} href={`/perfume/${p.slug}`} prefetch={false}>
                            <div className="group rounded-2xl overflow-hidden border border-[var(--bg-glass-border)] hover:border-[rgba(139,92,246,0.35)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(139,92,246,0.15)] transition-all duration-300 glass">
                                <div className="relative h-36 bg-gradient-to-b from-[rgba(139,92,246,0.06)] to-transparent flex items-center justify-center">
                                    {p.image_url ? (
                                        <Image src={p.image_url} alt={p.name} fill sizes="200px"
                                            className="object-contain p-3 transition-transform duration-500 group-hover:scale-105" unoptimized />
                                    ) : (
                                        <span className="text-4xl opacity-25">🧴</span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] truncate mb-0.5">{p.brand}</p>
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug mb-1.5">{p.name}</h3>
                                    <div className="flex flex-wrap gap-1">
                                        {p.accords.slice(0, 2).map((a: string) => (
                                            <span key={a} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(139,92,246,0.1)] text-[var(--text-muted)] capitalize">{a}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
