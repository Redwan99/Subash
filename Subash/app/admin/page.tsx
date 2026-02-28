// app/admin/page.tsx
// Phase 9 — God Mode Admin Dashboard (Server Component)
// Redirects non-admins to home. Shows stats, reviews, and user management.

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Role, type AuditLog } from "@prisma/client";
import { AdminDashboardClient, type Review, type AdminUser } from "./AdminDashboardClient";

async function getAdminData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [totalUsers, totalReviews, totalPerfumes, pendingReviews, spamReviews, recentReviews, users, featureToggles, auditLogs, brandClaims] =
    await Promise.all([
      prisma.user.count(),
      prisma.review.count(),
      prisma.perfume.count(),
      db.review.count({ where: { status: "PENDING" } }),
      db.review.count({ where: { status: "SPAM" } }),
      db.review.findMany({
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
      }),
      prisma.user.findMany({
        take: 100,
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
      }),
      db.featureToggle.findMany({
        orderBy: { key: "asc" },
      }),
      db.auditLog.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
      }),
      db.brandClaim.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

  return {
    totalUsers: totalUsers as number,
    totalReviews: totalReviews as number,
    totalPerfumes: totalPerfumes as number,
    pendingReviews: pendingReviews as number,
    spamReviews: spamReviews as number,
    recentReviews: recentReviews as Review[],
    users: users as AdminUser[],
    featureToggles: featureToggles,
    auditLogs: auditLogs as AuditLog[],
    brandClaims: brandClaims as any[],
  };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!me || me.role !== Role.SUPER_ADMIN) redirect("/");

  const data = await getAdminData();

  return <AdminDashboardClient {...data} />;
}
