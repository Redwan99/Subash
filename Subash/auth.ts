// =============================================
//  Subash — Auth.js v5 Configuration
//  Providers: Google, Facebook, Credentials
//  Adapter:   Prisma (OAuth user/account creation)
//  Session:   JWT strategy
//             (required to support CredentialsProvider
//              alongside the PrismaAdapter.  OAuth users
//              are still persisted to `users` + `accounts`
//              tables; sessions are JWT cookies, not DB rows.)
// =============================================

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";

// ------------------------------------------------
//  Custom Prisma Adapter
//  Seeds Subash-specific fields (role, review_count,
//  phoneVerified, authProvider) on OAuth user creation.
// ------------------------------------------------
function SubashPrismaAdapter(): Adapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = PrismaAdapter(prisma) as any;

  return {
    ...adapter,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createUser: async (data: any) => {
      const user = await prisma.user.create({
        data: {
          name: data.name ?? null,
          email: data.email,
          emailVerified: data.emailVerified ?? null,
          image: data.image ?? null,
          role: "STANDARD",
          review_count: 0,
          phoneVerified: false,
          authProvider: (data.authProvider ?? "CREDENTIALS") as
            | "GOOGLE"
            | "FACEBOOK"
            | "CREDENTIALS",
        },
      });

      return user;
    },
  } as unknown as Adapter;
}

// ------------------------------------------------
//  NextAuth Export
// ------------------------------------------------
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: SubashPrismaAdapter(),

  providers: [
    // --- Google ---
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile(profile): any {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture ?? null,
          emailVerified: null,
          authProvider: "GOOGLE",
        };
      },
    }),

    // --- Facebook ---
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile(profile): any {
        const picture =
          typeof profile.picture === "string"
            ? profile.picture
            : (profile.picture as { data?: { url?: string } })?.data?.url ??
              null;
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email ?? null,
          image: picture,
          emailVerified: null,
          authProvider: "FACEBOOK",
        };
      },
    }),

    // --- Credentials (Email + Password) ---
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // No account found, or account belongs to an OAuth provider (no password)
        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],

  callbacks: {
    // ─── jwt ────────────────────────────────────────────────────────────────
    // `user` is only populated on the FIRST sign-in for that session.
    // We embed the Subash-specific DB fields into the token so they ride
    // along without a DB query on every subsequent request.
    // Call `update()` from the client (useSession) after phone verification
    // or review milestones to force a refresh.
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, review_count: true, phoneVerified: true },
        });
        token.id = user.id;
        token.role = dbUser?.role ?? "STANDARD";
        token.review_count = dbUser?.review_count ?? 0;
        token.phoneVerified = dbUser?.phoneVerified ?? false;
      }
      return token;
    },

    // ─── session ─────────────────────────────────────────────────────────────
    // Expose only what the client needs — never expose the raw JWT.
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          review_count: (token.review_count as number) ?? 0,
          phoneVerified: (token.phoneVerified as boolean) ?? false,
        },
      };
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: {
    // JWT required — CredentialsProvider is incompatible with "database" strategy.
    // PrismaAdapter still persists OAuth users/accounts; sessions travel as cookies.
    strategy: "jwt",
  },
});

