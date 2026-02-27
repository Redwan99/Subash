"use client";
// components/layout/LayoutShell.tsx

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TopNavbar } from "./TopNavbar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { BottomNav } from "./BottomNav";
import { WeatherThemeProvider } from "./WeatherThemeProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";

const AUTH_ROUTES = ["/auth/signin", "/auth/register", "/auth/verify-phone", "/auth/error"];

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter:   { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  duration: 0.2,
};

/**
 * Renders the ambient background orbs ONLY on the client after mount.
 * This prevents browser-extension HTML mutations (e.g. booster_root) from
 * causing React hydration mismatches, because the server sends no markup
 * for this element at all.
 */
function AmbientOrbs() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div
        style={{ animation: "orbDrift 22s ease-in-out infinite" }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.25] bg-[var(--bg-glow-color)] transition-colors duration-[2000ms]"
      />
      <div
        style={{ animation: "orbDriftAlt 28s ease-in-out infinite" }}
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.20] bg-[var(--bg-glow-color)] transition-colors duration-[2000ms]"
      />
      <div
        style={{ animation: "orbDriftSlow 18s ease-in-out infinite" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.12] bg-[var(--accent-glow,rgba(139,92,246,0.3))] transition-colors duration-[2000ms]"
      />
    </div>
  );
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const authPage = isAuthRoute(pathname);

  if (authPage) {
    // Auth pages: full-screen, no layout chrome
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={shouldReduceMotion ? { opacity: 1 } : pageVariants.initial}
          animate={shouldReduceMotion ? { opacity: 1 } : pageVariants.enter}
          exit={shouldReduceMotion ? { opacity: 1 } : pageVariants.exit}
          transition={shouldReduceMotion ? { duration: 0 } : pageTransition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      {/* ── Weather-reactive theme + ambient orbs ───────────── */}
      <WeatherThemeProvider />
      <AmbientOrbs />

      {/* ── Top Navbar (full-width, z-50) ────────────────────── */}
      <TopNavbar />

      {/* ── Left Sidebar ─────────────────────────────────────── */}
      <LeftSidebar />

      {/* ── Right Sidebar ────────────────────────────────────── */}
      <RightSidebar />

      {/* ── Mobile Bottom Nav ────────────────────────────────── */}
      <BottomNav />

      {/* ── Floating Chat Widget ─────────────────────────────── */}
      <ChatWidget />

      {/* ── Main Content Area ────────────────────────────────── */}
      {/*
        Offset from top by TopNavbar height.
        Desktop: pushed right of LeftSidebar + left of RightSidebar.
        Mobile:  full width, padded bottom for BottomNav.
      */}
      <main
        className={[
          "min-h-[calc(100vh-var(--topnav-height,60px))]",
          // Push down below TopNavbar
          "pt-[var(--topnav-height,60px)]",
          // Desktop sidebar offsets
          "md:ml-[var(--sidebar-width)]",
          "lg:mr-[var(--sidebar-right-width)]",
          // Mobile bottom nav offset
          "pb-16 md:pb-0",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={shouldReduceMotion ? { opacity: 1 } : pageVariants.initial}
            animate={shouldReduceMotion ? { opacity: 1 } : pageVariants.enter}
            exit={shouldReduceMotion ? { opacity: 1 } : pageVariants.exit}
            transition={shouldReduceMotion ? { duration: 0 } : pageTransition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
