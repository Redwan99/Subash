// app/admin/page.tsx
// Phase 9 — God Mode Admin Dashboard (Server Component)
// Redirects non-admins to home. Shows stats, reviews, and user management.

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Role } from "@prisma/client";
import AdminDashboardClient from "./AdminDashboardClient";
import type { AdminReview as Review, AdminUser, AuditLog, BrandClaim } from "./types";

async function getAdminData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  // Wrap each query to handle missing tables/columns gracefully
  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch { return fallback; }
  };

  const [totalUsers, totalReviews, totalPerfumes, pendingReviews, spamReviews, scrapedPerfumes, ratedPerfumes, recentReviews, users, featureToggles, auditLogs, brandClaims] =
    await Promise.all([
      safe(() => prisma.user.count(), 0),
      safe(() => prisma.review.count(), 0),
      safe(() => prisma.perfume.count(), 0),
      safe(() => db.review.count({ where: { status: "PENDING" } }), 0),
      safe(() => db.review.count({ where: { status: "SPAM" } }), 0),
      safe(() => db.perfume.count({ where: { scraped: true } }), 0),
      safe(() => db.perfume.count({ where: { rating_value: { not: null } } }), 0),
      safe(() => db.review.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          text: true,
          overall_rating: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
          perfume: { select: { id: true, name: true, brand: true, slug: true } },
        },
      }), []),
      safe(() => prisma.user.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          role: true,
          review_count: true,
          isBanned: true,
          banReason: true,
          createdAt: true,
        },
      }), []),
      safe(() => db.featureToggle.findMany({
        orderBy: { key: "asc" },
      }), []),
      safe(() => db.auditLog.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
      }), []),
      safe(() => db.brandClaim.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }), []),
    ]);

  return {
    totalUsers: totalUsers as number,
    totalReviews: totalReviews as number,
    totalPerfumes: totalPerfumes as number,
    scrapedPerfumes: scrapedPerfumes as number,
    ratedPerfumes: ratedPerfumes as number,
    pendingReviews: pendingReviews as number,
    spamReviews: spamReviews as number,
    recentReviews: recentReviews as Review[],
    users: users as AdminUser[],
    featureToggles: featureToggles,
    auditLogs: auditLogs as AuditLog[],
    brandClaims: brandClaims as BrandClaim[],
  };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!me || me.role !== Role.SUPER_ADMIN) redirect("/");

  const data = await getAdminData();

  return <AdminDashboardClient {...data} />;
}
