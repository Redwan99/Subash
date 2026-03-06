import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await findBrandBySlug(slug);
  if (!brand) return { title: "Brand Not Found" };
  return {
    title: `${brand} Perfumes | Subash`,
    description: `Browse all perfumes by ${brand}`,
  };
}

async function findBrandBySlug(slug: string): Promise<string | null> {
  const brands = await prisma.perfume.groupBy({
    by: ["brand"],
  });

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const match = brands.find((b) => normalize(b.brand) === slug);
  return match?.brand ?? null;
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;
  const brandName = await findBrandBySlug(slug);
  if (!brandName) notFound();

  const perfumes = await prisma.perfume.findMany({
    where: { brand: brandName },
    select: {
      id: true,
      name: true,
      brand: true,
      slug: true,
      image_url: true,
      transparentImageUrl: true,
      gender: true,
      rating_value: true,
      rating_count: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { searchCount: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/brand"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-2 inline-block"
        >
          &larr; All Brands
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{brandName}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {perfumes.length} perfume{perfumes.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {perfumes.map((perfume) => (
          <Link
            key={perfume.id}
            href={`/perfume/${perfume.slug}`}
            className="flex flex-col bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:shadow-lg hover:shadow-[var(--accent)]/8 transition-[transform,border-color,box-shadow] duration-200 group"
          >
            <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-gradient-to-b from-white/5 to-transparent p-3 sm:p-5 flex items-center justify-center">
              <Image
                src={perfume.transparentImageUrl || perfume.image_url || "/placeholder-perfume.png"}
                alt={perfume.name}
                fill
                className="object-contain p-4 drop-shadow-xl group-hover:scale-105 transition-transform duration-500 ease-out"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
              {perfume.gender && (
                <span
                  className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full capitalize border ${
                    perfume.gender.toLowerCase() === "men"
                      ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                      : perfume.gender.toLowerCase() === "women"
                      ? "text-pink-400 bg-pink-500/10 border-pink-500/20"
                      : "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20"
                  }`}
                >
                  {perfume.gender}
                </span>
              )}
            </div>
            <div className="p-3 sm:p-4 flex flex-col gap-0.5 border-t border-[var(--bg-glass-border)]">
              <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base line-clamp-1 group-hover:text-[var(--accent)] transition-colors duration-200">
                {perfume.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                {perfume.rating_value && (
                  <span className="flex items-center gap-0.5">
                    ★ {perfume.rating_value.toFixed(1)}
                  </span>
                )}
                {perfume._count.reviews > 0 && (
                  <span>{perfume._count.reviews} review{perfume._count.reviews !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {perfumes.length === 0 && (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p className="text-lg font-semibold">No perfumes found</p>
          <p className="text-sm mt-1">This brand doesn&apos;t have any perfumes yet.</p>
        </div>
      )}
    </div>
  );
}
