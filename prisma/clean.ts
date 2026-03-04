// prisma/clean.ts
// Wipes reviews + perfumes so the DB is ready for a fresh Kaggle import.
// Usage: npm run clean

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[DEL] Deleting reviews...");
  const { count: rc } = await prisma.review.deleteMany({});
  console.log(`   ↳ ${rc} reviews deleted`);

  console.log("[DEL] Deleting review upvotes...");
  const { count: ru } = await prisma.reviewUpvote.deleteMany({});
  console.log(`   ↳ ${ru} review upvotes deleted`);

  console.log("[DEL] Deleting dupe votes...");
  const { count: dv } = await prisma.dupeVote.deleteMany({});
  console.log(`   ↳ ${dv} dupe votes deleted`);

  console.log("[DEL] Deleting wardrobe items...");
  const { count: wi } = await prisma.wardrobeItem.deleteMany({});
  console.log(`   ↳ ${wi} wardrobe items deleted`);

  console.log("[DEL] Deleting Fragram posts...");
  const { count: fp } = await prisma.fragramPost.deleteMany({});
  console.log(`   ↳ ${fp} fragram posts deleted`);

  console.log("[DEL] Deleting decant listings...");
  const { count: dl } = await prisma.decantListing.deleteMany({});
  console.log(`   ↳ ${dl} decant listings deleted`);

  console.log("[DEL] Deleting perfumes...");
  const { count: pc } = await prisma.perfume.deleteMany({});
  console.log(`   ↳ ${pc} perfumes deleted`);

  console.log("\n[DONE] Database wiped clean! Ready for: npm run import-csv");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
