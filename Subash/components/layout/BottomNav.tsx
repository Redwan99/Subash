"use client";
// components/layout/BottomNav.tsx
// Phase 3.3 — Mobile Bottom Navigation Bar
// Pro Max: Heavy glassmorphism blur, haptic-feel spring "pop" on tap.
// Visible on mobile only (<md). Fixed to the bottom.
// 5 icons: Home, Search, Add Review (prominent), Wardrobe, Profile.

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Plus, Archive, User, type LucideIcon } from "lucide-react";

// ─── Nav Items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/",          icon: Home,    label: "Home"    },
  { href: "/search",    icon: Search,  label: "Search"  },
  { href: "/fragram",     icon: Plus,  label: "Post",   accent: true },
  { href: "/wardrobe",  icon: Archive, label: "Wardrobe" },
  { href: "/profile",   icon: User,    label: "Profile" },
] as const;

// ─── Single Bottom Nav Item ───────────────────────────────────────────────────

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  accent,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  accent?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Link href={href} prefetch={false} className="flex-1">
      <motion.div
        // Pro Max haptic-pop: fast compress then spring-back
        whileTap={
          shouldReduceMotion
            ? {}
            : { scale: accent ? 0.88 : 0.82, y: -2 }
        }
        transition={{
          type: "spring",
          stiffness: 600,
          damping: 20,
        }}
        className="relative flex flex-col items-center justify-center h-full min-h-[var(--bottom-nav-height)] cursor-pointer select-none"
        aria-label={label}
      >
        {accent ? (
          /* ── Prominent "Add" button ──────────────────── */
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)] [box-shadow:0_4px_16px_rgba(139,92,246,0.45),_0_1px_0_rgba(255,255,255,0.2)_inset]">
            <Icon size={22} strokeWidth={2.5} className="text-white" />
          </div>
        ) : (
          /* ── Standard icon ───────────────────────────── */
          <div className="relative flex flex-col items-center gap-1">
            <div
              className={`transition-colors duration-150 ${
                active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
            </div>

            {/* Active dot */}
            {active && (
              <motion.div
                layoutId="bottom-active-dot"
                className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[var(--accent)]"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            <span
              className={`text-[10px] font-medium leading-none transition-colors duration-150 ${
                active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}
            >
              {label}
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex md:hidden z-50 h-[var(--bottom-nav-height)] bg-white/40 dark:bg-black/40 backdrop-blur-xl border-t border-white/20 dark:border-white/5 shadow-[0_-8px_40px_rgba(0,0,0,0.20)]"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ href, icon, label, ...rest }) => {
        const accent = "accent" in rest ? rest.accent : false;
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={isActive}
            accent={accent}
          />
        );
      })}
    </nav>
  );
}
