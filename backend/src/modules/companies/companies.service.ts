import { prisma } from "../../database/prisma";
import { ApiError } from "../../utils/apiError";
import { paginated, type PaginatedData } from "../../utils/response";
import { toSkipTake } from "../../utils/pagination";
import { uniqueSlug } from "../../utils/slug";
import type { AuthUser } from "../../types/express";
import type {
  CreateCompanyInput,
  ListCompaniesInput,
  UpdateCompanyInput,
} from "./companies.schema";

const COMPANY_FIELDS = {
  id: true,
  name: true,
  slug: true,
  description: true,
  website: true,
  logoUrl: true,
  location: true,
  country: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface CompanyDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  location: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
  openJobCount?: number;
}

/**
 * An employer owns exactly one company in the MVP: the one their profile points at.
 * Admins may edit any company.
 */
async function assertCanManage(user: AuthUser, companyId: string): Promise<void> {
  if (user.role === "ADMIN") return;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    select: { companyId: true },
  });

  if (!profile || profile.companyId !== companyId) {
    throw ApiError.forbidden("You can only manage your own company");
  }
}

export async function createCompany(user: AuthUser, input: CreateCompanyInput): Promise<CompanyDto> {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    select: { companyId: true },
  });

  if (!profile) throw ApiError.forbidden("Only employers can create a company");
  if (profile.companyId) {
    throw ApiError.conflict("Your account is already linked to a company");
  }

  const slug = await uniqueSlug(input.name, async (candidate) => {
    const existing = await prisma.company.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return existing !== null;
  });

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { ...input, slug },
      select: COMPANY_FIELDS,
    });
    await tx.employerProfile.update({
      where: { userId: user.id },
      data: { companyId: company.id },
    });
    return company;
  });
}

export async function updateCompany(
  user: AuthUser,
  companyId: string,
  input: UpdateCompanyInput,
): Promise<CompanyDto> {
  await assertCanManage(user, companyId);

  return prisma.company.update({
    where: { id: companyId },
    data: input,
    select: COMPANY_FIELDS,
  });
}

/** Public directory: companies that have at least one published, non-private job. */
export async function listCompanies(input: ListCompaniesInput): Promise<PaginatedData<CompanyDto>> {
  const where = {
    ...(input.q ? { name: { contains: input.q, mode: "insensitive" as const } } : {}),
    ...(input.country ? { country: { equals: input.country, mode: "insensitive" as const } } : {}),
    jobs: { some: { status: "PUBLISHED" as const, private: false } },
  };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      select: {
        ...COMPANY_FIELDS,
        _count: { select: { jobs: { where: { status: "PUBLISHED", private: false } } } },
      },
      orderBy: { name: "asc" },
      ...toSkipTake(input),
    }),
    prisma.company.count({ where }),
  ]);

  const items = companies.map(({ _count, ...company }) => ({
    ...company,
    openJobCount: _count.jobs,
  }));

  return paginated(items, total, input.page, input.pageSize);
}

export async function getCompany(idOrSlug: string): Promise<CompanyDto> {
  const company = await prisma.company.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: {
      ...COMPANY_FIELDS,
      _count: { select: { jobs: { where: { status: "PUBLISHED", private: false } } } },
    },
  });

  if (!company) throw ApiError.notFound("Company not found");

  const { _count, ...rest } = company;
  return { ...rest, openJobCount: _count.jobs };
}

/** The company attached to the signed-in employer, if they have created one. */
export async function getMyCompany(user: AuthUser): Promise<CompanyDto | null> {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    select: { company: { select: COMPANY_FIELDS } },
  });

  return profile?.company ?? null;
}
