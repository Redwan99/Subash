// types/next-auth.d.ts
// Extends the default Auth.js Session and JWT types
// to include Subash-specific fields (role, review_count, etc.)

import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extend Session.user with Subash-specific fields
   * populated in the auth.ts `session` callback.
   */
  interface Session {
    user: {
      id: string;
      role: string;
      review_count: number;
      phoneVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * Extend the JWT payload with Subash-specific fields
   * embedded in the auth.ts `jwt` callback.
   */
  interface JWT {
    id?: string;
    role?: string;
    review_count?: number;
    phoneVerified?: boolean;
  }
}
