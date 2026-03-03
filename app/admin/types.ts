// app/admin/types.ts
import { Role, type AuditLog as PrismaAuditLog } from "@prisma/client";

export type ReviewStatus = "APPROVED" | "PENDING" | "SPAM";

export type AdminReview = {
    id: string;
    text: string;
    overall_rating: number;
    status: ReviewStatus;
    createdAt: Date;
    user: { id: string; name: string | null; email: string | null; image: string | null };
    perfume: { id: string; name: string; brand: string; slug: string } | null;
};

export type AdminUser = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: Role;
    review_count: number;
    createdAt: Date;
};

export type BrandClaim = {
    id: string;
    brandName: string;
    officialEmail: string;
    status: string;
    message: string | null;
    createdAt: Date;
    user: { name: string | null; email: string | null };
};

// Re-export Prisma's AuditLog type for admin UI
export type AuditLog = PrismaAuditLog;
