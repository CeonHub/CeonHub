import next from "eslint-config-next/core-web-vitals";

/**
 * eslint-config-next ships a flat config that already wires up the TypeScript
 * parser, React and the Next.js rules, so nothing else needs to be registered.
 */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "public/**"],
  },
  ...next,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      eqeqeq: ["error", "smart"],
    },
  },
];

export default config;
