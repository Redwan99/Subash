"use server";
// lib/actions/decant.ts
// Phase 5 — Server actions for the Decant Marketplace & Wardrobe.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// ─── Create Decant Listing ─────────────────────────────────────────────────────

const CreateDecantSchema = z.object({
  perfumeId: z.string().min(1, "Please select a perfume."),
  batch_code: z.string().min(1, "Batch code is required.").max(30),
  price_5ml: z.coerce.number().int().positive().optional().or(z.literal(0)).transform((v) => (v === 0 ? undefined : v)),
  price_10ml: z.coerce.number().int().positive().optional().or(z.literal(0)).transform((v) => (v === 0 ? undefined : v)),
  proof_image_url: z.string().url("Must be a valid URL (e.g. Imgur link)."),
});

export type CreateDecantState = {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof CreateDecantSchema>, string>>;
  listingId?: string;
};

export async function createDecantListing(
  _: CreateDecantState,
  formData: FormData
): Promise<CreateDecantState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const raw = {
    perfumeId: formData.get("perfumeId"),
    batch_code: formData.get("batch_code"),
    price_5ml: formData.get("price_5ml") || 0,
    price_10ml: formData.get("price_10ml") || 0,
    proof_image_url: formData.get("proof_image_url"),
  };

  const parsed = CreateDecantSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: CreateDecantState["fieldErrors"] = {};
    for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[k as keyof typeof fieldErrors] = v?.[0];
    }
    return { success: false, fieldErrors };
  }

  const { perfumeId, batch_code, price_5ml, price_10ml, proof_image_url } = parsed.data;

  if (!price_5ml && !price_10ml) {
    return { success: false, error: "Please provide at least one price (5ml or 10ml)." };
  }

  const listing = await prisma.decantListing.create({
    data: {
      perfumeId,
      sellerId: session.user.id,
      batch_code,
      price_5ml: price_5ml ?? null,
      price_10ml: price_10ml ?? null,
      proof_image_url,
      status: "AVAILABLE",
    },
  });

  revalidatePath("/decants");
  const p = await prisma.perfume.findUnique({ where: { id: perfumeId }, select: { slug: true } });
  if (p) revalidatePath(`/perfume/${p.slug}`);

  return { success: true, listingId: listing.id };
}

// ─── Wardrobe Actions ───────────────────────────────────────────────────────────

export type WardrobeShelf = "HAVE" | "HAD" | "WANT" | "SIGNATURE";

export type WardrobeActionState = {
  success: boolean;
  error?: string;
};

export async function upsertWardrobeItem(
  perfumeId: string,
  shelf: WardrobeShelf
): Promise<WardrobeActionState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Sign in required." };

  await prisma.wardrobeItem.upsert({
    where: { userId_perfumeId: { userId: session.user.id, perfumeId } },
    update: { shelf },
    create: { userId: session.user.id, perfumeId, shelf },
  });

  revalidatePath(`/user/${session.user.id}`);
  return { success: true };
}

export async function removeWardrobeItem(
  perfumeId: string
): Promise<WardrobeActionState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Sign in required." };

  await prisma.wardrobeItem
    .delete({ where: { userId_perfumeId: { userId: session.user.id, perfumeId } } })
    .catch(() => null); // ignore if not found

  revalidatePath(`/user/${session.user.id}`);
  return { success: true };
}
