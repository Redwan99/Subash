// components/layout/ScentOfTheDay.tsx
import { Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getScentOfTheDay } from "@/lib/actions/sotd";

export async function ScentOfTheDay() {
    const potd = await getScentOfTheDay();

    if (!potd || !potd.perfume) return null;

    const perfume = potd.perfume;
    const displayImage = perfume.transparentImageUrl || perfume.image_url;

        return (
        <Link href={`/perfume/${perfume.slug}`} className="block group gpu-accelerate transition-transform duration-200 active:scale-[0.97]">
            <div className="rounded-2xl p-4 glass border border-[var(--bg-glass-border)] bg-black/5 dark:bg-white/5 flex flex-col">
                {/* Poster image with overlaid badge */}
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-black/30">
                    {displayImage ? (
                        <Image
                            src={displayImage}
                            alt={perfume.name}
                            fill
                            priority
                            className={`object-contain p-3 transform group-hover:scale-105 transition-transform duration-500 ${
                                perfume.transparentImageUrl ? "" : "mix-blend-multiply dark:mix-blend-normal"
                            }`}
                            sizes="160px"
                            unoptimized
                        />
                    ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-4xl">🧴</span>
                    )}

                    <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-gray-900 dark:text-white">
                        <Sparkles size={11} className="text-brand-400" />
                        <span>✨ Scent of the Day</span>
                    </div>
                </div>

                {/* Textual info */}
                <div className="mt-1">
                    <p className="text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                        {perfume.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {perfume.brand}
                    </p>
                </div>
            </div>
        </Link>
    );
}
