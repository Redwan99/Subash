"use client";
// app/admin/AdminDashboardClient.tsx
// Phase 9 — Pro Max Glassmorphism Admin Dashboard Client Component

import { useState, useTransition } from "react";
import Image from "next/image";
import {
    Users, Star, Sparkles, ShieldAlert, Trash2, Crown,
    BarChart3, ShieldCheck, AlertTriangle, CheckCircle2,
    ChevronDown, Search, RefreshCw, Settings2, Power, Store, BookOpen, Users2, Activity,
    Briefcase, Database
} from "lucide-react";
import { deleteReviewAsAdmin, markReviewAsSpam, updateUserRole, updateFeatureToggle, updateBrandClaimStatus } from "@/lib/actions/admin";
import { Role, type FeatureToggle, type AuditLog } from "@prisma/client";
import { CsvImporter } from "@/components/admin/CsvImporter";

// Local type until `npx prisma db push` regenerates the client with ReviewStatus
type ReviewStatus = "APPROVED" | "PENDING" | "SPAM";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Review = {
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

type Props = {
    totalUsers: number;
    totalReviews: number;
    totalPerfumes: number;
    pendingReviews: number;
    spamReviews: number;
    recentReviews: Review[];
    users: AdminUser[];
    featureToggles: FeatureToggle[];
    auditLogs: AuditLog[];
    brandClaims: BrandClaim[];
};

// ── Role display helpers ──────────────────────────────────────────────────────

const ROLE_DISPLAY: Record<Role, { label: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", color: "text-[#F59E0B] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.3)]" },
    MODERATOR: { label: "Moderator", color: "text-[#A78BFA] bg-[rgba(139,92,246,0.12)] border-[rgba(139,92,246,0.3)]" },
    SELLER: { label: "Seller", color: "text-[#34D399] bg-[rgba(52,211,153,0.12)] border-[rgba(52,211,153,0.3)]" },
    DECANTER: { label: "Decanter", color: "text-[#60A5FA] bg-[rgba(96,165,250,0.12)] border-[rgba(96,165,250,0.3)]" },
    BRAND_PARTNER: { label: "Brand Partner", color: "text-[#EC4899] bg-[rgba(236,72,153,0.12)] border-[rgba(236,72,153,0.3)]" },
    STANDARD: { label: "User", color: "text-[var(--text-muted)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.10)]" },
};

const STATUS_DISPLAY: Record<ReviewStatus, { label: string; color: string; icon: React.ReactNode }> = {
    APPROVED: { label: "Approved", color: "text-[#34D399] bg-[rgba(52,211,153,0.12)] border-[rgba(52,211,153,0.3)]", icon: <CheckCircle2 size={11} /> },
    PENDING: { label: "Pending", color: "text-[#F59E0B] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.3)]", icon: <AlertTriangle size={11} /> },
    SPAM: { label: "Spam", color: "text-[#EF4444] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.3)]", icon: <ShieldAlert size={11} /> },
};

// ── Metric Card ───────────────────────────────────────────────────────────────

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

// ── Reviews Table ──────────────────────────────────────────────────────────────

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
                    placeholder="Search by reviewer, perfume, or text…"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(139,92,246,0.4)]"
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
                                            <div className="w-7 h-7 rounded-full bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-xs text-[#A78BFA] font-bold">
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

// ── Users Table ────────────────────────────────────────────────────────────────

function UsersTable({ users }: { users: AdminUser[] }) {
    const [query, setQuery] = useState("");
    const [items, setItems] = useState(users);
    const [pending, startTransition] = useTransition();

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

    return (
        <div>
            <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(139,92,246,0.4)]"
                />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[rgba(255,255,255,0.07)]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)]" style={{ background: "rgba(255,255,255,0.03)" }}>
                            {["User", "Email", "Role", "Reviews", "Joined", "Change Role"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-[rgba(255,255,255,0.3)]">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((user) => (
                            <tr key={user.id}
                                className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        {user.image ? (
                                            <Image src={user.image} alt="" width={28} height={28} className="rounded-full" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-xs text-[#A78BFA] font-bold">
                                                {user.name?.[0] ?? "?"}
                                            </div>
                                        )}
                                        <p className="text-white font-medium text-[13px] line-clamp-1">{user.name ?? "Anonymous"}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-[rgba(255,255,255,0.45)] text-[12px]">{user.email ?? "—"}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_DISPLAY[user.role].color}`}>
                                        {ROLE_DISPLAY[user.role].label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-white font-bold">{user.review_count}</td>
                                <td className="px-4 py-3 text-[rgba(255,255,255,0.3)] text-[11px] whitespace-nowrap">
                                    {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="relative">
                                        <select
                                            value={user.role}
                                            disabled={pending}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                            className="appearance-none text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-white outline-none cursor-pointer hover:border-[rgba(139,92,246,0.4)] disabled:opacity-40 transition-all"
                                        >
                                            {Object.entries(ROLE_DISPLAY).map(([role, { label }]) => (
                                                <option key={role} value={role} className="bg-[#0D0A1E]">{label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] pointer-events-none" />
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
        </div>
    );
}

// ── Audit Logs Table ───────────────────────────────────────────────────────────

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
                    placeholder="Search logs by User ID, Action, or Details…"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(139,92,246,0.4)]"
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
                                <td className="px-4 py-3 text-[11px] font-mono text-[#A78BFA] tracking-tight">
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

// ── Main Dashboard ─────────────────────────────────────────────────────────────

type Tab = "overview" | "reviews" | "users" | "system" | "audit" | "claims" | "import";

export function AdminDashboardClient({ totalUsers, totalReviews, totalPerfumes, pendingReviews, spamReviews, recentReviews, users, featureToggles, auditLogs, brandClaims }: Props) {
    const [tab, setTab] = useState<Tab>("overview");

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Overview", icon: <BarChart3 size={15} /> },
        { id: "reviews", label: "Reviews", icon: <Star size={15} /> },
        { id: "users", label: "Users", icon: <Users size={15} /> },
        { id: "system", label: "System Features", icon: <Settings2 size={15} /> },
        { id: "audit", label: "Audit Logs", icon: <Activity size={15} /> },
        { id: "claims", label: "B2B Claims", icon: <Briefcase size={15} /> },
        { id: "import", label: "Import Data", icon: <Database size={15} /> },
    ];

    // Local toggle state to sync UI immediately
    const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {
            "ENABLE_AI_BOT": true,
            "ENABLE_SHOPS": true,
            "ENABLE_ENCYCLOPEDIA": true,
            "ENABLE_CREATORS": true,
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
        <div className="min-h-screen text-white"
            style={{ background: "linear-gradient(135deg, #08051A 0%, #0D0A26 40%, #100C30 100%)" }}>

            {/* Ambient orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)", filter: "blur(100px)" }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[45vw] h-[45vw] rounded-full opacity-15"
                    style={{ background: "radial-gradient(circle, #2563EB 0%, transparent 70%)", filter: "blur(80px)" }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
                            <Crown size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white">God Mode</h1>
                            <p className="text-xs text-[rgba(255,255,255,0.35)] font-medium">Admin Dashboard · Subash Platform</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                        <span className="text-[11px] font-bold text-[#34D399]">LIVE</span>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex items-center gap-1 mb-8 p-1 rounded-2xl w-fit"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {tabs.map(({ id, label, icon }) => (
                        <button key={id} onClick={() => setTab(id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === id
                                ? "bg-[rgba(139,92,246,0.25)] text-[#C4B5FD] border border-[rgba(139,92,246,0.35)] shadow-[0_0_16px_rgba(139,92,246,0.2)]"
                                : "text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                                }`}>
                            {icon} {label}
                        </button>
                    ))}
                </div>

                {/* ── Overview Tab ── */}
                {tab === "overview" && (
                    <div className="space-y-8">
                        {/* Stat cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <MetricCard label="Total Users" value={totalUsers} icon={<Users size={16} />} accent="text-[#A78BFA]" glow="shadow-[0_0_30px_rgba(139,92,246,0.1)]" />
                            <MetricCard label="Total Reviews" value={totalReviews} icon={<Star size={16} />} accent="text-[#F59E0B]" glow="shadow-[0_0_30px_rgba(245,158,11,0.1)]" />
                            <MetricCard label="Total Perfumes" value={totalPerfumes} icon={<Sparkles size={16} />} accent="text-[#34D399]" glow="shadow-[0_0_30px_rgba(52,211,153,0.1)]" />
                            <MetricCard label="Pending" value={pendingReviews} icon={<AlertTriangle size={16} />} accent="text-[#F59E0B]" glow="shadow-[0_0_30px_rgba(245,158,11,0.1)]" />
                            <MetricCard label="Spam Caught" value={spamReviews} icon={<ShieldCheck size={16} />} accent="text-[#EF4444]" glow="shadow-[0_0_30px_rgba(239,68,68,0.1)]" />
                        </div>

                        {/* Quick info */}
                        <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                            style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                            <div className="flex items-center gap-2 mb-4">
                                <RefreshCw size={14} className="text-[rgba(255,255,255,0.4)]" />
                                <span className="text-xs font-bold tracking-widest uppercase text-[rgba(255,255,255,0.35)]">Quick Actions</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setTab("reviews")}
                                    className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)] hover:bg-[rgba(245,158,11,0.1)] transition-all text-left">
                                    <ShieldAlert size={18} className="text-[#F59E0B]" />
                                    <div>
                                        <p className="text-sm font-bold text-white">{pendingReviews + spamReviews} flagged</p>
                                        <p className="text-xs text-[rgba(255,255,255,0.35)]">Reviews need attention</p>
                                    </div>
                                </button>
                                <button onClick={() => setTab("users")}
                                    className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] hover:bg-[rgba(139,92,246,0.1)] transition-all text-left">
                                    <Users size={18} className="text-[#A78BFA]" />
                                    <div>
                                        <p className="text-sm font-bold text-white">{totalUsers} users</p>
                                        <p className="text-xs text-[rgba(255,255,255,0.35)]">Manage roles & access</p>
                                    </div>
                                </button>
                                <button onClick={() => setTab("claims")}
                                    className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.05)] hover:bg-[rgba(56,189,248,0.1)] transition-all text-left">
                                    <Briefcase size={18} className="text-[#38BDF8]" />
                                    <div>
                                        <p className="text-sm font-bold text-white">{brandClaims.filter((c) => c.status === "PENDING").length} pending</p>
                                        <p className="text-xs text-[rgba(255,255,255,0.35)]">B2B Brand Claims</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Reviews Tab ── */}
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

                {/* ── Users Tab ── */}
                {tab === "users" && (
                    <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                        style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-[#A78BFA]" />
                                <h2 className="text-lg font-bold text-white">User Management</h2>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.25)] text-[#A78BFA]">
                                {users.length} members
                            </span>
                        </div>
                        <UsersTable users={users} />
                    </div>
                )}

                {/* ── System Features Tab (Kill Switches) ── */}
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
                                { key: "ENABLE_AI_BOT", label: "ScentBot AI", desc: "Global access to the AI Fragrance Assistant", icon: <Sparkles size={16} /> },
                                { key: "ENABLE_SHOPS", label: "Boutiques Hub", desc: "Verified sellers and shop directory", icon: <Store size={16} /> },
                                { key: "ENABLE_ENCYCLOPEDIA", label: "Perfume Encyclopedia", desc: "Main fragrance discovery grid and filters", icon: <BookOpen size={16} /> },
                                { key: "ENABLE_CREATORS", label: "Creators Network", desc: "Master perfumers and brand directories", icon: <Users2 size={16} /> }
                            ].map(feature => (
                                <div key={feature.key} className="flex items-center justify-between p-5 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                                    <div className="flex gap-3">
                                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${toggles[feature.key] ? 'bg-[rgba(52,211,153,0.15)] text-[#34D399]' : 'bg-[rgba(239,68,68,0.15)] text-[#EF4444]'}`}>
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
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${toggles[feature.key] ? 'bg-[#34D399]' : 'bg-[rgba(255,255,255,0.15)]'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggles[feature.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Audit Logs Tab ── */}
                {tab === "audit" && (
                    <div className="rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]"
                        style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-[#34D399]" />
                                <h2 className="text-lg font-bold text-white">Security & Audit Logs</h2>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.25)] text-[#34D399]">
                                {auditLogs.length} events
                            </span>
                        </div>
                        <p className="text-[13px] text-[rgba(255,255,255,0.4)] mb-6">
                            Immutable logs of all administrative actions taken on the platform.
                        </p>
                        <AuditLogsTable logs={auditLogs} />
                    </div>
                )}

                {/* ── B2B Claims Tab ── */}
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

                {/* ── Import Data Tab ── */}
                {tab === "import" && (
                    <div className="max-w-3xl mx-auto">
                        <CsvImporter />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── B2B Claims Table ────────────────────────────────────────────────────────
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
