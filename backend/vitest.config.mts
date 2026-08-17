import { config as loadEnvFile } from "dotenv";
import { defineConfig } from "vitest/config";

/**
 * Tests run against a real PostgreSQL database configured in .env.test, which must
 * be a different database from development — the suite truncates every table
 * between tests. See README.md ("Testing").
 */
const testEnv = loadEnvFile({ path: ".env.test", quiet: true }).parsed ?? {};

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { ...testEnv, NODE_ENV: "test" },
    globalSetup: ["tests/globalSetup.ts"],
    setupFiles: ["tests/setup.ts"],
    // The suite is a set of integration tests sharing one PostgreSQL database,
    // so files run one at a time instead of racing each other.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
