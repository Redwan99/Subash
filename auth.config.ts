// auth.config.ts
// Edge-runtime-safe NextAuth config.
// Imported by middleware (runs in Edge) — must NOT reference Prisma or bcryptjs.
// The full auth.ts extends this config with PrismaAdapter + CredentialsProvider.

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

export const authConfig = {
  providers: [
    // Edge-compatible providers only (no Credentials here — that needs bcrypt)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // session callback only reads from token — no DB call, edge-safe.
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: (token.role as string) ?? "STANDARD",
          review_count: (token.review_count as number) ?? 0,
          phoneVerified: (token.phoneVerified as boolean) ?? false,
        },
      };
    },
    // Minimal authorized callback for middleware — just read from token
    authorized({ auth }) {
      return !!auth;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login/error",
  },

  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
