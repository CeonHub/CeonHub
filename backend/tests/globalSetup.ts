import { execSync } from "node:child_process";
import { config as loadEnvFile } from "dotenv";

/**
 * Runs once before the suite: brings the test database up to date with the current
 * migrations. Creating the database itself is a one-off manual step documented in
 * README.md ("Testing").
 */
export default function setup(): void {
  const env = loadEnvFile({ path: ".env.test", quiet: true }).parsed ?? {};
  const databaseUrl = env.DATABASE_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "No DATABASE_URL for tests. Create backend/.env.test (see README.md, Testing) " +
        "pointing at a dedicated test database — the suite truncates every table.",
    );
  }

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, ...env, DATABASE_URL: databaseUrl },
  });
}
