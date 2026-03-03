/**
 * prisma/fix-images.ts
 * Updates all perfume image_url to stable picsum placeholders
 * keyed on the perfume's cuid so each perfume gets a consistent image.
 *
 * Run: npm run fix-images
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("\n🖼  Fixing perfume image URLs…\n");

  const perfumes = await prisma.perfume.findMany({ select: { id: true } });
  console.log(`  Found ${perfumes.length} perfumes to update.\n`);

  // Build a deterministic seed per perfume from its cuid
  const updates = perfumes.map((p) => {
    // Take last 8 chars of cuid as seed (avoids collision while staying short)
    const seed = p.id.replace(/[^a-z0-9]/gi, "").slice(-10);
    return prisma.perfume.update({
      where: { id: p.id },
      data: { image_url: `https://picsum.photos/seed/${seed}/800/600` },
    });
  });

  // Run in batches of 100 to avoid overwhelming the DB connection
  const BATCH = 100;
  let done = 0;
  for (let i = 0; i < updates.length; i += BATCH) {
    await prisma.$transaction(updates.slice(i, i + BATCH));
    done += Math.min(BATCH, updates.length - i);
    console.log(`  ✅ ${done}/${updates.length} updated`);
  }

  console.log("\n🎉  All image URLs updated to picsum.photos placeholders!\n");
}

main()
  .catch((err) => {
    console.error("\n💥 Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
