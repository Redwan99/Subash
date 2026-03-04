"use server";
// lib/actions/envvars.ts
// Server actions for managing encrypted environment variables from admin panel.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "MODERATOR")) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export type EnvVarItem = {
  id: string;
  key: string;
  value: string; // decrypted or masked
  masked: boolean;
  updatedAt: Date;
};

export async function getEnvVariables(): Promise<EnvVarItem[]> {
  await requireAdmin();

  const vars = await prisma.envVariable.findMany({
    orderBy: { key: "asc" },
  });

  return vars.map((v) => {
    let value: string;
    try {
      const decrypted = decrypt(v.value, v.iv, v.tag);
      value = v.masked ? "•".repeat(Math.min(decrypted.length, 20)) : decrypted;
    } catch {
      value = "[decryption error]";
    }
    return {
      id: v.id,
      key: v.key,
      value,
      masked: v.masked,
      updatedAt: v.updatedAt,
    };
  });
}

export async function getEnvVariableDecrypted(id: string): Promise<string | null> {
  await requireAdmin();

  const v = await prisma.envVariable.findUnique({ where: { id } });
  if (!v) return null;

  try {
    return decrypt(v.value, v.iv, v.tag);
  } catch {
    return null;
  }
}

export async function upsertEnvVariable(
  key: string,
  value: string,
  masked: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!key.trim()) return { success: false, error: "Key is required." };
    if (!value.trim()) return { success: false, error: "Value is required." };

    // Validate key format (uppercase, underscores, letters, numbers)
    if (!/^[A-Z][A-Z0-9_]*$/.test(key.trim())) {
      return { success: false, error: "Key must be UPPER_SNAKE_CASE (e.g., MY_API_KEY)." };
    }

    const { encrypted, iv, tag } = encrypt(value);

    await prisma.envVariable.upsert({
      where: { key: key.trim() },
      create: {
        key: key.trim(),
        value: encrypted,
        iv,
        tag,
        masked,
      },
      update: {
        value: encrypted,
        iv,
        tag,
        masked,
      },
    });

    // Also set it in the runtime process.env so it takes effect immediately
    process.env[key.trim()] = value;

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function deleteEnvVariable(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const v = await prisma.envVariable.findUnique({ where: { id } });
    if (!v) return { success: false, error: "Variable not found." };

    // Remove from runtime
    delete process.env[v.key];

    await prisma.envVariable.delete({ where: { id } });

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Load all encrypted env vars into process.env at startup.
 * Call this from the root layout or a middleware to hydrate env vars from DB.
 */
export async function hydrateEnvFromDB(): Promise<void> {
  try {
    const vars = await prisma.envVariable.findMany();
    for (const v of vars) {
      try {
        const decrypted = decrypt(v.value, v.iv, v.tag);
        process.env[v.key] = decrypted;
      } catch {
        console.warn(`[env] Failed to decrypt ${v.key}`);
      }
    }
  } catch {
    // DB not ready yet, skip
  }
}
