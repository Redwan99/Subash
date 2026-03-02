// lib/prisma.ts
// Prisma client singleton — prevents new connections on every hot-reload in dev

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Allow builds to proceed without a running database by exporting a no-op mock
// when explicitly requested. This prevents Prisma from attempting a TCP
// connection during static generation (e.g. Docker build).
const shouldMock = process.env.SKIP_DB === "true" || !process.env.DATABASE_URL;

const prismaClient: PrismaClient = shouldMock
  ? (() => {
      const handler: ProxyHandler<any> = {
        get() {
          return proxyFn;
        },
        apply() {
          return Promise.resolve([]);
        },
      };
      const proxyFn: any = new Proxy(async () => [], handler);
      return proxyFn as PrismaClient;
    })()
  : (globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }));

if (!shouldMock && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient;
export default prisma;
