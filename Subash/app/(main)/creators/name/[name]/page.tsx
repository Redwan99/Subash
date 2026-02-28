// app/creators/name/[name]/page.tsx
// Phase 10 — Creator profile by perfumer name string (fallback for Kaggle data)

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BookOpen, ChevronLeft } from "lucide-react";

type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { name } = await params;
    const decoded = decodeURIComponent(name);
    return {
        title: `${decoded} — Perfumer | Subash`,
        description: `Explore all fragrances created by ${decoded}.`,
    };
}

export default async function CreatorByNamePage({ params }: Props) {
    const { name } = await params;
    const decoded = decodeURIComponent(name);

    const perfumes = await prisma.perfume.findMany({
        where: { perfumer: { equals: decoded, mode: "insensitive" } },
        select: { id: true, slug: true, name: true, brand: true, image_url: true, accords: true, gender: true },
        orderBy: [{ brand: "asc" }, { name: "asc" }],
    });

    if (perfumes.length === 0) notFound();

    const initials = decoded.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

    return (
        <div className="min-h-screen px-4 md:px-6 py-6 max-w-6xl mx-auto">
            <Link href="/creators" className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
                <ChevronLeft size={14} /> All Creators
            </Link>

            {/* Profile header */}
            <div className="glass rounded-3xl border border-[var(--bg-glass-border)] p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-[0_0_32px_rgba(245,158,11,0.2)] shrink-0"
                        style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                        {initials}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-1">{decoded}</h1>
                        <p className="text-sm text-[var(--accent)] font-semibold">
                            {perfumes.length} {perfumes.length === 1 ? "fragrance" : "fragrances"} catalogued
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                            Profile populated from catalogue data. Full bio coming soon.
                        </p>
                    </div>
                </div>
            </div>

            {/* Portfolio */}
            <div className="flex items-center gap-2 mb-4">
                <BookOpen size={15} className="text-[var(--accent)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Portfolio</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {perfumes.map((p) => (
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
                                    {p.accords.slice(0, 2).map((a) => (
                                        <span key={a} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(139,92,246,0.1)] text-[var(--text-muted)] capitalize">{a}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
