"use client";

import { usePathname } from "next/navigation";

/**
 * Conditionally renders LeftSidebar children.
 * On /perfume, EncyclopediaMatrix renders its own filter sidebar instead.
 */
export function LeftSidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/perfume") return null;
  return <>{children}</>;
}
