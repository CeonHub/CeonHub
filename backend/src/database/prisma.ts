import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "../config/env";

/**
 * Single PrismaClient for the whole process.
 *
 * Prisma 7 connects through a driver adapter, so the connection string is passed
 * here rather than read from schema.prisma.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
