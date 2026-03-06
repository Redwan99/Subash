import prisma from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brands | Subash",
  description: "Browse all perfume brands",
};

function brandSlug(brand: string) {
  return brand
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default async function BrandsPage() {
  const brandGroups = await prisma.perfume.groupBy({
    by: ["brand"],
    _count: { brand: true },
    orderBy: { _count: { brand: "desc" } },
  });

  const brands = brandGroups.map((g) => ({
    name: g.brand,
    count: g._count.brand,
    slug: brandSlug(g.brand),
  }));

  // Group by first letter for alphabetical navigation
  const grouped = brands.reduce<Record<string, typeof brands>>((acc, b) => {
    const letter = b.name[0]?.toUpperCase() || "#";
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(b);
    return acc;
  }, {});

  const sortedLetters = Object.keys(grouped).sort();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Brands</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {brands.length} brand{brands.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Letter quick-nav */}
      <div className="flex flex-wrap gap-1.5">
        {sortedLetters.map((letter) => (
          <a
            key={letter}
            href={`#letter-${letter}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            {letter}
          </a>
        ))}
      </div>

      {/* Brand list grouped by letter */}
      <div className="space-y-6">
        {sortedLetters.map((letter) => (
          <section key={letter} id={`letter-${letter}`}>
            <h2 className="text-lg font-bold text-[var(--accent)] mb-3 sticky top-0 bg-[var(--bg-primary)] py-2 z-10">
              {letter}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {grouped[letter].map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brand/${brand.slug}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-colors group"
                >
                  <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                    {brand.name}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full shrink-0 ml-2">
                    {brand.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
