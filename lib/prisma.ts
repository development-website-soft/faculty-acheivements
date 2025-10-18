// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

if (!process.env.DATABASE_URL) {
  // helpful debug — remove later if you want
  console.warn('WARNING: process.env.DATABASE_URL is not set at build/run time.');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // <<--- DO NOT override `datasources` here. Let Prisma read it from schema.prisma/.env
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
