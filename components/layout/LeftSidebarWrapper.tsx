"use client";

import { usePathname } from "next/navigation";

/**
 * Conditionally renders LeftSidebar children.
 * On /perfume, renders a portal target for the EncyclopediaMatrix filter panel.
 */
export function LeftSidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/perfume") {
    return (
      <aside className="fixed left-0 top-[var(--topnav-height,60px)] h-[calc(100vh-var(--topnav-height,60px))] w-[var(--sidebar-width)] hidden lg:flex flex-col z-40 overflow-y-auto bg-[var(--bg-glass)] backdrop-blur-[var(--blur-backdrop)] border-r border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)] [scrollbar-width:thin] [-ms-overflow-style:none]">
        <div id="matrix-filter-portal" className="p-4 space-y-0 flex-1 pt-5" />
      </aside>
    );
  }

  return <>{children}</>;
}
