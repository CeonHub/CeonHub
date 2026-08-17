import { app } from "./app";
import { env } from "./config/env";
import { disconnectPrisma } from "./database/prisma";

const server = app.listen(env.PORT, () => {
  console.log(`CeonHub API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received, shutting down`);
  server.close(() => {
    void disconnectPrisma().finally(() => process.exit(0));
  });
  // Don't let a hung connection keep the process alive forever.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
