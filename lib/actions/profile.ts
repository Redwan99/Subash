"use server";
// lib/actions/profile.ts
// Update current user's bio/name.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60).trim(),
  bio:  z.string().max(200, "Bio max 200 characters").optional(),
});

export type UpdateProfileState = {
  success: boolean;
  error?: string;
  fieldErrors?: { name?: string; bio?: string };
};

export async function updateProfile(
  _: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not signed in." };

  const raw = {
    name: formData.get("name"),
    bio:  formData.get("bio") ?? undefined,
  };

  const parsed = UpdateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Please fix the fields below.",
      fieldErrors: { name: fe.name?.[0], bio: fe.bio?.[0] },
    };
  }

  const { name, bio } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { name, bio: bio ?? null },
  });

  revalidatePath(`/user/${session.user.id}`);
  revalidatePath("/profile");

  return { success: true };
}
