import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 keeps the connection URL out of schema.prisma: the CLI reads it from here,
 * and the application passes it to the driver adapter (see src/database/prisma.ts).
 *
 * Prisma 7 no longer loads .env automatically, hence the dotenv import above.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Read straight from process.env rather than Prisma's env() helper: env() throws
    // when the variable is missing, which would break `prisma generate` (and therefore
    // `npm install` and the Docker build) on a machine that has no .env yet. Migration
    // commands still fail loudly, with a connection error, if it is not set.
    url: process.env.DATABASE_URL ?? "",
  },
  migrations: {
    // The seed lives under src/ so it is type-checked and compiled into dist/,
    // which lets a deployed container seed with `npm run db:seed:prod`.
    seed: "tsx src/database/seed.ts",
  },
});
