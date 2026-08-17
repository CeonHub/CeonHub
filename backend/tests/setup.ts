import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/database/prisma";

let tableNames: string[] | null = null;

/** Empties every application table so each test starts from a known state. */
async function resetDatabase(): Promise<void> {
  if (!tableNames) {
    const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
    `;
    tableNames = rows.map((row) => `"public"."${row.tablename}"`);
  }

  if (tableNames.length === 0) return;
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableNames.join(", ")} RESTART IDENTITY CASCADE`,
  );
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
