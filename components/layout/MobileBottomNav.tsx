"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, BookOpen, User, Droplet } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Reviews", path: "/reviews", icon: Compass },
    { name: "Status", path: "#status", icon: Droplet, isAction: true },
    { name: "Lexicon", path: "/encyclopedia", icon: BookOpen },
    { name: "Profile", path: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 md:hidden flex justify-center px-4 pointer-events-none">
      <nav className="flex items-center justify-between gap-1 p-2 bg-white/80 dark:bg-black/70 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={item.name}
                className="relative p-3 mx-1 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full text-black shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
                aria-label="Open currently wearing status"
                onClick={() => window.dispatchEvent(new Event("open-status-modal"))}
              >
                <Icon className="w-5 h-5 fill-current" />
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`relative p-3 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
                isActive ? "text-[var(--accent)]" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 bg-gray-100 dark:bg-white/10 rounded-full animate-fade-in-up" />
              )}
              <Icon
                className={`w-6 h-6 z-10 transition-transform duration-500 ${
                  isActive ? "scale-110 mb-1" : "scale-100"
                }`}
              />
              {isActive && (
                <span className="absolute bottom-1.5 w-1 h-1 bg-[var(--accent)] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
