"use server";
// lib/actions/deals.ts
// Phase 5 — Seller deal management actions.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ─── Create Deal ───────────────────────────────────────────────────────────────

const CreateDealSchema = z.object({
  perfumeId: z.string().min(1),
  sellerId: z.string().min(1),
  price: z.number().int().positive(),
  link: z.string().url().optional(),
});

export async function createDeal(input: z.infer<typeof CreateDealSchema>): Promise<{
  success: boolean;
  error?: string;
  dealId?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };

  const role = session.user.role;
  if (role !== "SELLER" && role !== "SUPER_ADMIN") {
    return { success: false, error: "Only sellers can post deals." };
  }

  const parsed = CreateDealSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { perfumeId, sellerId, price, link } = parsed.data;

  // Ensure seller only creates deals for themselves
  if (sellerId !== session.user.id && role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  const deal = await prisma.deal.create({
    data: {
      perfumeId,
      sellerId,
      price,
      link: link ?? null,
      is_active: true,
      is_featured: false,
    },
  });

  revalidatePath("/dashboard/deals");
  const p = await prisma.perfume.findUnique({ where: { id: perfumeId }, select: { slug: true } });
  if (p) revalidatePath(`/perfume/${p.slug}`);

  return { success: true, dealId: deal.id };
}

// ─── Toggle Deal Active ────────────────────────────────────────────────────────

export async function toggleDealActive(
  dealId: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };

  // Verify ownership
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { sellerId: true, perfumeId: true, perfume: { select: { slug: true } } } });
  if (
    !deal ||
    (deal.sellerId !== session.user.id && session.user.role !== "SUPER_ADMIN")
  ) {
    return { success: false, error: "Not authorized to modify this deal." };
  }

  await prisma.deal.update({ where: { id: dealId }, data: { is_active } });

  revalidatePath("/dashboard/deals");
  if (deal.perfume?.slug) revalidatePath(`/perfume/${deal.perfume.slug}`);

  return { success: true };
}

// ─── Delete Deal ───────────────────────────────────────────────────────────────

export async function deleteDeal(dealId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { sellerId: true, perfumeId: true, perfume: { select: { slug: true } } } });
  if (
    !deal ||
    (deal.sellerId !== session.user.id && session.user.role !== "SUPER_ADMIN")
  ) {
    return { success: false, error: "Not authorized." };
  }

  await prisma.deal.delete({ where: { id: dealId } });

  revalidatePath("/dashboard/deals");
  if (deal.perfume?.slug) revalidatePath(`/perfume/${deal.perfume.slug}`);

  return { success: true };
}
