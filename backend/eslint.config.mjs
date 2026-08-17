import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "src/generated/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Plain Node scripts (no TypeScript to resolve identifiers for them).
    files: ["**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly" },
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      // TypeScript already resolves identifiers; no-undef only produces false positives here.
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "no-console": ["warn", { allow: ["warn", "error", "info", "log"] }],
      eqeqeq: ["error", "smart"],
    },
  },
);
