"use server";
// lib/actions/admin.ts
// Phase 9 — Secure Admin Server Actions
// All actions enforce SUPER_ADMIN role before executing.

import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { sendPasswordChangedEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Workaround: ReviewStatus not in Prisma client until `npx prisma db push` runs on the server.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWhere = any;

// ── Auth Guard ────────────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED: Not authenticated.");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== Role.SUPER_ADMIN) {
    throw new Error("FORBIDDEN: Admin access required.");
  }

  return session.user.id;
}

// ── Audit Logging ─────────────────────────────────────────────────────────────
export async function logAdminAction(userId: string, action: string, details?: string) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, details },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export async function getAuditLogs(limit = 100) {
  await requireAdmin();
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export async function getDashboardStats() {
  await requireAdmin();

  const [totalUsers, totalReviews, totalPerfumes, pendingReviews, spamReviews] =
    await Promise.all([
      prisma.user.count(),
      prisma.review.count(),
      prisma.perfume.count(),
      prisma.review.count({ where: { status: "PENDING" } as AnyWhere }),
      prisma.review.count({ where: { status: "SPAM" } as AnyWhere }),
    ]);

  return { totalUsers, totalReviews, totalPerfumes, pendingReviews, spamReviews };
}

// ── Recent Reviews (for moderation table) ─────────────────────────────────────
export async function getAdminReviews(limit = 50) {
  await requireAdmin();

  return prisma.review.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      text: true,
      overall_rating: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
      perfume: { select: { id: true, name: true, brand: true, slug: true } },
    } as AnyWhere,
  });
}

// ── Delete Review ─────────────────────────────────────────────────────────────
export async function deleteReviewAsAdmin(reviewId: string) {
  const adminId = await requireAdmin();

  await prisma.review.delete({ where: { id: reviewId } });
  await logAdminAction(adminId, "DELETE_REVIEW", `Deleted review ID: ${reviewId}`);

  revalidatePath("/admin");
  return { success: true };
}

// ── Mark Review as Spam ───────────────────────────────────────────────────────
export async function markReviewAsSpam(reviewId: string) {
  const adminId = await requireAdmin();

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: "SPAM" } as AnyWhere,
  });
  await logAdminAction(adminId, "MARK_SPAM", `Marked review ID: ${reviewId} as SPAM`);

  revalidatePath("/admin");
  return { success: true };
}

// ── All Users (for user management table) ─────────────────────────────────────
export async function getAdminUsers(limit = 100) {
  await requireAdmin();

  return prisma.user.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      review_count: true,
      createdAt: true,
    },
  });
}

// ── Update User Role ──────────────────────────────────────────────────────────
export async function updateUserRole(userId: string, newRole: Role) {
  const adminId = await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
  await logAdminAction(adminId, "UPDATE_ROLE", `Changed user ${userId} to role ${newRole}`);

  revalidatePath("/admin");
  return { success: true };
}

// ── Set Perfume of the Day ────────────────────────────────────────────────────
export async function setPerfumeOfTheDay(perfumeId: string, note?: string) {
  const adminId = await requireAdmin();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    await prisma.perfumeOfTheDay.upsert({
      where: { date: today },
      update: { perfumeId, note: note ?? null },
      create: { perfumeId, date: today, note: note ?? null },
    });
    await logAdminAction(adminId, "SET_POTD", `Set Perfume of the Day to ${perfumeId}`);

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── Feature Toggles (Kill Switches) ───────────────────────────────────────────
export async function getFeatureToggles() {
  await requireAdmin();
  return prisma.featureToggle.findMany();
}

export async function updateFeatureToggle(key: string, isEnabled: boolean) {
  const adminId = await requireAdmin();

  await prisma.featureToggle.upsert({
    where: { key },
    update: { isEnabled },
    create: { key, isEnabled },
  });
  await logAdminAction(adminId, "TOGGLE_FEATURE", `${isEnabled ? "Enabled" : "Disabled"} feature ${key}`);

  // Revalidate globally so Navbars and Pages pick up the new toggles
  revalidatePath("/", "layout");
  return { success: true };
}

// ── Upload Transparent Perfume Image ─────────────────────────────────────────
export async function uploadTransparentImage(perfumeId: string, formData: FormData) {
  const adminId = await requireAdmin();

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new Error("No file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".png";
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "perfumes");

  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${perfumeId}-${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buffer);

  const publicPath = `/uploads/perfumes/${filename}`;

  await prisma.perfume.update({
    where: { id: perfumeId },
    data: { transparentImageUrl: publicPath },
  });

  await logAdminAction(adminId, "UPLOAD_TRANSPARENT_IMAGE", `Perfume ${perfumeId}`);

  revalidatePath(`/perfume/${perfumeId}`);
  return { success: true, path: publicPath };
}

// =============================================
//  B2B Claims Administration
// =============================================

export async function getBrandClaims(status?: string) {
  await requireAdmin();

  const whereClause = status ? { status } : {};

  return prisma.brandClaim.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateBrandClaimStatus(id: string, newStatus: "APPROVED" | "REJECTED") {
  const adminId = await requireAdmin();

  const claim = await prisma.brandClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Claim not found");

  const updatedClaim = await prisma.brandClaim.update({
    where: { id },
    data: { status: newStatus },
  });

  if (newStatus === "APPROVED") {
    await prisma.user.update({
      where: { id: claim.userId },
      data: { role: Role.BRAND_PARTNER },
    });
  }

  await logAdminAction(adminId, `brand_claim_${newStatus.toLowerCase()}`, `Claim ID: ${id}, Brand: ${claim.brandName}`);
  revalidatePath("/admin");
  return updatedClaim;
}

// ── Bulk Import Perfumes (JSON) ───────────────────────────────────────────────
export async function importBulkPerfumes(jsonData: string) {
  try {
    const perfumes = JSON.parse(jsonData);
    if (!Array.isArray(perfumes)) throw new Error("Data must be a JSON array.");

    let successCount = 0;

    // Process sequentially to avoid SQLite lockups on massive arrays
    for (const p of perfumes) {
      if (!p.name || !p.brand) continue;

      // Basic slugification fallback if slug is missing
      const slug =
        p.slug ||
        `${p.brand}-${p.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

      await prisma.perfume.upsert({
        where: { slug },
        update: {}, // Don't overwrite existing records
        create: {
          slug,
          name: p.name,
          brand: p.brand,
          image_url: p.image_url || "/placeholder-bottle.png",
          description: p.description || "",
          release_year: p.release_year ? Number(p.release_year) : null,
          // Stringify arrays for SQLite TEXT columns
          accords: p.main_accords ? JSON.stringify(p.main_accords) : p.accords ? JSON.stringify(p.accords) : undefined,
          top_notes: p.top_notes ? JSON.stringify(p.top_notes) : undefined,
        },
      });
      successCount++;
    }

    return { success: true, count: successCount };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Bulk Import Error:", error);
    return { success: false, error: message };
  }
}

// ── Ban / Unban User ──────────────────────────────────────────────────────────
export async function toggleBanUser(
  userId: string,
  ban: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await requireAdmin();

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: ban, banReason: ban ? (reason || null) : null },
    });

    await logAdminAction(adminId, ban ? "BAN_USER" : "UNBAN_USER", `User: ${userId}${reason ? ` — ${reason}` : ""}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Admin Reset User Password ─────────────────────────────────────────────────
export async function adminResetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await requireAdmin();

    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, email: true },
    });
    if (!user) return { success: false, error: "User not found." };
    if (!user.password) return { success: false, error: "OAuth user — no password to reset." };

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    // Notify user their password was changed
    if (user.email) {
      sendPasswordChangedEmail(user.email, user.email).catch(console.error);
    }

    await logAdminAction(adminId, "RESET_PASSWORD", `User: ${userId} (${user.email})`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Admin Delete User ─────────────────────────────────────────────────────────
export async function adminDeleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });
    if (!user) return { success: false, error: "User not found." };
    if (user.role === "SUPER_ADMIN") return { success: false, error: "Cannot delete a Super Admin." };

    await prisma.user.delete({ where: { id: userId } });

    await logAdminAction(adminId, "DELETE_USER", `Deleted user: ${userId} (${user.email})`);
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Admin Perfume CRUD ────────────────────────────────────────────────────────

export type AdminPerfumeData = {
  name: string;
  brand: string;
  description?: string;
  perfumer?: string;
  gender?: string;
  release_year?: number | null;
  image_url?: string;
  top_notes?: string[];
  heart_notes?: string[];
  base_notes?: string[];
  accords?: string[];
  country?: string;
  source_url?: string;
};

function slugify(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function getAdminPerfumes(
  page: number = 1,
  search?: string,
  pageSize: number = 50
): Promise<{ perfumes: any[]; total: number }> {
  await requireAdmin();

  const where: AnyWhere = {};
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { brand: { contains: q } },
      { slug: { contains: q.toLowerCase() } },
    ];
  }

  const [perfumes, total] = await Promise.all([
    prisma.perfume.findMany({
      where,
      select: {
        id: true,
        name: true,
        brand: true,
        slug: true,
        image_url: true,
        gender: true,
        release_year: true,
        scraped: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.perfume.count({ where }),
  ]);

  return { perfumes, total };
}

export async function adminCreatePerfume(
  data: AdminPerfumeData
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const adminId = await requireAdmin();

    if (!data.name?.trim() || !data.brand?.trim()) {
      return { success: false, error: "Name and brand are required." };
    }

    const slug = slugify(data.brand, data.name);

    const existing = await prisma.perfume.findUnique({ where: { slug } });
    if (existing) {
      return { success: false, error: `A perfume with slug "${slug}" already exists.` };
    }

    const perfume = await prisma.perfume.create({
      data: {
        name: data.name.trim(),
        brand: data.brand.trim(),
        slug,
        description: data.description?.trim() || "",
        perfumer: data.perfumer?.trim() || null,
        gender: data.gender?.trim() || null,
        release_year: data.release_year ?? null,
        image_url: data.image_url?.trim() || "/placeholder-bottle.png",
        top_notes: data.top_notes ? JSON.stringify(data.top_notes) : undefined,
        heart_notes: data.heart_notes ? JSON.stringify(data.heart_notes) : undefined,
        base_notes: data.base_notes ? JSON.stringify(data.base_notes) : undefined,
        accords: data.accords ? JSON.stringify(data.accords) : undefined,
        country: data.country?.trim() || null,
        source_url: data.source_url?.trim() || null,
        scraped: false,
      },
    });

    await logAdminAction(adminId, "CREATE_PERFUME", `${data.brand} — ${data.name} (slug: ${slug})`);
    revalidatePath("/admin");
    revalidatePath("/perfume");
    return { success: true, id: perfume.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function adminUpdatePerfume(
  id: string,
  data: Partial<AdminPerfumeData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await requireAdmin();

    const existing = await prisma.perfume.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Perfume not found." };

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.brand !== undefined) updateData.brand = data.brand.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.perfumer !== undefined) updateData.perfumer = data.perfumer.trim() || null;
    if (data.gender !== undefined) updateData.gender = data.gender.trim() || null;
    if (data.release_year !== undefined) updateData.release_year = data.release_year;
    if (data.image_url !== undefined) updateData.image_url = data.image_url.trim() || "/placeholder-bottle.png";
    if (data.top_notes !== undefined) updateData.top_notes = JSON.stringify(data.top_notes);
    if (data.heart_notes !== undefined) updateData.heart_notes = JSON.stringify(data.heart_notes);
    if (data.base_notes !== undefined) updateData.base_notes = JSON.stringify(data.base_notes);
    if (data.accords !== undefined) updateData.accords = JSON.stringify(data.accords);
    if (data.country !== undefined) updateData.country = data.country.trim() || null;
    if (data.source_url !== undefined) updateData.source_url = data.source_url.trim() || null;

    // If name or brand changed, update slug
    if (data.name !== undefined || data.brand !== undefined) {
      const newName = data.name?.trim() || existing.name;
      const newBrand = data.brand?.trim() || existing.brand;
      updateData.slug = slugify(newBrand, newName);
    }

    await prisma.perfume.update({ where: { id }, data: updateData });

    await logAdminAction(adminId, "UPDATE_PERFUME", `ID: ${id}, ${existing.brand} — ${existing.name}`);
    revalidatePath("/admin");
    revalidatePath(`/perfume/${existing.slug}`);
    revalidatePath("/perfume");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function adminDeletePerfume(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await requireAdmin();

    const perfume = await prisma.perfume.findUnique({
      where: { id },
      select: { name: true, brand: true, slug: true },
    });
    if (!perfume) return { success: false, error: "Perfume not found." };

    await prisma.perfume.delete({ where: { id } });

    await logAdminAction(adminId, "DELETE_PERFUME", `${perfume.brand} — ${perfume.name} (slug: ${perfume.slug})`);
    revalidatePath("/admin");
    revalidatePath("/perfume");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── User Perfume Submission ───────────────────────────────────────────────────
export async function userSubmitPerfume(
  data: AdminPerfumeData
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "You must be logged in." };

    if (!data.name?.trim() || !data.brand?.trim()) {
      return { success: false, error: "Name and brand are required." };
    }

    const slug = slugify(data.brand, data.name);

    const existing = await prisma.perfume.findUnique({ where: { slug } });
    if (existing) {
      return { success: false, error: "This perfume already exists in our database." };
    }

    await prisma.perfume.create({
      data: {
        name: data.name.trim(),
        brand: data.brand.trim(),
        slug,
        description: data.description?.trim() || "",
        gender: data.gender?.trim() || null,
        image_url: "/placeholder-bottle.png",
        scraped: false,
      },
    });

    revalidatePath("/perfume");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
