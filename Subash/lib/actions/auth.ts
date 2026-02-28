// lib/actions/auth.ts
// Server Actions for manual authentication (email + password)
// All actions run on the server — never exposed to the client bundle.

"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { verifyTurnstile } from "@/lib/turnstile";

// ─── Validation schemas ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  confirmPassword: z.string(),
  turnstileToken: z.string().min(1, "Please complete the security check"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionResult =
  | { success: true; message: string }
  | { success: false; errors: Record<string, string[]> | { _form: string[] } };

// ─── Register Action ──────────────────────────────────────────────────────────

export async function registerUser(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    turnstileToken: formData.get("turnstileToken"),
  };

  // 1. Validate input
  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, turnstileToken } = parsed.data;

  // 1.5 Verify bot token
  const isHuman = await verifyTurnstile(turnstileToken);
  if (!isHuman) {
    return {
      success: false,
      errors: { _form: ["Security check failed. Automated bots are not allowed."] },
    };
  }

  // 2. Check for existing account
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      errors: { _form: ["An account with this email already exists. Try signing in."] },
    };
  }

  // 3. Hash password — NEVER store plain text
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Create the user
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "STANDARD",
      review_count: 0,
      phoneVerified: false,
      authProvider: "CREDENTIALS",
    },
  });

  return {
    success: true,
    message: "Account created! You can now sign in.",
  };
}

// ─── Credentials Login Action ─────────────────────────────────────────────────

export async function loginWithCredentials(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // 1. Validate input
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  // 2. Attempt sign-in via NextAuth CredentialsProvider
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true, message: "Signed in successfully." };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          success: false,
          errors: { _form: ["Invalid email or password."] },
        };
      }
    }
    throw error; // Re-throw unexpected errors
  }
}
