"use client";
// components/layout/TopNavbar.tsx
// Phase 3 (Pivot) — Sticky Top Navigation Bar
// Pro Max: glassmorphism, spring-animated search bar, avatar dropdown.
// Contains: Logo · Search (center) · Nav links + ThemeToggle + Bell + Avatar (right)

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Trophy,
  Camera,
  ShoppingBag,
  Briefcase,
  LogIn,
  LogOut,
  User,
  Settings,
  Bell,
  CheckCheck,
  Shield,
  BookOpen,
  Users2,
  Store,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SmartSearch } from "@/components/ui/SmartSearch";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";

// ─── Top Nav Links ────────────────────────────────────────────────────────────

const NAV_LINKS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/leaderboards", icon: Trophy, label: "Leaderboards" },
  { href: "/fragram", icon: Camera, label: "Fragram" },
  { href: "/perfume", icon: BookOpen, label: "Encyclopedia" },
  { href: "/creators", icon: Users2, label: "Creators" },
  { href: "/shops", icon: Store, label: "Boutiques" },
  { href: "/decants", icon: ShoppingBag, label: "Decants" },
  { href: "/wardrobe", icon: Briefcase, label: "Wardrobe" },
];

// ─── Nav Link Item ────────────────────────────────────────────────────────────

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Link href={href} prefetch={false}>
      <motion.div
        whileHover={shouldReduceMotion ? {} : { y: -1 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border ${active
          ? "bg-[rgba(139,92,246,0.14)] border-[rgba(139,92,246,0.28)]"
          : "border-transparent"
          }`}
      >
        <Icon
          size={15}
          strokeWidth={active ? 2.5 : 1.75}
          className={active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}
        />
        <span
          className={`text-sm font-medium hidden lg:block ${active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            }`}
        >
          {label}
        </span>

        {/* Active underline dot */}
        {active && (
          <motion.div
            layoutId="top-nav-active"
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch notifications on mount + poll every 45 s
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotes = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        const data = await res.json() as { notifications: NotificationItem[]; unreadCount: number };
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch { /* silent */ }
    };

    fetchNotes();
    const id = setInterval(fetchNotes, 45_000);
    return () => clearInterval(id);
  }, [session?.user?.id]);

  if (!session?.user?.id) return null;

  function handleNotificationClick(n: NotificationItem) {
    startTransition(async () => {
      if (!n.read) {
        await markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setOpen(false);
      if (n.link) router.push(n.link);
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    });
  }

  const ICON_FOR_TYPE: Record<string, string> = {
    REVIEW_UPVOTE: "⭐",
    DUPE_VOTE: "👍",
    FRAGRAM_LIKE: "❤️",
    REVIEW_REPLY: "💬",
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <Bell size={18} strokeWidth={1.75} />

        {/* Unread dot */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold leading-none bg-[#EF4444] text-white shadow-[0_0_6px_rgba(239,68,68,0.6)]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 26 }
            }
            className="absolute right-0 top-10 w-80 rounded-2xl overflow-hidden z-[100]
              bg-white/60 dark:bg-black/60 backdrop-blur-2xl
              border border-white/30 dark:border-white/10
              shadow-[0_8px_40px_rgba(0,0,0,0.22)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-white/10">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Notifications
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[var(--accent)] hover:underline"
                >
                  <CheckCheck size={11} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-white/10 dark:divide-white/5">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  🔔 No notifications yet
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors duration-150 ${n.read
                      ? "bg-transparent hover:bg-white/10 dark:hover:bg-white/5"
                      : "bg-[var(--accent)]/8 hover:bg-[var(--accent)]/12"
                      }`}
                  >
                    {/* Type emoji */}
                    <span className="mt-0.5 text-base leading-none shrink-0">
                      {ICON_FOR_TYPE[n.type] ?? "🔔"}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed break-words ${n.read ? "text-[var(--text-secondary)]" : "font-semibold text-[var(--text-primary)]"
                        }`}>
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                        {new Date(n.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_4px_var(--accent-glow)] shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Avatar / Profile Dropdown ────────────────────────────────────────────────

function AvatarMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full animate-pulse bg-[var(--border-color)]" />
    );
  }

  if (!session) {
    return (
      <Link href="/auth/signin" prefetch={false}>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] text-white"
        >
          <LogIn size={14} />
          <span className="hidden sm:block">Sign In</span>
        </motion.div>
      </Link>
    );
  }

  const initials = (session.user?.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden focus-visible:outline-none border-2 border-[var(--accent)] text-white ${session.user?.image ? "bg-transparent" : "bg-[linear-gradient(135deg,#8B5CF6,#6D28D9)]"
          }`}
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {session.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? "User"}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 26 }
            }
            className="absolute right-0 top-10 min-w-[180px] rounded-2xl overflow-hidden z-[100] glass"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-[var(--border-color)]">
              <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
                {session.user?.name ?? "User"}
              </p>
              <p className="text-[11px] truncate mt-0.5 text-[var(--text-muted)]">
                {session.user?.email ?? ""}
              </p>
            </div>

            {/* Menu items */}
            {[
              { href: "/profile", icon: User, label: "My Profile" },
              { href: "/wardrobe", icon: Briefcase, label: "Wardrobe" },
              { href: "/profile/edit", icon: Settings, label: "Settings" },
              { href: "/admin", icon: Shield, label: "Admin Panel" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={shouldReduceMotion ? {} : { x: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-[var(--text-secondary)]"
                >
                  <Icon size={14} />
                  <span className="text-sm">{label}</span>
                </motion.div>
              </Link>
            ))}

            {/* Divider + sign out */}
            <div className="h-px mx-3 my-1 bg-[var(--border-color)]" />
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-[#EF4444]"
            >
              <LogOut size={14} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Top Navbar ───────────────────────────────────────────────────────────────

export function TopNavbar({ featureToggles }: { featureToggles?: Record<string, boolean> }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 28, delay: 0.02 }
      }
      className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 md:px-6 h-[var(--topnav-height,60px)] glass border-b border-[var(--bg-glass-border)]"
      aria-label="Top navigation"
    >
      {/* ── Left: Logo ───────────────────────────────────────── */}
      <Link href="/" className="shrink-0 group" prefetch={false}>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex flex-col leading-none"
        >
          <span className="font-display text-xl font-bold bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)] bg-clip-text text-transparent">
            সুবাশ
          </span>
          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase -mt-0.5 text-[var(--text-muted)]">
            Subash
          </span>
        </motion.div>
      </Link>

      {/* ── Center: Search ───────────────────────────────────── */}
      <div className="flex-1 max-w-md mx-auto">
        <SmartSearch id="top-nav-search" />
      </div>

      {/* ── Right: Nav Links + Theme + Avatar ────────────────── */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Nav links — hidden on very small screens */}
        <nav className="hidden sm:flex items-center gap-0.5">
          {NAV_LINKS.filter(l => {
            if (l.label === "Encyclopedia" && featureToggles?.ENABLE_ENCYCLOPEDIA === false) return false;
            if (l.label === "Creators" && featureToggles?.ENABLE_CREATORS === false) return false;
            if (l.label === "Boutiques" && featureToggles?.ENABLE_SHOPS === false) return false;
            return true;
          }).map(({ href, icon, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <NavLink key={href} href={href} icon={icon} label={label} active={active} />
            );
          })}
        </nav>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 mx-2 bg-[var(--border-color)]" />

        {/* Theme toggle (compact pill) */}
        <ThemeToggle compact />

        {/* Spacer */}
        <div className="w-1" />

        {/* Notification Bell */}
        <NotificationBell />

        {/* Avatar / sign-in */}
        <AvatarMenu />
      </div>
    </motion.header>
  );
}
