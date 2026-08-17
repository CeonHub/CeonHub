#!/usr/bin/env node
/**
 * Tiny task runner for the CeonHub monorepo.
 *
 * The root package has no dependencies on purpose: everything here is plain Node.
 * `frontend` and `backend` stay fully independent npm projects (see
 * docs/implementation-plan.md, decision D2) and this script just fans commands out
 * to both of them.
 *
 *   node scripts/run.mjs install     install both apps (sequential)
 *   node scripts/run.mjs dev         run both dev servers (parallel, prefixed output)
 *   node scripts/run.mjs start       run both production servers (parallel)
 *   node scripts/run.mjs build       build both apps (sequential, fail fast)
 *   node scripts/run.mjs test        run tests in both apps (sequential, fail fast)
 *   node scripts/run.mjs lint        lint both apps (sequential, fail fast)
 *   node scripts/run.mjs typecheck   typecheck both apps (sequential, fail fast)
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPS = ["backend", "frontend"];

/** Commands that must run one after another, aborting on the first failure. */
const SEQUENTIAL = new Set(["install", "build", "test", "lint", "typecheck"]);
/** Commands that run side by side until interrupted. */
const PARALLEL = new Set(["dev", "start"]);

const task = process.argv[2];

if (!task || (!SEQUENTIAL.has(task) && !PARALLEL.has(task))) {
  const known = [...SEQUENTIAL, ...PARALLEL].sort().join(", ");
  console.error(`Usage: node scripts/run.mjs <${known}>`);
  process.exit(1);
}

/** npm is a shell script on POSIX and a .cmd shim on Windows, so it needs a shell. */
function npm(app, args, { pipe = false } = {}) {
  return spawn(`npm ${args}`, {
    cwd: path.join(ROOT, app),
    shell: true,
    stdio: pipe ? ["ignore", "pipe", "pipe"] : "inherit",
  });
}

function commandFor(app) {
  if (task === "install") return "install";
  return `run ${task} --if-present`;
}

async function runSequential() {
  for (const app of APPS) {
    console.log(`\n[${app}] npm ${commandFor(app)}`);
    const code = await new Promise((resolve) => {
      npm(app, commandFor(app)).on("close", resolve);
    });
    if (code !== 0) {
      console.error(`\n[${app}] failed with exit code ${code}`);
      process.exit(code ?? 1);
    }
  }
}

function runParallel() {
  const children = APPS.map((app) => {
    const child = npm(app, commandFor(app), { pipe: true });
    for (const stream of [child.stdout, child.stderr]) {
      let buffer = "";
      stream.setEncoding("utf8");
      stream.on("data", (chunk) => {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) console.log(`[${app}] ${line}`);
      });
      stream.on("end", () => {
        if (buffer) console.log(`[${app}] ${buffer}`);
      });
    }
    child.on("close", (code) => {
      console.log(`[${app}] exited with code ${code}`);
      stopAll(code ?? 1);
    });
    return child;
  });

  let stopping = false;
  function stopAll(code) {
    if (stopping) return;
    stopping = true;
    for (const child of children) child.kill();
    process.exitCode = code;
  }

  process.on("SIGINT", () => stopAll(0));
  process.on("SIGTERM", () => stopAll(0));
}

if (SEQUENTIAL.has(task)) {
  await runSequential();
} else {
  runParallel();
}
