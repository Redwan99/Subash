"use client";
// app/admin/AdminDashboardClient.tsx
// Phase 9 — Pro Max Glassmorphism Admin Dashboard Client Component

import { useState, useTransition, useEffect, useCallback } from "react";
import Image from "next/image";
import {
    Users, Star, Sparkles, ShieldAlert, Trash2, Crown,
    BarChart3, ShieldCheck, AlertTriangle, CheckCircle2,
    ChevronDown, Search, RefreshCw, Settings2, Power, Store, Droplet, Users2, Activity,
    Briefcase, Database, Globe, Camera, Trophy, Layers, MessageCircle, ShoppingBag, Key, Plus, Eye, EyeOff, Loader2, Save,
    Lightbulb, X, Mail
} from "lucide-react";
import { deleteReviewAsAdmin, markReviewAsSpam, updateUserRole, updateFeatureToggle, updateBrandClaimStatus, toggleBanUser, adminResetUserPassword, adminDeleteUser, getAdminPerfumes, adminCreatePerfume, adminUpdatePerfume, adminDeletePerfume, type AdminPerfumeData, getAdminSuggestedPerfumes, approveSuggestedPerfume, rejectSuggestedPerfume, updateSuggestedPerfume } from "@/lib/actions/admin";
import { Pencil } from "lucide-react";
import { getEnvVariables, upsertEnvVariable, deleteEnvVariable, getEnvVariableDecrypted, type EnvVarItem } from "@/lib/actions/envvars";
import type { Role, FeatureToggle } from "@prisma/client";
import { AsyncCsvImporter } from "@/components/admin/AsyncCsvImporter";
import BulkImporter from "@/components/admin/BulkImporter";
import type { ReviewStatus, AdminReview as Review, AdminUser, BrandClaim, AuditLog } from "./types";

// -- Types ---------------------------------------------------------------------

type AdminPerfumeItem = {
    id: string;
    name: string;
    brand: string;
    slug: string;
    image_url: string | null;
    gender: string | null;
    release_year: number | null;
    scraped: boolean;
    createdAt: Date;
    description?: string;
    perfumer?: string | null;
    top_notes?: unknown;
    heart_notes?: unknown;
    base_notes?: unknown;
    accords?: unknown;
    country?: string | null;
    source_url?: string | null;
};

type SuggestedPerfumeItem = {
    id: string;
    name: string;
    brand: string;
    gender: string | null;
    description: string | null;
    perfumer: string | null;
    releaseYear: number | null;
    topNotes: string | null;
    heartNotes: string | null;
    baseNotes: string | null;
    accords: string | null;
    imageUrl: string | null;
    status: string;
    adminNotes: string | null;
    createdAt: Date;
    user: { id: string; name: string | null; email: string | null; image: string | null };
};

type Props = {
    totalUsers: number;
    totalReviews: number;
    totalPerfumes: number;
    scrapedPerfumes: number;
    ratedPerfumes: number;
    pendingReviews: number;
    spamReviews: number;
    pendingSuggestions: number;
    recentReviews: Review[];
    users: AdminUser[];
    featureToggles: FeatureToggle[];
    auditLogs: AuditLog[];
    brandClaims: BrandClaim[];
};

// -- Role display helpers ------------------------------------------------------

const ROLE_DISPLAY: Record<Role, { label: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", color: "text-[#F59E0B] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.3)]" },
    MODERATOR: { label: "Moderator", color: "text-[#F783AC] bg-[rgba(232,67,147,0.12)] border-[rgba(232,67,147,0.3)]" },
    SELLER: { label: "Seller", color: "text-[#F783AC] bg-[rgba(247,131,172,0.12)] border-[rgba(247,131,172,0.3)]" },
    DECANTER: { label: "Decanter", color: "text-[#60A5FA] bg-[rgba(96,165,250,0.12)] border-[rgba(96,165,250,0.3)]" },
    BRAND_PARTNER: { label: "Brand Partner", color: "text-[#EC4899] bg-[rgba(236,72,153,0.12)] border-[rgba(236,72,153,0.3)]" },
    STANDARD: { label: "User", color: "text-[var(--text-muted)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.10)]" },
};

const STATUS_DISPLAY: Record<ReviewStatus, { label: string; color: string; icon: React.ReactNode }> = {
    APPROVED: { label: "Approved", color: "text-[#F783AC] bg-[rgba(247,131,172,0.12)] border-[rgba(247,131,172,0.3)]", icon: <CheckCircle2 size={11} /> },
    PENDING: { label: "Pending", color: "text-[#F59E0B] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.3)]", icon: <AlertTriangle size={11} /> },
    SPAM: { label: "Spam", color: "text-[#EF4444] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.3)]", icon: <ShieldAlert size={11} /> },
};

// -- Metric Card ---------------------------------------------------------------

function MetricCard({ label, value, icon, accent, glow }: {
    label: string; value: number; icon: React.ReactNode;
    accent: string; glow: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 border backdrop-blur-2xl transition-all hover:scale-[1.02] ${glow}`}
            style={{ background: "rgba(10,6,25,0.55)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className={`absolute inset-0 opacity-10 ${accent}`}
                style={{ background: `radial-gradient(circle at top right, currentColor 0%, transparent 70%)` }} />
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-[rgba(255,255,255,0.4)] mb-1">{label}</p>
                    <p className="text-4xl font-black text-white leading-none">{value.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} bg-current`}
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    <span className={accent}>{icon}</span>
                </div>
            </div>
        </div>
    );
}

// -- Reviews Table --------------------------------------------------------------

function ReviewsTable({ reviews }: { reviews: Review[] }) {
    const [query, setQuery] = useState("");
    const [items, setItems] = useState(reviews);
    const [pending, startTransition] = useTransition();

    const filtered = items.filter((r) =>
        !query ||
        r.user.name?.toLowerCase().includes(query.toLowerCase()) ||
        r.perfume?.name.toLowerCase().includes(query.toLowerCase()) ||
        r.text.toLowerCase().includes(query.toLowerCase())
    );

    const handleDelete = (id: string) => {
        startTransition(async () => {
            await deleteReviewAsAdmin(id);
            setItems((prev) => prev.filter((r) => r.id !== id));
        });
    };

    const handleSpam = (id: string) => {
        startTransition(async () => {
            await markReviewAsSpam(id);
            setItems((prev) => prev.map((r) => r.id === id ? { ...r, status: "SPAM" as ReviewStatus } : r));
        });
    };

    return (
        <div>
            {/* Search bar */}
            <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by reviewer, perfume, or text..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(232,67,147,0.4)]"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[rgba(255,255,255,0.07)]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)]" style={{ background: "rgba(255,255,255,0.03)" }}>
                            {["Reviewer", "Perfume", "Rating", "Excerpt", "Status", "Date", "Actions"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-[rgba(255,255,255,0.3)]">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((review) => (
                            <tr key={review.id}
                                className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                                {/* Reviewer */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        {review.user.image ? (
                                            <Image src={review.user.image} alt="" width={28} height={28} className="rounded-full" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-[rgba(232,67,147,0.2)] flex items-center justify-center text-xs text-[#F783AC] font-bold">
                                                {review.user.name?.[0] ?? "?"}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-white font-medium text-[13px] leading-tight line-clamp-1">
                                                {review.user.name ?? "Anonymous"}
                                            </p>
                                            <p className="text-[10px] text-[rgba(255,255,255,0.3)] line-clamp-1">{review.user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                {/* Perfume */}
                                <td className="px-4 py-3">
                                    {review.perfume ? (
                                        <div>
                                            <p className="text-white font-medium text-[13px] leading-tight line-clamp-1">{review.perfume.name}</p>
                                            <p className="text-[10px] text-[rgba(255,255,255,0.35)]">{review.perfume.brand}</p>
                                        </div>
                                    ) : <span className="text-[rgba(255,255,255,0.25)]">—</span>}
                                </td>
                                {/* Rating */}
                                <td className="px-4 py-3">
                                    <span className="text-[#F59E0B] font-bold text-sm">{review.overall_rating}/10</span>
                                </td>
                                {/* Excerpt */}
                                <td className="px-4 py-3 max-w-[220px]">
                                    <p className="text-[rgba(255,255,255,0.55)] text-[12px] line-clamp-2">{review.text}</p>
                                </td>
                                {/* Status */}
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_DISPLAY[review.status].color}`}>
                                        {STATUS_DISPLAY[review.status].icon}
                                        {STATUS_DISPLAY[review.status].label}
                                    </span>
                                </td>
                                {/* Date */}
                                <td className="px-4 py-3 text-[rgba(255,255,255,0.3)] text-[11px] whitespace-nowrap">
                                    {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                                </td>
                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        {review.status !== "SPAM" && (
                                            <button
                                                onClick={() => handleSpam(review.id)}
                                                disabled={pending}
                                                title="Mark as Spam"
                                                className="p-1.5 rounded-lg text-[#F59E0B] hover:bg-[rgba(245,158,11,0.12)] transition-colors disabled:opacity-40"
                                            >
                                                <ShieldAlert size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            disabled={pending}
                                            title="Delete Review"
                                            className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[rgba(239,68,68,0.12)] transition-colors disabled:opacity-40"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <p className="text-center py-10 text-[rgba(255,255,255,0.25)] text-sm">No reviews found.</p>
                )}
            </div>
        </div>
    );
}

// -- Users Table ----------------------------------------------------------------

function UsersTable({ users }: { users: AdminUser[] }) {
    const [query, setQuery] = useState("");
    const [items, setItems] = useState(users);
    const [pending, startTransition] = useTransition();
    // Ban modal
    const [banModal, setBanModal] = useState<{ userId: string; ban: boolean } | null>(null);
    const [banReason, setBanReason] = useState("");
    // Reset password modal
    const [resetModal, setResetModal] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    // Delete modal
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    // Feedback
    const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

    const filtered = items.filter((u) =>
        !query ||
        u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
    );

    const handleRoleChange = (userId: string, newRole: Role) => {
        startTransition(async () => {
            await updateUserRole(userId, newRole);
            setItems((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
        });
    };

    const handleBan = () => {
        if (!banModal) return;
        startTransition(async () => {
            const res = await toggleBanUser(banModal.userId, banModal.ban, banReason || undefined);
            if (res.error) { setFeedback({ type: "err", msg: res.error }); }
            else {
                setFeedback({ type: "ok", msg: banModal.ban ? "User banned" : "User unbanned" });
                setItems((prev) => prev.map((u) => u.id === banModal.userId ? { ...u, isBanned: banModal.ban, banReason: banModal.ban ? (banReason || null) : null } : u));
            }
            setBanModal(null); setBanReason("");
            setTimeout(() => setFeedback(null), 3000);
        });
    };

    const handleResetPassword = () => {
        if (!resetModal || !newPassword) return;
        startTransition(async () => {
            const res = await adminResetUserPassword(resetModal, newPassword);
            if (res.error) { setFeedback({ type: "err", msg: res.error }); }
            else { setFeedback({ type: "ok", msg: "Password reset successfully" }); }
            setResetModal(null); setNewPassword("");
            setTimeout(() => setFeedback(null), 3000);
        });
    };

    const handleDelete = () => {
        if (!deleteModal) return;
        startTransition(async () => {
            const res = await adminDeleteUser(deleteModal);
            if (res.error) { setFeedback({ type: "err", msg: res.error }); }
            else {
                setFeedback({ type: "ok", msg: "User deleted" });
                setItems((prev) => prev.filter((u) => u.id !== deleteModal));
            }
            setDeleteModal(null);
            setTimeout(() => setFeedback(null), 3000);
        });
    };

    const userName = (id: string) => { const u = items.find((u) => u.id === id); return u?.name || u?.email || "this user"; };

    return (
        <div>
            {/* Feedback toast */}
            {feedback && (
                <div className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-medium border ${
                    feedback.type === "ok" ? "bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)] text-emerald-400" : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-red-400"
                }`}>{feedback.msg}</div>
            )}

            <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(232,67,147,0.4)]"
                />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[rgba(255,255,255,0.07)]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)]" style={{ background: "rgba(255,255,255,0.03)" }}>
                            {["User", "Email", "Role", "Status", "Reviews", "Joined", "Actions"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-[rgba(255,255,255,0.3)]">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((user) => (
                            <tr key={user.id}
                                className={`border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.025)] transition-colors ${user.isBanned ? "opacity-60" : ""}`}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        {user.image ? (
                                            <Image src={user.image} alt="" width={28} height={28} className="rounded-full" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-[rgba(232,67,147,0.2)] flex items-center justify-center text-xs text-[#F783AC] font-bold">
                                                {user.name?.[0] ?? "?"}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-white font-medium text-[13px] line-clamp-1">{user.name ?? "Anonymous"}</p>
                                            {user.username && <p className="text-[11px] text-[rgba(255,255,255,0.4)] line-clamp-1">@{user.username}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-[rgba(255,255,255,0.45)] text-[12px]">{user.email ?? "—"}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_DISPLAY[user.role].color}`}>
                                        {ROLE_DISPLAY[user.role].label}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {user.isBanned ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.3)] text-red-400" title={user.banReason || "Banned"}>
                                            <ShieldAlert size={10} /> Banned
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.25)] text-emerald-400">
                                            <CheckCircle2 size={10} /> Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-white font-bold">{user.review_count}</td>
                                <td className="px-4 py-3 text-[rgba(255,255,255,0.3)] text-[11px] whitespace-nowrap">
                                    {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        {/* Role change */}
                                        <div className="relative">
                                            <select
                                                value={user.role}
                                                disabled={pending}
                                                aria-label={`Change role for ${user.name ?? user.email}`}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                                className="appearance-none text-[11px] font-semibold px-2 py-1 pr-6 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-white outline-none cursor-pointer hover:border-[rgba(232,67,147,0.4)] disabled:opacity-40 transition-all"
                                            >
                                                {Object.entries(ROLE_DISPLAY).map(([role, { label }]) => (
                                                    <option key={role} value={role} className="bg-[#0D0A1E]">{label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] pointer-events-none" />
                                        </div>
                                        {/* Ban / Unban */}
                                        <button
                                            onClick={() => setBanModal({ userId: user.id, ban: !user.isBanned })}
                                            disabled={pending || user.role === "SUPER_ADMIN"}
                                            title={user.isBanned ? "Unban user" : "Ban user"}
                                            className={`p-1.5 rounded-lg border transition-all disabled:opacity-30 ${
                                                user.isBanned
                                                    ? "border-[rgba(16,185,129,0.3)] text-emerald-400 hover:bg-[rgba(16,185,129,0.1)]"
                                                    : "border-[rgba(239,68,68,0.3)] text-red-400 hover:bg-[rgba(239,68,68,0.1)]"
                                            }`}>
                                            <ShieldAlert size={13} />
                                        </button>
                                        {/* Reset Password */}
                                        <button
                                            onClick={() => setResetModal(user.id)}
                                            disabled={pending}
                                            title="Reset password"
                                            className="p-1.5 rounded-lg border border-[rgba(245,158,11,0.3)] text-amber-400 hover:bg-[rgba(245,158,11,0.1)] transition-all disabled:opacity-30">
                                            <Key size={13} />
                                        </button>
                                        {/* Delete */}
                                        <button
                                            onClick={() => setDeleteModal(user.id)}
                                            disabled={pending || user.role === "SUPER_ADMIN"}
                                            title="Delete user"
                                            className="p-1.5 rounded-lg border border-[rgba(239,68,68,0.3)] text-red-400 hover:bg-[rgba(239,68,68,0.15)] transition-all disabled:opacity-30">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <p className="text-center py-10 text-[rgba(255,255,255,0.25)] text-sm">No users found.</p>
                )}
            </div>

            {/* Ban/Unban Modal */}
            {banModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBanModal(null)}>
                    <div className="bg-[#1A1530] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-white font-bold text-lg mb-1">{banModal.ban ? "Ban User" : "Unban User"}</h3>
                        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-4">
                            {banModal.ban ? `Ban ${userName(banModal.userId)}? They won't be able to log in.` : `Unban ${userName(banModal.userId)}?`}
                        </p>
                        {banModal.ban && (
                            <textarea
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="Reason for ban (optional)..."
                                className="w-full mb-4 p-3 rounded-xl text-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none resize-none h-20"
                            />
                        )}
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => { setBanModal(null); setBanReason(""); }} className="px-4 py-2 text-sm rounded-xl border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] transition-all">Cancel</button>
                            <button onClick={handleBan} disabled={pending} className={`px-4 py-2 text-sm rounded-xl font-semibold transition-all disabled:opacity-50 ${
                                banModal.ban ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                            }`}>{pending ? "..." : banModal.ban ? "Ban" : "Unban"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setResetModal(null); setNewPassword(""); }}>
                    <div className="bg-[#1A1530] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-white font-bold text-lg mb-1">Reset Password</h3>
                        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-4">Set a new password for {userName(resetModal)}</p>
                        <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password (min 8 characters)..."
                            className="w-full mb-4 p-3 rounded-xl text-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => { setResetModal(null); setNewPassword(""); }} className="px-4 py-2 text-sm rounded-xl border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] transition-all">Cancel</button>
                            <button onClick={handleResetPassword} disabled={pending || newPassword.length < 8} className="px-4 py-2 text-sm rounded-xl font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-50">{pending ? "..." : "Reset"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete User Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal(null)}>
                    <div className="bg-[#1A1530] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-white font-bold text-lg mb-1">Delete User</h3>
                        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-2">Permanently delete <strong className="text-red-400">{userName(deleteModal)}</strong>?</p>
                        <p className="text-[rgba(255,255,255,0.35)] text-xs mb-4">This action cannot be undone. All reviews and data will remain but become orphaned.</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm rounded-xl border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] transition-all">Cancel</button>
                            <button onClick={handleDelete} disabled={pending} className="px-4 py-2 text-sm rounded-xl font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50">{pending ? "..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// -- Audit Logs Table -----------------------------------------------------------

function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
    const [query, setQuery] = useState("");

    const filtered = logs.filter((log) =>
        !query ||
        log.userId.toLowerCase().includes(query.toLowerCase()) ||
        log.action.toLowerCase().includes(query.toLowerCase()) ||
        log.details?.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div>
            <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search logs by User ID, Action, or Details..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(232,67,147,0.4)]"
                />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[rgba(255,255,255,0.07)]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)]" style={{ background: "rgba(255,255,255,0.03)" }}>
                            {["Timestamp", "Action", "User ID", "Details"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-[rgba(255,255,255,0.3)]">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((log) => (
                            <tr key={log.id}
                                className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                                <td className="px-4 py-3 text-[rgba(255,255,255,0.4)] text-[11px] whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString("en-GB", {
                                        day: "2-digit", month: "short", year: "2-digit",
                                        hour: "2-digit", minute: "2-digit", second: "2-digit"
                                    })}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border text-[#38BDF8] bg-[rgba(56,189,248,0.1)] border-[rgba(56,189,248,0.25)]">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-[11px] font-mono text-[#F783AC] tracking-tight">
                                    {log.userId}
                                </td>
                                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)] line-clamp-2">
                                    {log.details || "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <p className="text-center py-10 text-[rgba(255,255,255,0.25)] text-sm">No audit logs found.</p>
                )}
            </div>
        </div>
    );
}

// -- Main Dashboard -------------------------------------------------------------

type Tab = "overview" | "reviews" | "users" | "perfumes" | "suggestions" | "system" | "env" | "audit" | "claims" | "import";

export default function AdminDashboardClient({ totalUsers, totalReviews, totalPerfumes, scrapedPerfumes, ratedPerfumes, pendingReviews, spamReviews, pendingSuggestions, recentReviews, users, featureToggles, auditLogs, brandClaims }: Props) {
    const [tab, setTab] = useState<Tab>("overview");

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Overview", icon: <BarChart3 size={15} /> },
        { id: "reviews", label: "Reviews", icon: <Star size={15} /> },
        { id: "users", label: "Users", icon: <Users size={15} /> },
        { id: "perfumes", label: "Perfumes", icon: <Droplet size={15} /> },
        { id: "suggestions", label: "Suggestions", icon: <Lightbulb size={15} /> },
        { id: "system", label: "Features", icon: <Settings2 size={15} /> },
        { id: "env", label: "Env & SMTP", icon: <Key size={15} /> },
        { id: "audit", label: "Audit Logs", icon: <Activity size={15} /> },
        { id: "claims", label: "B2B Claims", icon: <Briefcase size={15} /> },
        { id: "import", label: "Import", icon: <Database size={15} /> },
    ];

    // Local toggle state to sync UI immediately
    const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {
            "ENABLE_AI_BOT": true,
            "ENABLE_SHOPS": true,
            "ENABLE_ENCYCLOPEDIA": true,
            "ENABLE_CREATORS": true,
            "ENABLE_DECANTS": true,
            "ENABLE_LEADERBOARDS": true,
            "ENABLE_FRAGRAM": true,
            "ENABLE_WARDROBE": true,
            "ENABLE_REMINDS_ME_OF": true,
            "ENABLE_USER_PERFUME_SUBMIT": false,
            "MAINTENANCE_MODE": false,
        };
        // Override with DB values if they exist
        if (featureToggles && featureToggles.length > 0) {
            featureToggles.forEach(t => init[t.key] = t.isEnabled);
        }
        return init;
    });

    const [isUpdating, startUpdating] = useTransition();

    const handleToggle = (key: string) => {
        const newVal = !toggles[key];
        setToggles(prev => ({ ...prev, [key]: newVal }));
        startUpdating(async () => {
            await updateFeatureToggle(key, newVal);
        });
    };

    return (
        <div className="min-h-screen dark bg-[#050505] text-white">

            {/* Ambient orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, rgba(232,67,147,0.3) 0%, transparent 70%)", filter: "blur(100px)" }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[45vw] h-[45vw] rounded-full opacity-15"
                    style={{ background: "radial-gradient(circle, rgba(232,67,147,0.2) 0%, transparent 70%)", filter: "blur(80px)" }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-500 shadow-md shadow-brand-500/20">
                            <Crown size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white">God Mode</h1>
                            <p className="text-xs text-[rgba(255,255,255,0.35)] font-medium">Admin Dashboard — Subash Platform</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(247,131,172,0.25)] bg-[rgba(247,131,172,0.08)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F783AC] animate-pulse" />
                        <span className="text-[11px] font-bold text-[#F783AC]">LIVE</span>
                    </div>
                </div>

                {/* Tab Bar — only show when NOT on overview (as a back navigation) */}
                {tab !== "overview" && (
                    <div className="flex items-center gap-2 mb-8">
                        <button onClick={() => setTab("overview")}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-brand-500/20 text-brand-500 border border-brand-500/30 shadow-[0_0_16px_rgba(232,67,147,0.2)]">
                            <BarChart3 size={15} /> ← Overview
                        </button>
                        <div className="h-6 w-px bg-[rgba(255,255,255,0.1)]" />
                        <span className="text-sm font-semibold text-[rgba(255,255,255,0.6)]">
                            {tabs.find(t => t.id === tab)?.icon}
                            <span className="ml-2">{tabs.find(t => t.id === tab)?.label}</span>
                        </span>
                    </div>
                )}

                {/* -- Overview Tab — Grid Dashboard -- */}
                {tab === "overview" && (
                    <div className="space-y-8">
                        {/* Stat cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard label="Total Users" value={totalUsers} icon={<Users size={16} />} accent="text-[#F783AC]" glow="shadow-[0_0_30px_rgba(232,67,147,0.1)]" />
                            <MetricCard label="Total Reviews" value={totalReviews} icon={<Star size={16} />} accent="text-[#F59E0B]" glow="shadow-[0_0_30px_rgba(245,158,11,0.1)]" />
                            <MetricCard label="Total Perfumes" value={totalPerfumes} icon={<Sparkles size={16} />} accent="text-[#F783AC]" glow="shadow-[0_0_30px_rgba(247,131,172,0.1)]" />
                            <MetricCard label="Suggestions" value={pendingSuggestions} icon={<Lightbulb size={16} />} accent="text-[#A78BFA]" glow="shadow-[0_0_30px_rgba(167,139,250,0.1)]" />
                        </div>

                        {/* Navigation Grid — clickable cards that open respective tabs */}
                        <div>
                            <p className="text-xs font-bold tracking-widest uppercase text-[rgba(255,255,255,0.3)] mb-4">Quick Navigation</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {[
                                    { tab: "reviews" as Tab, label: "Reviews", desc: `${pendingReviews + spamReviews} flagged`, icon: <Star size={22} />, color: "text-[#F59E0B]", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)" },
                                    { tab: "users" as Tab, label: "Users", desc: `${totalUsers} members`, icon: <Users size={22} />, color: "text-[#F783AC]", bg: "rgba(232,67,147,0.06)", border: "rgba(232,67,147,0.2)" },
                                    { tab: "perfumes" as Tab, label: "Perfumes", desc: `${totalPerfumes.toLocaleString()} total`, icon: <Droplet size={22} />, color: "text-[#A78BFA]", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.2)" },
                                    { tab: "suggestions" as Tab, label: "Suggestions", desc: `${pendingSuggestions} pending`, icon: <Lightbulb size={22} />, color: "text-[#F59E0B]", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)" },
                                    { tab: "system" as Tab, label: "Features", desc: "Kill switches", icon: <Settings2 size={22} />, color: "text-[#38BDF8]", bg: "rgba(56,189,248,0.06)", border: "rgba(56,189,248,0.2)" },
                                    { tab: "env" as Tab, label: "Env & SMTP", desc: "Secrets & mailer", icon: <Key size={22} />, color: "text-[#F59E0B]", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)" },
                                    { tab: "audit" as Tab, label: "Audit Logs", desc: `${auditLogs.length} events`, icon: <Activity size={22} />, color: "text-[#F783AC]", bg: "rgba(247,131,172,0.06)", border: "rgba(247,131,172,0.2)" },
                                    { tab: "claims" as Tab, label: "B2B Claims", desc: `${brandClaims.filter(c => c.status === "PENDING").length} pending`, icon: <Briefcase size={22} />, color: "text-[#38BDF8]", bg: "rgba(56,189,248,0.06)", border: "rgba(56,189,248,0.2)" },
                                    { tab: "import" as Tab, label: "Import Data", desc: `${scrapedPerfumes} imported`, icon: <Database size={22} />, color: "text-[#A78BFA]", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.2)" },
                                ].map(item => (
                                    <button key={item.tab} onClick={() => setTab(item.tab)}
                                        className="flex flex-col items-start gap-3 p-5 rounded-2xl border hover:scale-[1.02] transition-all text-left group"
                                        style={{ background: item.bg, borderColor: item.border }}>
                                        <div className={`${item.color} group-hover:scale-110 transition-transform`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.label}</p>
                                            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-0.5">{item.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick stats row */}
                        <div className="grid grid-cols-3 gap-4">
                            <MetricCard label="Imported" value={scrapedPerfumes} icon={<Database size={16} />} accent="text-[#38BDF8]" glow="shadow-[0_0_30px_rgba(56,189,248,0.1)]" />
                            <MetricCard label="With Ratings" value={ratedPerfumes} icon={<BarChart3 size={16} />} accent="text-[#A78BFA]" glow="shadow-[0_0_30px_rgba(167,139,250,0.1)]" />
                            <MetricCard label="Spam Caught" value={spamReviews} icon={<ShieldCheck size={16} />} accent="text-[#EF4444]" glow="shadow-[0_0_30px_rgba(239,68,68,0.1)]" />
                        </div>
                    </div>
                )}

                {/* -- Reviews Tab -- */}
                {tab === "reviews" && (
                    <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                        style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Star size={18} className="text-[#F59E0B]" />
                                <h2 className="text-lg font-bold text-white">Review Moderation</h2>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] text-[#F59E0B]">
                                {recentReviews.length} entries
                            </span>
                        </div>
                        <ReviewsTable reviews={recentReviews} />
                    </div>
                )}

                {/* -- Users Tab -- */}
                {tab === "users" && (
                    <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                        style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-[#F783AC]" />
                                <h2 className="text-lg font-bold text-white">User Management</h2>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(232,67,147,0.1)] border border-[rgba(232,67,147,0.25)] text-[#F783AC]">
                                {users.length} members
                            </span>
                        </div>
                        <UsersTable users={users} />
                    </div>
                )}

                {/* -- Perfumes Tab -- */}
                {tab === "perfumes" && <PerfumesManager />}

                {/* -- Suggestions Tab -- */}
                {tab === "suggestions" && <SuggestionsManager />}

                {/* -- System Features Tab (Kill Switches) -- */}
                {tab === "system" && (
                    <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                        style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Settings2 size={18} className="text-[#38BDF8]" />
                                <h2 className="text-lg font-bold text-white">Global Feature Toggles</h2>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.25)] text-[#38BDF8]">
                                Master Kill Switches
                            </span>
                        </div>
                        <p className="text-[13px] text-[rgba(255,255,255,0.4)] mb-6">
                            Disable modules globally for maintenance. The platform degrades gracefully with lock screens when toggled off.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: "ENABLE_AI_BOT", label: "ScentBot AI", desc: "Global access to the AI Fragrance Assistant", icon: <MessageCircle size={16} /> },
                                { key: "ENABLE_ENCYCLOPEDIA", label: "Perfumes", desc: "Main fragrance discovery grid and filters", icon: <Droplet size={16} /> },
                                { key: "ENABLE_SHOPS", label: "Boutiques Hub", desc: "Verified sellers and shop directory", icon: <Store size={16} /> },
                                { key: "ENABLE_CREATORS", label: "Creators Network", desc: "Master perfumers and brand directories", icon: <Users2 size={16} /> },
                                { key: "ENABLE_DECANTS", label: "Decant Exchange", desc: "Peer-to-peer decant marketplace", icon: <ShoppingBag size={16} /> },
                                { key: "ENABLE_LEADERBOARDS", label: "Leaderboards", desc: "Reviewer rankings and gamification", icon: <Trophy size={16} /> },
                                { key: "ENABLE_FRAGRAM", label: "Fragram", desc: "Photo-sharing fragrance community", icon: <Camera size={16} /> },
                                { key: "ENABLE_WARDROBE", label: "Wardrobe", desc: "Personal fragrance collection shelves", icon: <Layers size={16} /> },
                                { key: "ENABLE_REMINDS_ME_OF", label: "Reminds Me Of", desc: "Community clone & alternative suggestions on perfume pages", icon: <Sparkles size={16} /> },
                                { key: "ENABLE_USER_PERFUME_SUBMIT", label: "User Perfume Submissions", desc: "Allow users to submit new perfumes from the catalog page", icon: <Plus size={16} /> },
                                { key: "MAINTENANCE_MODE", label: "Maintenance Mode", desc: "Show maintenance page to all non-admin users", icon: <Globe size={16} /> },
                            ].map(feature => (
                                <div key={feature.key} className="flex items-center justify-between p-5 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                                    <div className="flex gap-3">
                                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${toggles[feature.key] ? 'bg-[rgba(247,131,172,0.15)] text-[#F783AC]' : 'bg-[rgba(239,68,68,0.15)] text-[#EF4444]'}`}>
                                            {toggles[feature.key] ? feature.icon : <Power size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{feature.label}</p>
                                            <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">{feature.desc}</p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => handleToggle(feature.key)}
                                        disabled={isUpdating}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${toggles[feature.key] ? 'bg-brand-500' : 'bg-gray-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggles[feature.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* -- Audit Logs Tab -- */}
                {tab === "audit" && (
                    <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                        style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-[#F783AC]" />
                                <h2 className="text-lg font-bold text-white">Security & Audit Logs</h2>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(247,131,172,0.1)] border border-[rgba(247,131,172,0.25)] text-[#F783AC]">
                                {auditLogs.length} events
                            </span>
                        </div>
                        <p className="text-[13px] text-[rgba(255,255,255,0.4)] mb-6">
                            Immutable logs of all administrative actions taken on the platform.
                        </p>
                        <AuditLogsTable logs={auditLogs} />
                    </div>
                )}

                {/* -- B2B Claims Tab -- */}
                {tab === "claims" && (
                    <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                        style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Briefcase size={18} className="text-[#38BDF8]" />
                                <h2 className="text-lg font-bold text-white">B2B Brand Claims</h2>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.25)] text-[#38BDF8]">
                                {brandClaims.filter((c) => c.status === "PENDING").length} pending
                            </span>
                        </div>
                        <p className="text-[13px] text-[rgba(255,255,255,0.4)] mb-6">
                            Manage official brand representative applications. Approving a claim upgrades the user to BRAND_PARTNER.
                        </p>
                        <BrandClaimsTable claims={brandClaims} />
                    </div>
                )}

                {/* -- Import Data Tab -- */}
                {tab === "import" && (
                    <div className="max-w-3xl mx-auto space-y-8">
                        <AsyncCsvImporter />
                        <BulkImporter />
                    </div>
                )}

                {/* -- Env Variables Tab -- */}
                {tab === "env" && <EnvVariablesPanel />}
            </div>
        </div>
    );
}

// -- Perfumes Manager ---------------------------------------------------------
function PerfumesManager() {
    const [perfumes, setPerfumes] = useState<AdminPerfumeItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

    // Add/Edit modal
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<AdminPerfumeData>({
        name: "", brand: "", description: "", perfumer: "", gender: "",
        release_year: null, image_url: "", top_notes: [], heart_notes: [],
        base_notes: [], accords: [], country: "", source_url: "",
    });
    // Comma-separated inputs for array fields
    const [topNotesStr, setTopNotesStr] = useState("");
    const [heartNotesStr, setHeartNotesStr] = useState("");
    const [baseNotesStr, setBaseNotesStr] = useState("");
    const [accordsStr, setAccordsStr] = useState("");

    // Delete modal
    const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [search]);

    // Fetch perfumes
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminPerfumes(page, debouncedSearch);
            setPerfumes(res.perfumes);
            setTotal(res.total);
        } catch { /* */ }
        setLoading(false);
    }, [page, debouncedSearch]);

    useEffect(() => { load(); }, [load]);

    const flash = (type: "ok" | "err", msg: string) => {
        setFeedback({ type, msg });
        setTimeout(() => setFeedback(null), 4000);
    };

    const resetForm = () => {
        setFormData({ name: "", brand: "", description: "", perfumer: "", gender: "", release_year: null, image_url: "", top_notes: [], heart_notes: [], base_notes: [], accords: [], country: "", source_url: "" });
        setTopNotesStr(""); setHeartNotesStr(""); setBaseNotesStr(""); setAccordsStr("");
        setEditingId(null);
        setShowForm(false);
    };

    const openAdd = () => {
        resetForm();
        setShowForm(true);
    };

    const openEdit = (p: AdminPerfumeItem) => {
        const parse = (v: unknown): string[] => {
            if (!v) return [];
            if (Array.isArray(v)) return v;
            if (typeof v !== "string") return [];
            try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
        };
        setEditingId(p.id);
        setFormData({
            name: p.name || "", brand: p.brand || "", description: p.description || "", perfumer: p.perfumer || "",
            gender: p.gender || "", release_year: p.release_year ?? null, image_url: p.image_url || "",
            top_notes: parse(p.top_notes), heart_notes: parse(p.heart_notes), base_notes: parse(p.base_notes),
            accords: parse(p.accords), country: p.country || "", source_url: p.source_url || "",
        });
        setTopNotesStr(parse(p.top_notes).join(", "));
        setHeartNotesStr(parse(p.heart_notes).join(", "));
        setBaseNotesStr(parse(p.base_notes).join(", "));
        setAccordsStr(parse(p.accords).join(", "));
        setShowForm(true);
    };

    const handleSave = () => {
        const payload: AdminPerfumeData = {
            ...formData,
            top_notes: topNotesStr.split(",").map(s => s.trim()).filter(Boolean),
            heart_notes: heartNotesStr.split(",").map(s => s.trim()).filter(Boolean),
            base_notes: baseNotesStr.split(",").map(s => s.trim()).filter(Boolean),
            accords: accordsStr.split(",").map(s => s.trim()).filter(Boolean),
        };
        startTransition(async () => {
            const res = editingId
                ? await adminUpdatePerfume(editingId, payload)
                : await adminCreatePerfume(payload);
            if (res.success) {
                flash("ok", editingId ? "Perfume updated" : "Perfume created");
                resetForm();
                load();
            } else {
                flash("err", res.error || "Failed");
            }
        });
    };

    const handleDelete = () => {
        if (!deleteModal) return;
        startTransition(async () => {
            const res = await adminDeletePerfume(deleteModal.id);
            if (res.success) {
                flash("ok", "Perfume deleted");
                setPerfumes(prev => prev.filter(p => p.id !== deleteModal.id));
                setTotal(prev => prev - 1);
            } else {
                flash("err", res.error || "Failed to delete");
            }
            setDeleteModal(null);
        });
    };

    const totalPages = Math.ceil(total / 50);

    const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.2)] outline-none focus:border-brand-500/50";

    return (
        <div className="space-y-4">
            {/* Feedback */}
            {feedback && (
                <div className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${
                    feedback.type === "ok" ? "bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)] text-emerald-400" : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-red-400"
                }`}>{feedback.msg}</div>
            )}

            {/* Header */}
            <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Droplet size={18} className="text-[#A78BFA]" />
                        <h2 className="text-lg font-bold text-white">Perfume Management</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(167,139,250,0.1)] border border-[rgba(167,139,250,0.25)] text-[#A78BFA]">
                            {total.toLocaleString()} total
                        </span>
                        <button onClick={openAdd}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-500/20 border border-brand-500/30 text-brand-500 hover:bg-brand-500/30 transition-colors">
                            <Plus size={12} /> Add Perfume
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, brand, or slug..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(232,67,147,0.4)]"
                    />
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-brand-500" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-2xl border border-[rgba(255,255,255,0.07)]">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[rgba(255,255,255,0.06)]" style={{ background: "rgba(255,255,255,0.03)" }}>
                                        {["Name", "Brand", "Gender", "Year", "Source", "Added", "Actions"].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-[rgba(255,255,255,0.3)]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {perfumes.map(p => (
                                        <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    {p.image_url && p.image_url !== "/placeholder-bottle.png" ? (
                                                        <Image src={p.image_url} alt="" width={28} height={28} className="rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-lg bg-[rgba(167,139,250,0.2)] flex items-center justify-center text-xs text-[#A78BFA] font-bold">
                                                            {p.name?.[0] ?? "?"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-white font-medium text-[13px] line-clamp-1">{p.name}</p>
                                                        <p className="text-[10px] text-[rgba(255,255,255,0.3)]">{p.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[rgba(255,255,255,0.55)] text-[13px]">{p.brand}</td>
                                            <td className="px-4 py-3 text-[rgba(255,255,255,0.4)] text-[12px] capitalize">{p.gender || "—"}</td>
                                            <td className="px-4 py-3 text-[rgba(255,255,255,0.4)] text-[12px]">{p.release_year || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    p.scraped ? "text-sky-400 bg-sky-500/10 border-sky-500/20" : "text-[#A78BFA] bg-purple-500/10 border-purple-500/20"
                                                }`}>{p.scraped ? "Imported" : "Manual"}</span>
                                            </td>
                                            <td className="px-4 py-3 text-[rgba(255,255,255,0.3)] text-[11px] whitespace-nowrap">
                                                {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => openEdit(p)} disabled={pending} title="Edit"
                                                        className="p-1.5 rounded-lg text-[#38BDF8] hover:bg-[rgba(56,189,248,0.12)] transition-colors disabled:opacity-40">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => setDeleteModal({ id: p.id, name: `${p.brand} — ${p.name}` })} disabled={pending} title="Delete"
                                                        className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[rgba(239,68,68,0.12)] transition-colors disabled:opacity-40">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {perfumes.length === 0 && (
                                <p className="text-center py-10 text-[rgba(255,255,255,0.25)] text-sm">No perfumes found.</p>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-xs text-[rgba(255,255,255,0.3)]">Page {page} of {totalPages}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-30">
                                        Previous
                                    </button>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-30">
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={resetForm}>
                    <div className="bg-[#1A1530] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white font-bold text-lg mb-4">{editingId ? "Edit Perfume" : "Add New Perfume"}</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Name *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} placeholder="Aventus" className={inputCls} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Brand *</label>
                                <input type="text" value={formData.brand} onChange={e => setFormData(d => ({ ...d, brand: e.target.value }))} placeholder="Creed" className={inputCls} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Gender</label>
                                <select value={formData.gender} onChange={e => setFormData(d => ({ ...d, gender: e.target.value }))}
                                    className={`${inputCls} appearance-none cursor-pointer`}>
                                    <option value="" className="bg-[#0D0A1E]">Any</option>
                                    <option value="men" className="bg-[#0D0A1E]">Men</option>
                                    <option value="women" className="bg-[#0D0A1E]">Women</option>
                                    <option value="unisex" className="bg-[#0D0A1E]">Unisex</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Release Year</label>
                                <input type="number" value={formData.release_year ?? ""} onChange={e => setFormData(d => ({ ...d, release_year: e.target.value ? Number(e.target.value) : null }))} placeholder="2010" className={inputCls} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Perfumer</label>
                                <input type="text" value={formData.perfumer} onChange={e => setFormData(d => ({ ...d, perfumer: e.target.value }))} placeholder="Olivier Creed" className={inputCls} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Country</label>
                                <input type="text" value={formData.country} onChange={e => setFormData(d => ({ ...d, country: e.target.value }))} placeholder="France" className={inputCls} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Image URL</label>
                                <input type="text" value={formData.image_url} onChange={e => setFormData(d => ({ ...d, image_url: e.target.value }))} placeholder="https://..." className={inputCls} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Source URL</label>
                                <input type="text" value={formData.source_url} onChange={e => setFormData(d => ({ ...d, source_url: e.target.value }))} placeholder="https://..." className={inputCls} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData(d => ({ ...d, description: e.target.value }))} rows={3} placeholder="A fresh, bold fragrance..." className={`${inputCls} resize-none`} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Top Notes <span className="normal-case font-normal">(comma separated)</span></label>
                                <input type="text" value={topNotesStr} onChange={e => setTopNotesStr(e.target.value)} placeholder="Bergamot, Lemon, Apple" className={inputCls} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Heart Notes <span className="normal-case font-normal">(comma separated)</span></label>
                                <input type="text" value={heartNotesStr} onChange={e => setHeartNotesStr(e.target.value)} placeholder="Rose, Jasmine, Birch" className={inputCls} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Base Notes <span className="normal-case font-normal">(comma separated)</span></label>
                                <input type="text" value={baseNotesStr} onChange={e => setBaseNotesStr(e.target.value)} placeholder="Musk, Sandalwood, Vetiver" className={inputCls} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Accords <span className="normal-case font-normal">(comma separated)</span></label>
                                <input type="text" value={accordsStr} onChange={e => setAccordsStr(e.target.value)} placeholder="Woody, Fresh, Citrus" className={inputCls} />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <button onClick={resetForm} className="px-4 py-2 text-sm rounded-xl border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={pending || !formData.name.trim() || !formData.brand.trim()}
                                className="px-5 py-2 text-sm rounded-xl font-semibold bg-brand-500/20 text-brand-500 border border-brand-500/30 hover:bg-brand-500/30 transition-all disabled:opacity-50">
                                {pending ? <Loader2 size={14} className="inline animate-spin mr-1" /> : <Save size={14} className="inline mr-1" />}
                                {pending ? "Saving..." : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal(null)}>
                    <div className="bg-[#1A1530] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white font-bold text-lg mb-1">Delete Perfume</h3>
                        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-2">Permanently delete <strong className="text-red-400">{deleteModal.name}</strong>?</p>
                        <p className="text-[rgba(255,255,255,0.35)] text-xs mb-4">This will also remove all associated reviews, dupes, and wardrobe entries.</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm rounded-xl border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] transition-all">Cancel</button>
                            <button onClick={handleDelete} disabled={pending} className="px-4 py-2 text-sm rounded-xl font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50">{pending ? "..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// -- B2B Claims Table --------------------------------------------------------
function BrandClaimsTable({ claims }: { claims: BrandClaim[] }) {
    const [items, setItems] = useState(claims);
    const [pending, startTransition] = useTransition();

    const handleUpdate = (id: string, newStatus: "APPROVED" | "REJECTED") => {
        startTransition(async () => {
            await updateBrandClaimStatus(id, newStatus);
            setItems((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.08)]">
                        <th className="pb-3 px-4 text-xs font-semibold text-[rgba(255,255,255,0.5)]">Brand / Email</th>
                        <th className="pb-3 px-4 text-xs font-semibold text-[rgba(255,255,255,0.5)]">Submitter</th>
                        <th className="pb-3 px-4 text-xs font-semibold text-[rgba(255,255,255,0.5)]">Status</th>
                        <th className="pb-3 px-4 text-xs font-semibold text-[rgba(255,255,255,0.5)] text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {items.map((claim) => (
                        <tr key={claim.id} className="group hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                            <td className="py-4 px-4 align-top">
                                <p className="text-sm font-bold text-white">{claim.brandName}</p>
                                <p className="text-xs text-[rgba(255,255,255,0.4)]">{claim.officialEmail}</p>
                                {claim.message && (
                                    <p className="text-[11px] text-[rgba(255,255,255,0.5)] mt-1 max-w-[200px] truncate" title={claim.message}>
                                        {claim.message}
                                    </p>
                                )}
                            </td>
                            <td className="py-4 px-4 align-top">
                                <p className="text-sm text-white">{claim.user.name || "Unknown"}</p>
                            </td>
                            <td className="py-4 px-4 align-top">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${claim.status === "APPROVED" ? "text-green-400 bg-green-500/10 border-green-500/20" : claim.status === "REJECTED" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"}`}>
                                    {claim.status}
                                </span>
                            </td>
                            <td className="py-4 px-4 align-top text-right space-x-2">
                                {claim.status === "PENDING" && (
                                    <>
                                        <button onClick={() => handleUpdate(claim.id, "APPROVED")} disabled={pending} className="px-3 py-1 bg-green-500/20 border border-green-500/40 text-green-400 text-xs rounded-lg hover:bg-green-500/30 transition-colors">
                                            Approve
                                        </button>
                                        <button onClick={() => handleUpdate(claim.id, "REJECTED")} disabled={pending} className="px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-colors">
                                            Reject
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-8 text-center text-[rgba(255,255,255,0.3)] text-sm">
                                No B2B claims found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// -- Suggestions Manager --------------------------------------------------------

function SuggestionsManager() {
    const [suggestions, setSuggestions] = useState<SuggestedPerfumeItem[]>([]);
    const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
    const [loading, setLoading] = useState(true);
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
    const [rejectModal, setRejectModal] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminSuggestedPerfumes(filter === "ALL" ? undefined : filter);
            setSuggestions(data);
        } catch { /* */ }
        setLoading(false);
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const flash = (type: "ok" | "err", msg: string) => {
        setFeedback({ type, msg });
        setTimeout(() => setFeedback(null), 4000);
    };

    const handleApprove = (id: string) => {
        startTransition(async () => {
            const res = await approveSuggestedPerfume(id);
            if (res.success) {
                flash("ok", "Perfume approved and added to catalog!");
                load();
            } else {
                flash("err", ("error" in res ? res.error : null) || "Failed to approve");
            }
        });
    };

    const startEdit = (s: SuggestedPerfumeItem) => {
        setEditingId(s.id);
        setEditData({
            name: s.name || "",
            brand: s.brand || "",
            gender: s.gender || "",
            description: s.description || "",
            perfumer: s.perfumer || "",
            releaseYear: s.releaseYear?.toString() || "",
            topNotes: (() => { try { const v = typeof s.topNotes === "string" ? JSON.parse(s.topNotes) : s.topNotes; return Array.isArray(v) ? v.join(", ") : ""; } catch { return ""; } })(),
            heartNotes: (() => { try { const v = typeof s.heartNotes === "string" ? JSON.parse(s.heartNotes) : s.heartNotes; return Array.isArray(v) ? v.join(", ") : ""; } catch { return ""; } })(),
            baseNotes: (() => { try { const v = typeof s.baseNotes === "string" ? JSON.parse(s.baseNotes) : s.baseNotes; return Array.isArray(v) ? v.join(", ") : ""; } catch { return ""; } })(),
            accords: (() => { try { const v = typeof s.accords === "string" ? JSON.parse(s.accords) : s.accords; return Array.isArray(v) ? v.join(", ") : ""; } catch { return ""; } })(),
        });
    };

    const saveEdit = (id: string) => {
        startTransition(async () => {
            const toJsonArray = (v: string) => JSON.stringify(v.split(",").map(s => s.trim()).filter(Boolean));
            const res = await updateSuggestedPerfume(id, {
                name: editData.name,
                brand: editData.brand,
                gender: editData.gender || undefined,
                description: editData.description || undefined,
                perfumer: editData.perfumer || undefined,
                releaseYear: editData.releaseYear ? parseInt(editData.releaseYear) : null,
                topNotes: toJsonArray(editData.topNotes),
                heartNotes: toJsonArray(editData.heartNotes),
                baseNotes: toJsonArray(editData.baseNotes),
                accords: toJsonArray(editData.accords),
            });
            if (res.success) {
                flash("ok", "Suggestion updated");
                setEditingId(null);
                load();
            } else {
                flash("err", "Failed to update");
            }
        });
    };

    const handleReject = () => {
        if (!rejectModal) return;
        startTransition(async () => {
            const res = await rejectSuggestedPerfume(rejectModal, rejectReason || undefined);
            if (res.success) {
                flash("ok", "Suggestion rejected");
                load();
            } else {
                flash("err", "Failed to reject");
            }
            setRejectModal(null);
            setRejectReason("");
        });
    };

    const parseNotes = (v: string | null) => {
        if (!v) return [];
        try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; }
    };

    return (
        <div className="space-y-4">
            {feedback && (
                <div className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${
                    feedback.type === "ok" ? "bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)] text-emerald-400" : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-red-400"
                }`}>{feedback.msg}</div>
            )}

            <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Lightbulb size={18} className="text-[#F59E0B]" />
                        <h2 className="text-lg font-bold text-white">User Suggestions</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                                    filter === f
                                        ? "bg-brand-500/20 border-brand-500/30 text-brand-500"
                                        : "border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                                }`}>
                                {f.charAt(0) + f.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-brand-500" />
                    </div>
                ) : suggestions.length === 0 ? (
                    <p className="text-center py-16 text-[rgba(255,255,255,0.25)] text-sm">No suggestions found.</p>
                ) : (
                    <div className="space-y-4">
                        {suggestions.map((s: SuggestedPerfumeItem) => {
                            const top = parseNotes(s.topNotes);
                            const heart = parseNotes(s.heartNotes);
                            const base = parseNotes(s.baseNotes);
                            const accords = parseNotes(s.accords);
                            const isEditing = editingId === s.id;
                            const inputCls = "w-full p-2 rounded-lg text-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none";
                            return (
                                <div key={s.id} className="rounded-xl border border-[rgba(255,255,255,0.06)] p-5 hover:border-[rgba(255,255,255,0.12)] transition-colors"
                                    style={{ background: "rgba(255,255,255,0.02)" }}>
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Name</label>
                                                    <input value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Brand</label>
                                                    <input value={editData.brand} onChange={e => setEditData(d => ({ ...d, brand: e.target.value }))} className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Gender</label>
                                                    <input value={editData.gender} onChange={e => setEditData(d => ({ ...d, gender: e.target.value }))} placeholder="e.g. unisex, male, female" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Perfumer</label>
                                                    <input value={editData.perfumer} onChange={e => setEditData(d => ({ ...d, perfumer: e.target.value }))} className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Release Year</label>
                                                    <input value={editData.releaseYear} onChange={e => setEditData(d => ({ ...d, releaseYear: e.target.value }))} type="number" className={inputCls} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Description</label>
                                                <textarea value={editData.description} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} className={inputCls + " resize-none h-16"} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Top Notes (comma-separated)</label>
                                                    <input value={editData.topNotes} onChange={e => setEditData(d => ({ ...d, topNotes: e.target.value }))} className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Heart Notes (comma-separated)</label>
                                                    <input value={editData.heartNotes} onChange={e => setEditData(d => ({ ...d, heartNotes: e.target.value }))} className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Base Notes (comma-separated)</label>
                                                    <input value={editData.baseNotes} onChange={e => setEditData(d => ({ ...d, baseNotes: e.target.value }))} className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 block">Accords (comma-separated)</label>
                                                    <input value={editData.accords} onChange={e => setEditData(d => ({ ...d, accords: e.target.value }))} className={inputCls} />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">Cancel</button>
                                                <button onClick={() => saveEdit(s.id)} disabled={pending} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50">Save Changes</button>
                                            </div>
                                        </div>
                                    ) : (
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-white font-bold text-base">{s.name}</h3>
                                                <span className="text-[rgba(255,255,255,0.4)] text-sm">by {s.brand}</span>
                                                {s.gender && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-[#F783AC] bg-[rgba(247,131,172,0.1)] border-[rgba(247,131,172,0.25)] capitalize">{s.gender}</span>}
                                                {s.releaseYear && <span className="text-[10px] text-[rgba(255,255,255,0.35)]">({s.releaseYear})</span>}
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    s.status === "PENDING" ? "text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.25)]" :
                                                    s.status === "APPROVED" ? "text-emerald-400 bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.25)]" :
                                                    "text-red-400 bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.25)]"
                                                }`}>{s.status}</span>
                                            </div>
                                            {s.perfumer && <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">Perfumer: <span className="text-[rgba(255,255,255,0.6)]">{s.perfumer}</span></p>}
                                            {s.description && <p className="text-[12px] text-[rgba(255,255,255,0.45)] mt-2 line-clamp-2">{s.description}</p>}

                                            {/* Notes */}
                                            <div className="flex flex-wrap gap-3 mt-3">
                                                {top.length > 0 && (
                                                    <div><span className="text-[9px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)]">Top:</span>{" "}
                                                        <span className="text-[11px] text-[rgba(255,255,255,0.5)]">{top.join(", ")}</span></div>
                                                )}
                                                {heart.length > 0 && (
                                                    <div><span className="text-[9px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)]">Heart:</span>{" "}
                                                        <span className="text-[11px] text-[rgba(255,255,255,0.5)]">{heart.join(", ")}</span></div>
                                                )}
                                                {base.length > 0 && (
                                                    <div><span className="text-[9px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.3)]">Base:</span>{" "}
                                                        <span className="text-[11px] text-[rgba(255,255,255,0.5)]">{base.join(", ")}</span></div>
                                                )}
                                            </div>
                                            {accords.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {accords.map((a: string, i: number) => (
                                                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.03)]">{a}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Submitter info */}
                                            <p className="text-[10px] text-[rgba(255,255,255,0.25)] mt-3">
                                                Submitted by {s.user?.name || s.user?.email || "Unknown"} • {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                                            </p>
                                            {s.adminNotes && <p className="text-[10px] text-red-400/60 mt-1">Admin: {s.adminNotes}</p>}
                                        </div>

                                        {/* Actions */}
                                        {s.status === "PENDING" && (
                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                <button onClick={() => startEdit(s)} disabled={pending}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50">
                                                    <Pencil size={12} className="inline mr-1" /> Edit
                                                </button>
                                                <button onClick={() => handleApprove(s.id)} disabled={pending}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                                                    <CheckCircle2 size={12} className="inline mr-1" /> Approve
                                                </button>
                                                <button onClick={() => setRejectModal(s.id)} disabled={pending}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50">
                                                    <X size={12} className="inline mr-1" /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setRejectModal(null); setRejectReason(""); }}>
                    <div className="bg-[#1A1530] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white font-bold text-lg mb-1">Reject Suggestion</h3>
                        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-4">Provide an optional reason for rejection.</p>
                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional)..."
                            className="w-full mb-4 p-3 rounded-xl text-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none resize-none h-20" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => { setRejectModal(null); setRejectReason(""); }} className="px-4 py-2 text-sm rounded-xl border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] transition-all">Cancel</button>
                            <button onClick={handleReject} disabled={pending} className="px-4 py-2 text-sm rounded-xl font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50">{pending ? "..." : "Reject"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// -- Env Variables Panel --------------------------------------------------------

function EnvVariablesPanel() {
    const [vars, setVars] = useState<EnvVarItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newMasked, setNewMasked] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
    const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});

    // Load on mount
    const loadVars = async () => {
        try {
            const data = await getEnvVariables();
            setVars(data);
            setLoaded(true);
        } catch {
            setLoaded(true);
        }
    };

    useState(() => { loadVars(); });

    const handleReveal = async (id: string) => {
        if (revealedIds.has(id)) {
            setRevealedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
            return;
        }
        const val = await getEnvVariableDecrypted(id);
        if (val !== null) {
            setRevealedValues(prev => ({ ...prev, [id]: val }));
            setRevealedIds(prev => new Set(prev).add(id));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        const result = await upsertEnvVariable(newKey, newValue, newMasked);
        setSaving(false);
        if (result.success) {
            setFeedback({ success: true, message: `${newKey} saved successfully.` });
            setNewKey("");
            setNewValue("");
            setNewMasked(true);
            setShowAdd(false);
            await loadVars();
        } else {
            setFeedback({ success: false, message: result.error || "Failed to save." });
        }
    };

    const handleDelete = async (id: string, key: string) => {
        if (!confirm(`Delete ${key}? This cannot be undone.`)) return;
        const result = await deleteEnvVariable(id);
        if (result.success) {
            setVars(prev => prev.filter(v => v.id !== id));
            setFeedback({ success: true, message: `${key} deleted.` });
        } else {
            setFeedback({ success: false, message: result.error || "Failed to delete." });
        }
    };

    if (!loaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Key size={18} className="text-[#F59E0B]" />
                    <h2 className="text-lg font-bold text-white">Environment Variables</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadVars()}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                    >
                        <RefreshCw size={12} className="inline mr-1" /> Refresh
                    </button>
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-500/20 border border-brand-500/30 text-brand-500 hover:bg-brand-500/30 transition-colors"
                    >
                        <Plus size={12} className="inline mr-1" /> Add Variable
                    </button>
                </div>
            </div>

            <p className="text-[13px] text-[rgba(255,255,255,0.4)]">
                Manage environment variables stored with AES-256-GCM encryption. Changes take effect immediately on the server runtime. Variables persist across restarts.
            </p>

            {/* Feedback */}
            {feedback && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
                    feedback.success
                        ? "bg-[rgba(247,131,172,0.1)] border-[rgba(247,131,172,0.25)] text-[#F783AC]"
                        : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.25)] text-[#EF4444]"
                }`}>
                    {feedback.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Add Form */}
            {showAdd && (
                <div className="rounded-2xl p-5 space-y-4 border border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Variable Key</label>
                        <input
                            type="text"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                            placeholder="NEXT_PUBLIC_MY_KEY"
                            className="w-full px-3 py-2.5 rounded-xl text-sm bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.2)] outline-none focus:border-brand-500/50 font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 block">Value</label>
                        <textarea
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="sk-xxxx..."
                            rows={2}
                            className="w-full px-3 py-2.5 rounded-xl text-sm bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.2)] outline-none focus:border-brand-500/50 font-mono resize-none"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newMasked}
                                onChange={(e) => setNewMasked(e.target.checked)}
                                className="rounded accent-brand-500"
                            />
                            Mask value in UI (secrets)
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowAdd(false)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !newKey || !newValue}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                    saving || !newKey || !newValue
                                        ? "bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.2)] cursor-not-allowed"
                                        : "bg-brand-500/20 border border-brand-500/30 text-brand-500 hover:bg-brand-500/30"
                                }`}
                            >
                                {saving ? <Loader2 size={12} className="inline animate-spin mr-1" /> : <Save size={12} className="inline mr-1" />}
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Variables List */}
            <div className="space-y-2">
                {vars.length === 0 ? (
                    <div className="rounded-2xl p-10 text-center border border-dashed border-[rgba(255,255,255,0.1)]" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <Key size={24} className="mx-auto mb-3 text-[rgba(255,255,255,0.15)]" />
                        <p className="text-sm text-[rgba(255,255,255,0.3)]">No environment variables configured yet.</p>
                        <p className="text-xs text-[rgba(255,255,255,0.2)] mt-1">Click &quot;Add Variable&quot; to get started.</p>
                    </div>
                ) : (
                    vars.map((v) => (
                        <div
                            key={v.id}
                            className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-colors"
                            style={{ background: "rgba(255,255,255,0.02)" }}
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-mono font-bold text-[#F59E0B] truncate">{v.key}</p>
                                <p className="text-xs font-mono text-[rgba(255,255,255,0.3)] truncate mt-0.5">
                                    {revealedIds.has(v.id) ? revealedValues[v.id] : v.value}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {v.masked && (
                                    <button
                                        onClick={() => handleReveal(v.id)}
                                        className="p-1.5 rounded-lg text-[rgba(255,255,255,0.3)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                                        title={revealedIds.has(v.id) ? "Hide" : "Reveal"}
                                    >
                                        {revealedIds.has(v.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(v.id, v.key)}
                                    className="p-1.5 rounded-lg text-[rgba(255,255,255,0.3)] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* SMTP Quick Setup */}
            <div className="rounded-2xl p-5 border border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center gap-2 mb-3">
                    <Mail size={16} className="text-[#38BDF8]" />
                    <h3 className="text-sm font-bold text-white">SMTP / Email Quick Setup</h3>
                </div>
                <p className="text-[12px] text-[rgba(255,255,255,0.4)] mb-3">
                    Add these variables to enable transactional email (password resets, notifications). Use the &quot;Add Variable&quot; button above.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: "SMTP_HOST", hint: "smtp.gmail.com" },
                        { key: "SMTP_PORT", hint: "587" },
                        { key: "SMTP_USER", hint: "you@gmail.com" },
                        { key: "SMTP_PASSWORD", hint: "app password" },
                        { key: "SMTP_FROM", hint: "noreply@subash.com" },
                        { key: "SMTP_SECURE", hint: "true / false" },
                    ].map(item => {
                        const exists = vars.some(v => v.key === item.key);
                        return (
                            <div key={item.key} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                exists ? "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                            }`}>
                                <div>
                                    <p className="text-xs font-mono font-bold text-[rgba(255,255,255,0.7)]">{item.key}</p>
                                    <p className="text-[10px] text-[rgba(255,255,255,0.25)]">{item.hint}</p>
                                </div>
                                {exists ? (
                                    <span className="text-[9px] font-bold text-emerald-400/70">SET</span>
                                ) : (
                                    <button onClick={() => { setNewKey(item.key); setNewValue(""); setNewMasked(item.key === "SMTP_PASSWORD"); setShowAdd(true); }}
                                        className="text-[10px] font-bold text-[#38BDF8] hover:underline">
                                        Configure
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Auth & Security Quick Setup */}
            <div className="rounded-2xl p-5 border border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={16} className="text-[#A78BFA]" />
                    <h3 className="text-sm font-bold text-white">Auth & Security</h3>
                </div>
                <p className="text-[12px] text-[rgba(255,255,255,0.4)] mb-3">
                    Core authentication secrets. AUTH_SECRET is required for session encryption.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: "AUTH_SECRET", hint: "random 32+ char string", masked: true },
                        { key: "AUTH_URL", hint: "https://subash.rico.bd", masked: false },
                        { key: "NEXT_PUBLIC_SITE_URL", hint: "https://subash.rico.bd", masked: false },
                        { key: "ENV_ENCRYPTION_KEY", hint: "AES-256 key for env vars", masked: true },
                    ].map(item => {
                        const exists = vars.some(v => v.key === item.key);
                        return (
                            <div key={item.key} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                exists ? "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                            }`}>
                                <div>
                                    <p className="text-xs font-mono font-bold text-[rgba(255,255,255,0.7)]">{item.key}</p>
                                    <p className="text-[10px] text-[rgba(255,255,255,0.25)]">{item.hint}</p>
                                </div>
                                {exists ? (
                                    <span className="text-[9px] font-bold text-emerald-400/70">SET</span>
                                ) : (
                                    <button onClick={() => { setNewKey(item.key); setNewValue(""); setNewMasked(item.masked); setShowAdd(true); }}
                                        className="text-[10px] font-bold text-[#A78BFA] hover:underline">
                                        Configure
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Google OAuth Quick Setup */}
            <div className="rounded-2xl p-5 border border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center gap-2 mb-3">
                    <Globe size={16} className="text-[#F59E0B]" />
                    <h3 className="text-sm font-bold text-white">Google OAuth</h3>
                </div>
                <p className="text-[12px] text-[rgba(255,255,255,0.4)] mb-3">
                    Enable &quot;Sign in with Google&quot;. Get credentials from Google Cloud Console.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: "GOOGLE_CLIENT_ID", hint: "xxxxx.apps.googleusercontent.com" },
                        { key: "GOOGLE_CLIENT_SECRET", hint: "GOCSPX-xxxxx" },
                    ].map(item => {
                        const exists = vars.some(v => v.key === item.key);
                        return (
                            <div key={item.key} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                exists ? "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                            }`}>
                                <div>
                                    <p className="text-xs font-mono font-bold text-[rgba(255,255,255,0.7)]">{item.key}</p>
                                    <p className="text-[10px] text-[rgba(255,255,255,0.25)]">{item.hint}</p>
                                </div>
                                {exists ? (
                                    <span className="text-[9px] font-bold text-emerald-400/70">SET</span>
                                ) : (
                                    <button onClick={() => { setNewKey(item.key); setNewValue(""); setNewMasked(true); setShowAdd(true); }}
                                        className="text-[10px] font-bold text-[#F59E0B] hover:underline">
                                        Configure
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Facebook OAuth Quick Setup */}
            <div className="rounded-2xl p-5 border border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center gap-2 mb-3">
                    <Users2 size={16} className="text-[#60A5FA]" />
                    <h3 className="text-sm font-bold text-white">Facebook OAuth</h3>
                </div>
                <p className="text-[12px] text-[rgba(255,255,255,0.4)] mb-3">
                    Enable &quot;Sign in with Facebook&quot;. Get credentials from Meta Developers.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: "FACEBOOK_CLIENT_ID", hint: "App ID" },
                        { key: "FACEBOOK_CLIENT_SECRET", hint: "App Secret" },
                    ].map(item => {
                        const exists = vars.some(v => v.key === item.key);
                        return (
                            <div key={item.key} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                exists ? "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                            }`}>
                                <div>
                                    <p className="text-xs font-mono font-bold text-[rgba(255,255,255,0.7)]">{item.key}</p>
                                    <p className="text-[10px] text-[rgba(255,255,255,0.25)]">{item.hint}</p>
                                </div>
                                {exists ? (
                                    <span className="text-[9px] font-bold text-emerald-400/70">SET</span>
                                ) : (
                                    <button onClick={() => { setNewKey(item.key); setNewValue(""); setNewMasked(true); setShowAdd(true); }}
                                        className="text-[10px] font-bold text-[#60A5FA] hover:underline">
                                        Configure
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Firebase Quick Setup */}
            <div className="rounded-2xl p-5 border border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center gap-2 mb-3">
                    <Database size={16} className="text-[#F59E0B]" />
                    <h3 className="text-sm font-bold text-white">Firebase (Analytics & Real-time)</h3>
                </div>
                <p className="text-[12px] text-[rgba(255,255,255,0.4)] mb-3">
                    Powers online user counter and analytics. Get from Firebase Console → Project Settings.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: "NEXT_PUBLIC_FIREBASE_API_KEY", hint: "AIzaSy..." },
                        { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", hint: "project.firebaseapp.com" },
                        { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", hint: "my-project-id" },
                        { key: "NEXT_PUBLIC_FIREBASE_APP_ID", hint: "1:xxxx:web:xxxx" },
                        { key: "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", hint: "G-XXXXXXXXXX" },
                    ].map(item => {
                        const exists = vars.some(v => v.key === item.key);
                        return (
                            <div key={item.key} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                exists ? "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                            }`}>
                                <div>
                                    <p className="text-xs font-mono font-bold text-[rgba(255,255,255,0.7)]">{item.key}</p>
                                    <p className="text-[10px] text-[rgba(255,255,255,0.25)]">{item.hint}</p>
                                </div>
                                {exists ? (
                                    <span className="text-[9px] font-bold text-emerald-400/70">SET</span>
                                ) : (
                                    <button onClick={() => { setNewKey(item.key); setNewValue(""); setNewMasked(false); setShowAdd(true); }}
                                        className="text-[10px] font-bold text-[#F59E0B] hover:underline">
                                        Configure
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cloudflare Turnstile Quick Setup */}
            <div className="rounded-2xl p-5 border border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={16} className="text-[#38BDF8]" />
                    <h3 className="text-sm font-bold text-white">Cloudflare Turnstile (CAPTCHA)</h3>
                </div>
                <p className="text-[12px] text-[rgba(255,255,255,0.4)] mb-3">
                    Bot protection on registration &amp; login. Get keys from Cloudflare Dashboard → Turnstile.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: "NEXT_PUBLIC_TURNSTILE_SITE_KEY", hint: "0x4AAAA..." },
                        { key: "TURNSTILE_SECRET_KEY", hint: "0x4AAAA..." },
                    ].map(item => {
                        const exists = vars.some(v => v.key === item.key);
                        return (
                            <div key={item.key} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                exists ? "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                            }`}>
                                <div>
                                    <p className="text-xs font-mono font-bold text-[rgba(255,255,255,0.7)]">{item.key}</p>
                                    <p className="text-[10px] text-[rgba(255,255,255,0.25)]">{item.hint}</p>
                                </div>
                                {exists ? (
                                    <span className="text-[9px] font-bold text-emerald-400/70">SET</span>
                                ) : (
                                    <button onClick={() => { setNewKey(item.key); setNewValue(""); setNewMasked(item.key === "TURNSTILE_SECRET_KEY"); setShowAdd(true); }}
                                        className="text-[10px] font-bold text-[#38BDF8] hover:underline">
                                        Configure
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Weather API Quick Setup */}
            <div className="rounded-2xl p-5 border border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center gap-2 mb-3">
                    <Globe size={16} className="text-[#34D399]" />
                    <h3 className="text-sm font-bold text-white">Weather & Location</h3>
                </div>
                <p className="text-[12px] text-[rgba(255,255,255,0.4)] mb-3">
                    Powers weather-based scent recommendations. Get API key from OpenWeatherMap.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: "OPENWEATHERMAP_API_KEY", hint: "abcdef123456...", masked: true },
                        { key: "NEXT_PUBLIC_DEFAULT_CITY", hint: "Dhaka", masked: false },
                    ].map(item => {
                        const exists = vars.some(v => v.key === item.key);
                        return (
                            <div key={item.key} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                exists ? "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)]" : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                            }`}>
                                <div>
                                    <p className="text-xs font-mono font-bold text-[rgba(255,255,255,0.7)]">{item.key}</p>
                                    <p className="text-[10px] text-[rgba(255,255,255,0.25)]">{item.hint}</p>
                                </div>
                                {exists ? (
                                    <span className="text-[9px] font-bold text-emerald-400/70">SET</span>
                                ) : (
                                    <button onClick={() => { setNewKey(item.key); setNewValue(""); setNewMasked(item.masked); setShowAdd(true); }}
                                        className="text-[10px] font-bold text-[#34D399] hover:underline">
                                        Configure
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
