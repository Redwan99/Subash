"use server";
// lib/actions/profile.ts
// Update current user's bio/name and change password.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sendPasswordChangedEmail } from "@/lib/email";

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

// ─── Change Password ──────────────────────────────────────────────────────────

export type ChangePasswordState = {
  success: boolean;
  error?: string;
};

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not signed in." };

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user) return { success: false, error: "User not found." };

  // If user already has a password, verify the current one
  if (user.password) {
    if (!currentPassword) {
      return { success: false, error: "Current password is required." };
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return { success: false, error: "Current password is incorrect." };
    }
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  // Notify user
  const userDetails = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } });
  if (userDetails?.email) {
    sendPasswordChangedEmail(userDetails.email, userDetails.name ?? "User").catch(console.error);
  }

  return { success: true };
}

// ─── Update Username ──────────────────────────────────────────────────────────

const UsernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(
    /^[a-zA-Z][a-zA-Z0-9._]*$/,
    "Must start with a letter and contain only letters, numbers, dots, or underscores"
  )
  .transform((v) => v.toLowerCase());

export type UpdateUsernameState = {
  success: boolean;
  error?: string;
};

export async function updateUsername(
  username: string
): Promise<UpdateUsernameState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not signed in." };

  const parsed = UsernameSchema.safeParse(username);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid username." };
  }

  const cleanUsername = parsed.data;

  // Check uniqueness (case-insensitive — stored lowercase)
  const existing = await prisma.user.findUnique({
    where: { username: cleanUsername },
    select: { id: true },
  });

  if (existing && existing.id !== session.user.id) {
    return { success: false, error: "That username is already taken." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { username: cleanUsername },
  });

  revalidatePath(`/user/${session.user.id}`);
  revalidatePath("/profile");

  return { success: true };
}

export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; error?: string }> {
  const parsed = UsernameSchema.safeParse(username);
  if (!parsed.success) {
    return { available: false, error: parsed.error.errors[0]?.message };
  }

  const session = await auth();
  const existing = await prisma.user.findUnique({
    where: { username: parsed.data },
    select: { id: true },
  });

  const available = !existing || existing.id === session?.user?.id;
  return { available };
}
