import { prisma } from "../../database/prisma";
import { slugify } from "../../utils/slug";

export interface SkillDto {
  id: string;
  name: string;
  slug: string;
}

export const MAX_SKILLS_PER_ENTITY = 20;

/**
 * Maps free-text skill names onto Skill rows, creating the ones that do not exist.
 * Matching is by slug, so "Node.js", "node js" and "NodeJS" are the same skill.
 */
export async function resolveSkills(names: string[]): Promise<SkillDto[]> {
  const bySlug = new Map<string, string>();
  for (const name of names) {
    const trimmed = name.trim();
    const slug = slugify(trimmed);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, trimmed);
    if (bySlug.size >= MAX_SKILLS_PER_ENTITY) break;
  }

  if (bySlug.size === 0) return [];

  await prisma.skill.createMany({
    data: [...bySlug].map(([slug, name]) => ({ slug, name })),
    skipDuplicates: true,
  });

  return prisma.skill.findMany({
    where: { slug: { in: [...bySlug.keys()] } },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

/** Type-ahead for the skill pickers. */
export async function searchSkills(query: string | undefined, limit = 20): Promise<SkillDto[]> {
  return prisma.skill.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
    take: limit,
  });
}
