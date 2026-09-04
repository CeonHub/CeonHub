import { prisma } from "../../database/prisma";
import { ApiError } from "../../utils/apiError";
import { recordAudit } from "../../utils/audit";
import { toSkipTake } from "../../utils/pagination";
import { paginated, type PaginatedData } from "../../utils/response";
import { resolveSkills, type SkillDto } from "../skills/skills.service";
import type { AuthUser } from "../../types/express";
import type {
  ApplicationStatus,
  EmploymentType,
  JobStatus,
} from "../../generated/prisma/enums";
import type {
  CreateJobInput,
  ListJobsInput,
  ListMyJobsInput,
  UpdateJobInput,
} from "./jobs.schema";

const JOB_SELECT = {
  id: true,
  title: true,
  description: true,
  location: true,
  remote: true,
  employmentType: true,
  category: true,
  compensation: true,
  currency: true,
  immediateHire: true,
  private: true,
  internship: true,
  freelance: true,
  sideIncome: true,
  status: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  expiresAt: true,
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      location: true,
      country: true,
    },
  },
  skills: { select: { skill: { select: { id: true, name: true, slug: true } } } },
  _count: { select: { applications: true } },
} as const;

export interface JobDto {
  id: string;
  title: string;
  description: string;
  location: string | null;
  remote: boolean;
  employmentType: EmploymentType;
  category: string;
  compensation: string | null;
  currency: string | null;
  immediateHire: boolean;
  private: boolean;
  internship: boolean;
  freelance: boolean;
  sideIncome: boolean;
  status: JobStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  expiresAt: Date | null;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    location: string | null;
    country: string | null;
  };
  skills: SkillDto[];
  applicationCount: number;
  myApplication?: { id: string; status: ApplicationStatus; createdAt: Date } | null;
}

type JobRow = Omit<JobDto, "skills" | "applicationCount" | "myApplication"> & {
  skills: Array<{ skill: SkillDto }>;
  _count: { applications: number };
};

function toJobDto(row: JobRow): JobDto {
  const { skills, _count, ...rest } = row;
  return { ...rest, skills: skills.map((entry) => entry.skill), applicationCount: _count.applications };
}

/**
 * The rule that makes private hiring work: a job is only in the public index when it
 * is published, not private, and not expired.
 */
function publicJobFilter() {
  return {
    status: "PUBLISHED" as const,
    private: false,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

async function employerCompanyId(userId: string): Promise<string> {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId },
    select: { companyId: true },
  });

  if (!profile?.companyId) {
    throw ApiError.badRequest("Create your company profile before posting jobs");
  }
  return profile.companyId;
}

/**
 * The company a new job is filed under. An employer always posts under their own,
 * whatever the request body says. An admin has no employer profile, so they name
 * the company instead — that is how CeonHub's own roles get posted.
 */
async function companyIdForNewJob(user: AuthUser, requested: string | undefined): Promise<string> {
  if (user.role !== "ADMIN") return employerCompanyId(user.id);

  if (!requested) throw ApiError.badRequest("Choose the company this job is posted under");

  const company = await prisma.company.findUnique({
    where: { id: requested },
    select: { id: true },
  });
  if (!company) throw ApiError.notFound("Company not found");

  return company.id;
}

/** Employers manage the jobs of their own company; admins manage everything. */
async function assertCanManageJob(
  user: AuthUser,
  jobId: string,
): Promise<{ status: JobStatus; publishedAt: Date | null }> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { companyId: true, status: true, publishedAt: true },
  });
  if (!job) throw ApiError.notFound("Job not found");

  if (user.role === "ADMIN") return { status: job.status, publishedAt: job.publishedAt };

  const companyId = await employerCompanyId(user.id);
  if (job.companyId !== companyId) {
    throw ApiError.forbidden("This job belongs to another company");
  }
  if (job.status === "HIDDEN") {
    throw ApiError.forbidden("This job was hidden by an administrator and cannot be edited");
  }

  return { status: job.status, publishedAt: job.publishedAt };
}

export async function listPublicJobs(input: ListJobsInput): Promise<PaginatedData<JobDto>> {
  const where = {
    ...publicJobFilter(),
    ...(input.location
      ? { location: { contains: input.location, mode: "insensitive" as const } }
      : {}),
    ...(input.remote === undefined ? {} : { remote: input.remote }),
    ...(input.employmentType ? { employmentType: input.employmentType } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.immediateHire ? { immediateHire: true } : {}),
    ...(input.freelance ? { freelance: true } : {}),
    ...(input.internship ? { internship: true } : {}),
    ...(input.sideIncome ? { sideIncome: true } : {}),
    ...(input.companyId ? { companyId: input.companyId } : {}),
    ...(input.skill ? { skills: { some: { skill: { slug: input.skill } } } } : {}),
    ...(input.q
      ? {
          AND: [
            {
              OR: [
                { title: { contains: input.q, mode: "insensitive" as const } },
                { description: { contains: input.q, mode: "insensitive" as const } },
                { company: { name: { contains: input.q, mode: "insensitive" as const } } },
              ],
            },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.job.findMany({
      where,
      select: JOB_SELECT,
      orderBy: [{ immediateHire: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      ...toSkipTake(input),
    }),
    prisma.job.count({ where }),
  ]);

  return paginated(rows.map(toJobDto), total, input.page, input.pageSize);
}

/**
 * Job detail with per-viewer visibility:
 * - published public jobs: everyone;
 * - the owning employer and admins: always;
 * - candidates: also when they were invited to the job or already applied to it.
 */
export async function getJob(viewer: AuthUser | null, jobId: string): Promise<JobDto> {
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: JOB_SELECT });
  if (!job) throw ApiError.notFound("Job not found");

  const dto = toJobDto(job as JobRow);
  const isPubliclyVisible =
    dto.status === "PUBLISHED" &&
    !dto.private &&
    (dto.expiresAt === null || dto.expiresAt.getTime() > Date.now());

  if (!viewer) {
    if (!isPubliclyVisible) throw ApiError.notFound("Job not found");
    return dto;
  }

  if (viewer.role === "ADMIN") return dto;

  if (viewer.role === "EMPLOYER") {
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: viewer.id },
      select: { companyId: true },
    });
    if (profile?.companyId === dto.company.id) return dto;
    if (!isPubliclyVisible) throw ApiError.notFound("Job not found");
    return dto;
  }

  // Candidate.
  const [application, invitation] = await Promise.all([
    prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId: viewer.id } },
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.invitation.findUnique({
      where: { jobId_candidateId: { jobId, candidateId: viewer.id } },
      select: { id: true },
    }),
  ]);

  if (!isPubliclyVisible && !application && !invitation) {
    throw ApiError.notFound("Job not found");
  }

  return { ...dto, myApplication: application };
}

export async function createJob(user: AuthUser, input: CreateJobInput): Promise<JobDto> {
  const { skills, status, expiresAt, companyId: requestedCompanyId, ...fields } = input;
  const companyId = await companyIdForNewJob(user, requestedCompanyId);
  // Resolved before the transaction: Skill rows are shared reference data.
  const resolved = skills?.length ? await resolveSkills(skills) : null;

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.job.create({
      data: {
        ...fields,
        status,
        companyId,
        createdBy: user.id,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: { id: true },
    });

    if (resolved) {
      await tx.jobSkill.createMany({
        data: resolved.map((skill) => ({ jobId: created.id, skillId: skill.id })),
        skipDuplicates: true,
      });
    }

    return created;
  });

  // Staff posting on a company's behalf is a privileged action, so it is logged
  // the same way the other admin actions are. Employers posting their own jobs
  // are ordinary product use and are not.
  if (user.role === "ADMIN") {
    await recordAudit({
      actorId: user.id,
      action: "job.created",
      entityType: "JOB",
      entityId: job.id,
      metadata: { companyId, status },
    });
  }

  return getJob(user, job.id);
}

export async function updateJob(
  user: AuthUser,
  jobId: string,
  input: UpdateJobInput,
): Promise<JobDto> {
  const existing = await assertCanManageJob(user, jobId);
  const { skills, status, expiresAt, ...fields } = input;
  const resolved = skills ? await resolveSkills(skills) : null;

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: jobId },
      data: {
        ...fields,
        ...(status ? { status } : {}),
        // publishedAt records when the job first went live, so pausing and
        // republishing keeps the original date (and the original search ranking).
        ...(status === "PUBLISHED" && existing.publishedAt === null
          ? { publishedAt: new Date() }
          : {}),
        ...(expiresAt === undefined ? {} : { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });

    if (resolved) {
      await tx.jobSkill.deleteMany({ where: { jobId } });
      if (resolved.length > 0) {
        await tx.jobSkill.createMany({
          data: resolved.map((skill) => ({ jobId, skillId: skill.id })),
          skipDuplicates: true,
        });
      }
    }
  });

  if (user.role === "ADMIN") {
    await recordAudit({
      actorId: user.id,
      action: "job.updated",
      entityType: "JOB",
      entityId: jobId,
      // The fields, not their values: a description runs to 20k characters and the
      // log is for answering "who touched this", not for storing a second copy.
      metadata: {
        fields: Object.entries(input)
          .filter(([, value]) => value !== undefined)
          .map(([field]) => field),
        ...(status ? { status } : {}),
      },
    });
  }

  return getJob(user, jobId);
}

/**
 * Jobs with applications are never deleted: candidates would lose their history.
 * Closing is the intended way to take a job off the market.
 */
export async function deleteJob(user: AuthUser, jobId: string): Promise<void> {
  await assertCanManageJob(user, jobId);

  const applications = await prisma.application.count({ where: { jobId } });
  if (applications > 0) {
    throw ApiError.conflict(
      "This job has applications and cannot be deleted. Close it instead to stop receiving new ones.",
    );
  }

  const job = await prisma.job.delete({
    where: { id: jobId },
    select: { title: true, companyId: true },
  });

  if (user.role === "ADMIN") {
    await recordAudit({
      actorId: user.id,
      action: "job.deleted",
      entityType: "JOB",
      entityId: jobId,
      metadata: { title: job.title, companyId: job.companyId },
    });
  }
}

/** Every job belonging to the employer's company, in any status. */
export async function listEmployerJobs(
  user: AuthUser,
  input: ListMyJobsInput,
): Promise<PaginatedData<JobDto>> {
  const companyId = await employerCompanyId(user.id);

  const where = {
    companyId,
    ...(input.status ? { status: input.status } : {}),
    ...(input.q ? { title: { contains: input.q, mode: "insensitive" as const } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.job.findMany({
      where,
      select: JOB_SELECT,
      orderBy: [{ updatedAt: "desc" }],
      ...toSkipTake(input),
    }),
    prisma.job.count({ where }),
  ]);

  return paginated(rows.map(toJobDto), total, input.page, input.pageSize);
}
