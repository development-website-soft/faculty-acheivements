// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma?: PrismaClient;
}

const dbUrlSet = Boolean(process.env.DATABASE_URL);
console.log('RUNTIME: DATABASE_URL present?', dbUrlSet);

const prismaClient = global.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query','error','warn'] : ['error'],
  // do NOT override datasources with an env var that might be undefined
});

if (process.env.NODE_ENV !== 'production') global.__prisma = prismaClient;

export const prisma = prismaClient;
export default prisma;
