/** URL-safe identifier built from a display name. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    // NFKD splits "é" into "e" + a combining mark; drop the marks.
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Finds a slug that is not taken yet by appending -2, -3, … The caller supplies the
 * lookup so this stays free of database concerns.
 */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "item";
  if (!(await exists(root))) return root;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }

  throw new Error(`Could not generate a unique slug for "${base}"`);
}
