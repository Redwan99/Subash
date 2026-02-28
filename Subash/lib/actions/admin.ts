"use server";
// lib/actions/admin.ts
// Phase 9 — Secure Admin Server Actions
// All actions enforce SUPER_ADMIN role before executing.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
