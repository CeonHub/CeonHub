/**
 * Types for static image imports (`import logo from "./logo.png"`).
 *
 * Next ships these in `next/image-types/global`, but the only thing referencing
 * them is the generated `next-env.d.ts` — which is gitignored, so it does not
 * exist in a fresh clone. CI runs `tsc --noEmit` straight after `npm ci`,
 * without a `next build` to regenerate it, and every image import fails to
 * resolve. Referencing it from a tracked file keeps typecheck standing on its
 * own instead of on a build artefact that may or may not be there.
 */
/// <reference types="next/image-types/global" />
