import { prisma } from "../../database/prisma";
import {
  applicationReceivedEmail,
  applicationStatusEmail,
  sendEmail,
} from "../../services/email";
import { ApiError } from "../../utils/apiError";
import { toSkipTake } from "../../utils/pagination";
import { paginated, type PaginatedData } from "../../utils/response";
import type { AuthUser } from "../../types/express";
import type { ApplicationStatus } from "../../generated/prisma/enums";
import type { SkillDto } from "../skills/skills.service";
import { employerStatusValues } from "./applications.schema";
import type {
  CreateApplicationInput,
  ListApplicationsInput,
  UpdateApplicationInput,
} from "./applications.schema";

const APPLICATION_SELECT = {
  id: true,
  status: true,
  coverLetter: true,
  createdAt: true,
  updatedAt: true,
  job: {
    select: {
      id: true,
      title: true,
      status: true,
      private: true,
      companyId: true,
      company: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
  },
  candidate: {
    select: {
      userId: true,
      name: true,
      headline: true,
      location: true,
      country: true,
      availability: true,
      desiredEmployment: true,
      resumeUrl: true,
      skills: { select: { skill: { select: { id: true, name: true, slug: true } } } },
      user: { select: { email: true } },
    },
  },
} as const;

type ApplicationRow = {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  createdAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    status: string;
    private: boolean;
    companyId: string;
    company: { id: string; name: string; slug: string; logoUrl: string | null };
  };
  candidate: {
    userId: string;
    name: string;
    headline: string | null;
    location: string | null;
    country: string | null;
    availability: string;
    desiredEmployment: string | null;
    resumeUrl: string | null;
    skills: Array<{ skill: SkillDto }>;
    user: { email: string };
  };
};

/**
 * Candidates see the job they applied to; employers additionally see who applied.
 * The candidate's email and resume are only included for the employer whose job it
 * is (and for admins) — never for other candidates.
 */
function toApplicationDto(row: ApplicationRow, includeCandidate: boolean) {
  const base = {
    id: row.id,
    status: row.status,
    coverLetter: row.coverLetter,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    job: {
      id: row.job.id,
      title: row.job.title,
      status: row.job.status,
      private: row.job.private,
      company: row.job.company,
    },
  };

  if (!includeCandidate) return base;

  return {
    ...base,
    candidate: {
      userId: row.candidate.userId,
      name: row.candidate.name,
      headline: row.candidate.headline,
      location: row.candidate.location,
      country: row.candidate.country,
      availability: row.candidate.availability,
      desiredEmployment: row.candidate.desiredEmployment,
      resumeUrl: row.candidate.resumeUrl,
      email: row.candidate.user.email,
      skills: row.candidate.skills.map((entry) => entry.skill),
    },
  };
}

export type ApplicationDto = ReturnType<typeof toApplicationDto>;

async function employerCompanyId(userId: string): Promise<string | null> {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId },
    select: { companyId: true },
  });
  return profile?.companyId ?? null;
}

/**
 * Applying is only possible to a published, unexpired job. Private jobs additionally
 * require an invitation, which is what keeps private hiring private.
 */
export async function apply(
  user: AuthUser,
  jobId: string,
  input: CreateApplicationInput,
): Promise<ApplicationDto> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      status: true,
      private: true,
      expiresAt: true,
      creator: { select: { email: true } },
    },
  });

  if (!job) throw ApiError.notFound("Job not found");

  if (job.private) {
    const invitation = await prisma.invitation.findUnique({
      where: { jobId_candidateId: { jobId, candidateId: user.id } },
      select: { id: true },
    });
    if (!invitation) throw ApiError.notFound("Job not found");
  }

  if (job.status !== "PUBLISHED") {
    throw ApiError.badRequest("This job is not accepting applications");
  }
  if (job.expiresAt && job.expiresAt.getTime() <= Date.now()) {
    throw ApiError.badRequest("This job has expired");
  }

  const existing = await prisma.application.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: user.id } },
    select: { id: true },
  });
  if (existing) throw ApiError.conflict("You have already applied to this job");

  const created = await prisma.application.create({
    data: { jobId, candidateId: user.id, coverLetter: input.coverLetter ?? null },
    select: APPLICATION_SELECT,
  });

  const application = created as ApplicationRow;
  sendEmail(
    applicationReceivedEmail(
      job.creator.email,
      job.title,
      application.candidate.name,
      job.id,
    ),
  );

  return toApplicationDto(application, false);
}

export async function listApplications(
  user: AuthUser,
  input: ListApplicationsInput,
): Promise<PaginatedData<ApplicationDto>> {
  const scope = await scopeFor(user);

  const where = {
    ...scope,
    ...(input.status ? { status: input.status } : {}),
    ...(input.jobId ? { jobId: input.jobId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.application.findMany({
      where,
      select: APPLICATION_SELECT,
      orderBy: { createdAt: "desc" },
      ...toSkipTake(input),
    }),
    prisma.application.count({ where }),
  ]);

  const includeCandidate = user.role !== "CANDIDATE";
  return paginated(
    rows.map((row) => toApplicationDto(row as ApplicationRow, includeCandidate)),
    total,
    input.page,
    input.pageSize,
  );
}

/** Restricts every list query to what the caller is allowed to see. */
async function scopeFor(user: AuthUser): Promise<Record<string, unknown>> {
  if (user.role === "CANDIDATE") return { candidateId: user.id };
  if (user.role === "ADMIN") return {};

  const companyId = await employerCompanyId(user.id);
  // An employer without a company has no jobs, and therefore no applications.
  return { job: { companyId: companyId ?? "__none__" } };
}

export async function getApplication(user: AuthUser, id: string): Promise<ApplicationDto> {
  const row = await prisma.application.findUnique({ where: { id }, select: APPLICATION_SELECT });
  if (!row) throw ApiError.notFound("Application not found");

  const application = row as ApplicationRow;

  if (user.role === "CANDIDATE") {
    if (application.candidate.userId !== user.id) throw ApiError.notFound("Application not found");
    return toApplicationDto(application, false);
  }

  if (user.role === "EMPLOYER") {
    const companyId = await employerCompanyId(user.id);
    if (!companyId || application.job.companyId !== companyId) {
      throw ApiError.notFound("Application not found");
    }
  }

  return toApplicationDto(application, true);
}

/**
 * Employers move applications through the hiring stages; candidates may only
 * withdraw their own application.
 */
export async function updateStatus(
  user: AuthUser,
  id: string,
  input: UpdateApplicationInput,
): Promise<ApplicationDto> {
  const row = await prisma.application.findUnique({ where: { id }, select: APPLICATION_SELECT });
  if (!row) throw ApiError.notFound("Application not found");
  const application = row as ApplicationRow;

  if (user.role === "CANDIDATE") {
    if (application.candidate.userId !== user.id) throw ApiError.notFound("Application not found");
    if (input.status !== "WITHDRAWN") {
      throw ApiError.forbidden("You can only withdraw your application");
    }
  } else if (user.role === "EMPLOYER") {
    const companyId = await employerCompanyId(user.id);
    if (!companyId || application.job.companyId !== companyId) {
      throw ApiError.notFound("Application not found");
    }
    if (!employerStatusValues.includes(input.status as (typeof employerStatusValues)[number])) {
      throw ApiError.badRequest("Only the candidate can withdraw an application");
    }
    if (application.status === "WITHDRAWN") {
      throw ApiError.conflict("This application was withdrawn by the candidate");
    }
  }

  const updated = (await prisma.application.update({
    where: { id },
    data: { status: input.status },
    select: APPLICATION_SELECT,
  })) as ApplicationRow;

  // The candidate is told when the employer moves their application; they do not
  // need an email about their own withdrawal.
  if (user.role !== "CANDIDATE") {
    sendEmail(
      applicationStatusEmail(
        updated.candidate.user.email,
        updated.job.title,
        updated.job.company.name,
        input.status,
      ),
    );
  }

  return toApplicationDto(updated, user.role !== "CANDIDATE");
}
