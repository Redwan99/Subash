"use client";
// components/layout/TopNavbar.tsx
// Phase 3 (Pivot) � Sticky Top Navigation Bar
// Pro Max: glassmorphism, spring-animated search bar, avatar dropdown.
// Contains: Logo � Search (center) � Nav links + ThemeToggle + Bell + Avatar (right)

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Shield,
  BookOpen,
  Users2,
  Store,
  Droplet,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import dynamic from "next/dynamic";

// GlobalSearch and NotificationBell use useRouter(); render them client-only to
// avoid "expected app router to be mounted" invariants during the HTML pass.
const GlobalSearch = dynamic(
  () => import("@/components/layout/GlobalSearch"),
  { ssr: false, loading: () => <div className="h-9 w-full rounded-full bg-[var(--surface-2)] animate-pulse" /> }
);

const NotificationBellDynamic = dynamic(
  () => import("./NotificationBellClient").then((m) => ({ default: m.NotificationBellClient })),
  { ssr: false }
);
const WearingStatusModal = dynamic(
  () => import("@/components/profile/WearingStatusModal").then((m) => ({ default: m.WearingStatusModal })),
  { ssr: false }
);


// --- Top Nav Links ------------------------------------------------------------

const NAV_LINKS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/leaderboards", icon: Trophy, label: "Leaderboards" },
  { href: "/fragram", icon: Camera, label: "Fragram" },
  { href: "/encyclopedia", icon: BookOpen, label: "Encyclopedia" },
  { href: "/creators", icon: Users2, label: "Creators" },
  { href: "/shops", icon: Store, label: "Boutiques" },
  { href: "/decants", icon: ShoppingBag, label: "Decants" },
  { href: "/wardrobe", icon: Briefcase, label: "Wardrobe" },
];

// --- Nav Link Item ------------------------------------------------------------

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
    <Link href={href}>
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

// --- Avatar / Profile Dropdown ------------------------------------------------

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
      <Link href="/login" prefetch={false}>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] text-gray-900 dark:text-white active:scale-[0.97]"
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
              ...(session.user?.role === "SUPER_ADMIN"
                ? [{ href: "/admin", icon: Shield, label: "Admin Panel" }]
                : []),
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

// --- Top Navbar ---------------------------------------------------------------

export function TopNavbar({ featureToggles }: { featureToggles?: Record<string, boolean> }) {
  const rawPathname = usePathname();
  const pathname = typeof rawPathname === "string" ? rawPathname : "";
  const shouldReduceMotion = useReducedMotion();

  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setShowSearch(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowSearch(true);
      } else {
        setShowSearch(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Hide navbar on auth and legal pages
  const authPaths = ["/login", "/register", "/verify-phone", "/forgot-password"];
  if (authPaths.some((p) => pathname.startsWith(p)) || pathname.startsWith("/legal")) {
    return null;
  }

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
      {/* -- Left: Logo ----------------------------------------- */}
      <Link href="/" className="shrink-0 group flex items-center gap-2" prefetch={false}>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex items-center gap-2"
        >
          <div className="bg-brand-500/10 p-1.5 rounded-lg group-hover:bg-brand-500/20 transition-colors">
            <Droplet className="w-5 h-5 text-brand-500" />
          </div>
          <span className="font-serif font-bold text-xl tracking-wider text-gray-900 dark:text-white">
            SUBASH
          </span>
        </motion.div>
      </Link>

      {/* -- Center: Search (scroll-aware on homepage) ---------- */}
      <div className="flex-1 max-w-md mx-auto">
        {showSearch && <GlobalSearch />}
      </div>

      {/* -- Right: Nav Links + Theme + Avatar ------------------ */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Nav links � hidden on very small screens */}
        <nav className="hidden sm:flex items-center gap-0.5">
          {NAV_LINKS.filter(l => {
            if (l.label === "Encyclopedia" && featureToggles?.ENABLE_ENCYCLOPEDIA === false) return false;
            if (l.label === "Creators" && featureToggles?.ENABLE_CREATORS === false) return false;
            if (l.label === "Boutiques" && featureToggles?.ENABLE_SHOPS === false) return false;
            return true;
          }).map(({ href, icon, label }) => {
            const current = pathname || "";
            const active = href === "/" ? current === "/" : current.startsWith(href);
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

        {/* Currently Wearing status trigger */}
        <WearingStatusModal />

        {/* Spacer */}
        <div className="w-1" />

        {/* Notification Bell */}
        <NotificationBellDynamic />

        {/* Avatar / sign-in */}
        <AvatarMenu />
      </div>
    </motion.header>
  );
}


