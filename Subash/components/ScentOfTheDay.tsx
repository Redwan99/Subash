"use client";
// components/ScentOfTheDay.tsx
// Phase 25 — Scent of the Day Hero Component

import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, Quote } from "lucide-react";
import { type SOTDData } from "@/lib/actions/sotd";
import { cn } from "@/lib/utils";

export function ScentOfTheDay({ data }: { data: SOTDData | null }) {
    if (!data) return null;

    const { perfume } = data;
    const displayImage = perfume.transparentImageUrl || perfume.image_url;

    return (
        <div className="relative group">
            {/* Ambient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-[#A78BFA] rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

            <div className="relative glass-card rounded-[1.8rem] overflow-hidden border border-white/20 dark:border-white/10 shadow-xl shadow-black/5 flex flex-col md:flex-row gap-6 p-6 md:p-8">

                {/* Left: Image & Badge */}
                <div className="w-full md:w-48 shrink-0 relative">
                    <div className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-white/50 dark:bg-black/20 flex items-center justify-center p-4 border border-white/20">
                        {displayImage ? (
                            <Image
                                src={displayImage}
                                alt={perfume.name}
                                fill
                                className={`object-contain p-2 transform group-hover:scale-105 transition-transform duration-500 ${
                                    perfume.transparentImageUrl ? "" : "mix-blend-multiply dark:mix-blend-normal"
                                }`}
                                unoptimized
                            />
                        ) : (
                            <span className="text-6xl">🧴</span>
                        )}

                        {/* POTD Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold shadow-lg shadow-[var(--accent)]/40">
                            <Sparkles size={10} fill="currentColor" />
                            SOTD
                        </div>
                    </div>
                </div>

                {/* Right: Content */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-1">
                            {new Date(data.date).toLocaleDateString("en-BD", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-[var(--text-primary)] leading-tight mb-1">
                            {perfume.name}
                        </h2>
                        <p className="text-sm font-medium text-[var(--text-secondary)] opacity-80 mb-4 italic">
                            by {perfume.brand}
                        </p>

                        {data.note && (
                            <div className="relative bg-white/5 dark:bg-black/10 rounded-xl p-4 border border-white/10 mb-6">
                                <Quote size={24} className="absolute -top-3 -left-1 text-[var(--accent)] opacity-20 transform -rotate-12" />
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed italic relative z-10">
                                    {data.note}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link
                            href={`/perfume/${perfume.slug}`}
                            className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center gap-2 hover:bg-[var(--accent-hover)] transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-[var(--accent)]/25"
                        >
                            Discover Scent <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                {/* Floating Decorative Elements */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none" />
            </div>
        </div>
    );
}
