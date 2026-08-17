import { prisma } from "../../database/prisma";
import { invitationEmail, sendEmail } from "../../services/email";
import { ApiError } from "../../utils/apiError";
import { toSkipTake } from "../../utils/pagination";
import { paginated, type PaginatedData } from "../../utils/response";
import type { AuthUser } from "../../types/express";
import type { InvitationStatus } from "../../generated/prisma/enums";
import type { SkillDto } from "../skills/skills.service";
import type {
  CreateInvitationInput,
  ListInvitationsInput,
  UpdateInvitationInput,
} from "./invitations.schema";

const INVITATION_SELECT = {
  id: true,
  status: true,
  message: true,
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
  employer: {
    select: {
      id: true,
      employerProfile: {
        select: {
          name: true,
          title: true,
          company: { select: { id: true, name: true, slug: true, logoUrl: true } },
        },
      },
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
      skills: { select: { skill: { select: { id: true, name: true, slug: true } } } },
    },
  },
} as const;

interface InvitationRow {
  id: string;
  status: InvitationStatus;
  message: string | null;
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
  employer: {
    id: string;
    employerProfile: {
      name: string;
      title: string | null;
      company: { id: string; name: string; slug: string; logoUrl: string | null } | null;
    } | null;
  };
  candidate: {
    userId: string;
    name: string;
    headline: string | null;
    location: string | null;
    country: string | null;
    availability: string;
    desiredEmployment: string | null;
    skills: Array<{ skill: SkillDto }>;
  };
}

function toInvitationDto(row: InvitationRow) {
  return {
    id: row.id,
    status: row.status,
    message: row.message,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    job: {
      id: row.job.id,
      title: row.job.title,
      status: row.job.status,
      private: row.job.private,
      company: row.job.company,
    },
    employer: {
      id: row.employer.id,
      name: row.employer.employerProfile?.name ?? "A CeonHub employer",
      title: row.employer.employerProfile?.title ?? null,
      company: row.employer.employerProfile?.company ?? null,
    },
    candidate: {
      userId: row.candidate.userId,
      name: row.candidate.name,
      headline: row.candidate.headline,
      location: row.candidate.location,
      country: row.candidate.country,
      availability: row.candidate.availability,
      desiredEmployment: row.candidate.desiredEmployment,
      skills: row.candidate.skills.map((entry) => entry.skill),
    },
  };
}

export type InvitationDto = ReturnType<typeof toInvitationDto>;

async function employerCompanyId(userId: string): Promise<string | null> {
  const profile = await prisma.employerProfile.findUnique({
    where: { userId },
    select: { companyId: true },
  });
  return profile?.companyId ?? null;
}

/**
 * An employer invites a specific candidate to one of their own jobs. This is the
 * only way a candidate can reach a private opportunity.
 */
export async function createInvitation(
  user: AuthUser,
  input: CreateInvitationInput,
): Promise<InvitationDto> {
  const companyId = await employerCompanyId(user.id);
  if (!companyId) throw ApiError.badRequest("Create your company profile before inviting");

  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    select: { id: true, companyId: true, status: true },
  });
  if (!job || job.companyId !== companyId) throw ApiError.notFound("Job not found");
  if (job.status === "CLOSED" || job.status === "HIDDEN") {
    throw ApiError.badRequest("This job is no longer open, so it cannot be offered to candidates");
  }

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: input.candidateId },
    select: { userId: true, name: true, user: { select: { status: true, email: true } } },
  });
  if (!candidate || candidate.user.status !== "ACTIVE") {
    throw ApiError.notFound("Candidate not found");
  }

  const existing = await prisma.invitation.findUnique({
    where: { jobId_candidateId: { jobId: input.jobId, candidateId: input.candidateId } },
    select: { id: true },
  });
  if (existing) throw ApiError.conflict("You have already invited this candidate to this job");

  const created = await prisma.invitation.create({
    data: {
      jobId: input.jobId,
      employerId: user.id,
      candidateId: input.candidateId,
      message: input.message ?? null,
    },
    select: INVITATION_SELECT,
  });

  const invitation = toInvitationDto(created as InvitationRow);
  sendEmail(
    invitationEmail(
      candidate.user.email,
      candidate.name,
      invitation.job.company.name,
      invitation.job.title,
      invitation.message,
    ),
  );

  return invitation;
}

export async function listInvitations(
  user: AuthUser,
  input: ListInvitationsInput,
): Promise<PaginatedData<InvitationDto>> {
  const scope =
    user.role === "CANDIDATE"
      ? { candidateId: user.id }
      : user.role === "ADMIN"
        ? {}
        : { job: { companyId: (await employerCompanyId(user.id)) ?? "__none__" } };

  const where = {
    ...scope,
    ...(input.status ? { status: input.status } : {}),
    ...(input.jobId ? { jobId: input.jobId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      select: INVITATION_SELECT,
      orderBy: { createdAt: "desc" },
      ...toSkipTake(input),
    }),
    prisma.invitation.count({ where }),
  ]);

  return paginated(
    rows.map((row) => toInvitationDto(row as InvitationRow)),
    total,
    input.page,
    input.pageSize,
  );
}

export async function getInvitation(user: AuthUser, id: string): Promise<InvitationDto> {
  const row = await prisma.invitation.findUnique({ where: { id }, select: INVITATION_SELECT });
  if (!row) throw ApiError.notFound("Invitation not found");
  const invitation = row as InvitationRow;

  if (user.role === "CANDIDATE" && invitation.candidate.userId !== user.id) {
    throw ApiError.notFound("Invitation not found");
  }
  if (user.role === "EMPLOYER") {
    const companyId = await employerCompanyId(user.id);
    if (!companyId || invitation.job.companyId !== companyId) {
      throw ApiError.notFound("Invitation not found");
    }
  }

  return toInvitationDto(invitation);
}

/**
 * Only the invited candidate answers an invitation.
 *
 * Accepting also creates an application, so the employer sees the candidate in the
 * job's applicant list instead of having to chase the acceptance separately.
 */
export async function respondToInvitation(
  user: AuthUser,
  id: string,
  input: UpdateInvitationInput,
): Promise<InvitationDto> {
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    select: { id: true, jobId: true, candidateId: true, status: true, job: { select: { status: true } } },
  });
  if (!invitation) throw ApiError.notFound("Invitation not found");

  if (invitation.candidateId !== user.id) {
    throw ApiError.notFound("Invitation not found");
  }
  if (invitation.status !== "PENDING") {
    throw ApiError.conflict("You have already answered this invitation");
  }

  await prisma.$transaction(async (tx) => {
    await tx.invitation.update({ where: { id }, data: { status: input.status } });

    if (input.status === "ACCEPTED" && invitation.job.status === "PUBLISHED") {
      const existing = await tx.application.findUnique({
        where: { jobId_candidateId: { jobId: invitation.jobId, candidateId: user.id } },
        select: { id: true },
      });
      if (!existing) {
        await tx.application.create({
          data: { jobId: invitation.jobId, candidateId: user.id },
        });
      }
    }
  });

  return getInvitation(user, id);
}
