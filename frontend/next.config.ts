import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `next dev` otherwise writes AGENTS.md and CLAUDE.md into this directory on every
  // run. They are AI-tooling artefacts, not part of the product.
  agentRules: false,
  // Produces a self-contained server bundle for the Docker image.
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
