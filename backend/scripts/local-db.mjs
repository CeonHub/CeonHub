#!/usr/bin/env node
/**
 * A real PostgreSQL server for local development, with nothing to install.
 *
 * `embedded-postgres` ships the actual PostgreSQL binaries for this platform and
 * runs them from backend/.localdb — no admin rights, no Docker, no system service.
 * It is a devDependency: production installs (`npm ci --omit=dev`) never see it,
 * and deployed environments point DATABASE_URL at a managed database instead.
 *
 *   npm run db:local              start it (keeps running; Ctrl+C stops it)
 *   npm run db:local -- --reset   throw the data away and start clean
 *
 * On the first run it creates two databases:
 *   ceonhub        development database (DATABASE_URL in .env)
 *   ceonhub_test   test database        (DATABASE_URL in .env.test)
 */
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(BACKEND_DIR, ".localdb");

const PORT = 5432;
const USER = "ceonhub";
const PASSWORD = "ceonhub";
const DATABASES = ["ceonhub", "ceonhub_test"];

let EmbeddedPostgres;
try {
  ({ default: EmbeddedPostgres } = await import("embedded-postgres"));
} catch {
  console.error(
    "embedded-postgres is not installed.\n\n" +
      "  npm --prefix backend install --save-dev embedded-postgres\n\n" +
      "Or point DATABASE_URL at any other PostgreSQL 14+ instance instead.",
  );
  process.exit(1);
}

const reset = process.argv.includes("--reset");
if (reset && existsSync(DATA_DIR)) {
  console.log("Removing the existing local database…");
  await rm(DATA_DIR, { recursive: true, force: true });
}

const isFirstRun = !existsSync(DATA_DIR);

const postgres = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
});

if (isFirstRun) {
  console.log("Initialising a new PostgreSQL cluster in backend/.localdb …");
  await postgres.initialise();
}

await postgres.start();

if (isFirstRun) {
  for (const name of DATABASES) {
    await postgres.createDatabase(name);
    console.log(`Created database "${name}"`);
  }
}

console.log(
  [
    "",
    `PostgreSQL is running on localhost:${PORT}`,
    `  development  postgresql://${USER}:${PASSWORD}@localhost:${PORT}/ceonhub?schema=public`,
    `  tests        postgresql://${USER}:${PASSWORD}@localhost:${PORT}/ceonhub_test?schema=public`,
    "",
    isFirstRun ? "Next: npm run db:migrate && npm run db:seed" : "",
    "Leave this running. Press Ctrl+C to stop.",
    "",
  ]
    .filter(Boolean)
    .join("\n"),
);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  console.log("\nStopping PostgreSQL…");
  try {
    await postgres.stop();
  } catch (error) {
    console.error("Failed to stop cleanly:", error);
  }
  process.exit(0);
}

process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
