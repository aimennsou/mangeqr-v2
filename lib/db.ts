import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Reuse a single PrismaClient across hot-reloads in development. Next.js clears
// module state on every HMR reload, so without caching on `globalThis` a new
// client (and connection pool) is created each time, eventually exhausting the
// database with "too many clients already".
export const db = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}
