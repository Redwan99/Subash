// lib/actions/phone.ts
// Server Action: called after Firebase OTP verification succeeds on the client.
// The client verifies the OTP with Firebase, then calls this action to update
// the `phone` and `phoneVerified` fields in our Postgres users table.

"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PhoneSchema = z.object({
  phone: z
    .string()
    .regex(/^\+8801[3-9]\d{8}$/, "Enter a valid mobile number (+8801XXXXXXXXX)"),
});

export type PhoneActionResult =
  | { success: true }
  | { success: false; error: string };

export async function saveVerifiedPhone(phone: string): Promise<PhoneActionResult> {
  // 1. Must be authenticated
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  // 2. Validate format
  const parsed = PhoneSchema.safeParse({ phone });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 3. Check if number is already in use by another account
  const conflict = await prisma.user.findUnique({ where: { phone } });
  if (conflict && conflict.id !== session.user.id) {
    return { success: false, error: "This phone number is already linked to another account." };
  }

  // 4. Persist to DB
  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone, phoneVerified: true },
  });

  return { success: true };
}
