// lib/actions/auth.ts
// Server Actions for manual authentication (email + password)
// All actions run on the server — never exposed to the client bundle.

"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendWelcomeEmail, sendAdminNewUserNotification, sendAccountInfoEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from "@/lib/email";

// ─── Validation schemas ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
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
  identifier: z.string().min(1, "Email or username is required"),
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
    username: formData.get("username"),
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

  const { name, username, email, password, turnstileToken } = parsed.data;

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

  // 2.5 Check for existing username
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return {
      success: false,
      errors: { username: ["This username is already taken."] },
    };
  }

  // 3. Hash password — NEVER store plain text
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Create the user — first user in the DB becomes SUPER_ADMIN
  const userCount = await prisma.user.count();
  const assignedRole = userCount === 0 ? "SUPER_ADMIN" : "STANDARD";

  await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      role: assignedRole,
      review_count: 0,
      phoneVerified: false,
      authProvider: "CREDENTIALS",
    },
  });

  // Send emails (fire-and-forget, don't block registration)
  sendWelcomeEmail(email, name).catch(console.error);
  sendAccountInfoEmail(email, { name, email, role: assignedRole }).catch(console.error);

  // Notify admin(s) of new signup
  prisma.user
    .findMany({ where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } }, select: { email: true } })
    .then((admins) => {
      for (const admin of admins) {
        if (admin.email) {
          sendAdminNewUserNotification(admin.email, { name, email }).catch(console.error);
        }
      }
    })
    .catch(console.error);

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
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  };

  // 1. Validate input
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { identifier, password } = parsed.data;

  // 2. Attempt sign-in via NextAuth CredentialsProvider
  try {
    await signIn("credentials", {
      email: identifier,
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

// ─── Forgot Password Action ──────────────────────────────────────────────────

export async function requestPasswordReset(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  if (!email || !z.string().email().safeParse(email).success) {
    return { success: false, errors: { _form: ["Please enter a valid email address."] } };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true, message: "If an account exists with that email, a reset link has been sent." };
  }

  // Generate a secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Remove any existing tokens for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  // Store token
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  // Send reset email
  sendPasswordResetEmail(email, token).catch(console.error);

  return { success: true, message: "If an account exists with that email, a reset link has been sent." };
}

// ─── Reset Password Action ───────────────────────────────────────────────────

export async function resetPassword(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { success: false, errors: { _form: ["Invalid or missing reset token."] } };
  }
  if (!password || password.length < 8) {
    return { success: false, errors: { password: ["Password must be at least 8 characters."] } };
  }
  if (password !== confirmPassword) {
    return { success: false, errors: { confirmPassword: ["Passwords do not match."] } };
  }

  // Find and validate token
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    // Clean up expired token
    if (record) await prisma.verificationToken.delete({ where: { token } });
    return { success: false, errors: { _form: ["This reset link has expired. Please request a new one."] } };
  }

  // Update password
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email: record.identifier },
    data: { password: hashedPassword },
  });

  // Delete the used token
  await prisma.verificationToken.delete({ where: { token } });

  // Notify user
  const user = await prisma.user.findUnique({ where: { email: record.identifier }, select: { name: true, email: true } });
  if (user?.email) {
    sendPasswordChangedEmail(user.email, user.name ?? "User").catch(console.error);
  }

  return { success: true, message: "Password reset successfully. You can now sign in." };
}
