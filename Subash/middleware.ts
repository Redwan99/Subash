// middleware.ts
// Phase 2.3 — Auth.js v5 middleware with full RBAC guards.

import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Auth.js v5 passes the enriched request with an `auth` property
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth((req: any) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const user = session?.user;

  const isSignedIn = !!user;
  const role: string = user?.role ?? "";
  const phoneVerified: boolean = user?.phoneVerified ?? false;
  const reviewCount: number = user?.review_count ?? 0;

  // Helper: redirect to sign-in preserving callbackUrl
  function toSignIn() {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // ─── 1. /admin — SuperAdmin only ─────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!isSignedIn) return toSignIn();
    if (role !== "SUPER_ADMIN") return NextResponse.redirect(new URL("/", req.url));
  }

  // ─── 2. /dashboard/deals — Seller (or SuperAdmin) only ───────────────────
  if (pathname.startsWith("/dashboard/deals")) {
    if (!isSignedIn) return toSignIn();
    if (role !== "SELLER" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ─── 3. /decant-market/create or /decants/create — phone verified + 50 reviews ──
  if (
    pathname.startsWith("/decant-market/create") ||
    pathname.startsWith("/decants/create")
  ) {
    if (!isSignedIn) return toSignIn();
    if (!phoneVerified) return NextResponse.redirect(new URL("/auth/verify-phone", req.url));
    if (reviewCount < 50 && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ─── 4. Other auth-required routes ───────────────────────────────────────
  const authRequired = ["/wardrobe", "/profile/edit", "/fragram/new"];
  if (authRequired.some((p) => pathname.startsWith(p))) {
    if (!isSignedIn) return toSignIn();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
