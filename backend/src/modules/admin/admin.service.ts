import { prisma } from "../../database/prisma";
import { ApiError } from "../../utils/apiError";
import { recordAudit } from "../../utils/audit";
import { toSkipTake } from "../../utils/pagination";
import { paginated, type PaginatedData } from "../../utils/response";
import type { AuthUser } from "../../types/express";
import type { JobStatus, Role, UserStatus } from "../../generated/prisma/enums";
import type { ListAdminJobsInput, ListUsersInput } from "./admin.schema";

export interface AdminUserDto {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  name: string;
  companyName: string | null;
}

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  candidateProfile: { select: { name: true } },
  employerProfile: { select: { name: true, company: { select: { name: true } } } },
} as const;

interface AdminUserRow {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  candidateProfile: { name: string } | null;
  employerProfile: { name: string; company: { name: string } | null } | null;
}

function toAdminUserDto(row: AdminUserRow): AdminUserDto {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
    name: row.candidateProfile?.name ?? row.employerProfile?.name ?? "—",
    companyName: row.employerProfile?.company?.name ?? null,
  };
}

export async function listUsers(input: ListUsersInput): Promise<PaginatedData<AdminUserDto>> {
  const where = {
    ...(input.role ? { role: input.role } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.q
      ? {
          OR: [
            { email: { contains: input.q, mode: "insensitive" as const } },
            { candidateProfile: { name: { contains: input.q, mode: "insensitive" as const } } },
            { employerProfile: { name: { contains: input.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: ADMIN_USER_SELECT,
      orderBy: { createdAt: "desc" },
      ...toSkipTake(input),
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(rows.map(toAdminUserDto), total, input.page, input.pageSize);
}

/** Disabling an account ends its access on the next request (see middleware/auth). */
export async function setUserStatus(
  admin: AuthUser,
  userId: string,
  status: UserStatus,
): Promise<AdminUserDto> {
  if (userId === admin.id) {
    throw ApiError.badRequest("You cannot change the status of your own account");
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) throw ApiError.notFound("User not found");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: ADMIN_USER_SELECT,
  });

  await recordAudit({
    actorId: admin.id,
    action: "user.status.changed",
    entityType: "USER",
    entityId: userId,
    metadata: { from: user.status, to: status },
  });

  return toAdminUserDto(updated);
}

export interface AdminJobDto {
  id: string;
  title: string;
  status: JobStatus;
  private: boolean;
  createdAt: Date;
  company: { id: string; name: string; slug: string };
  applicationCount: number;
}

export async function listJobs(input: ListAdminJobsInput): Promise<PaginatedData<AdminJobDto>> {
  const where = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.q
      ? {
          OR: [
            { title: { contains: input.q, mode: "insensitive" as const } },
            { company: { name: { contains: input.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.job.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        private: true,
        createdAt: true,
        company: { select: { id: true, name: true, slug: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      ...toSkipTake(input),
    }),
    prisma.job.count({ where }),
  ]);

  const items = rows.map(({ _count, ...job }) => ({ ...job, applicationCount: _count.applications }));
  return paginated(items, total, input.page, input.pageSize);
}

export async function setJobStatus(
  admin: AuthUser,
  jobId: string,
  status: JobStatus,
): Promise<AdminJobDto> {
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } });
  if (!job) throw ApiError.notFound("Job not found");

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { status },
    select: {
      id: true,
      title: true,
      status: true,
      private: true,
      createdAt: true,
      company: { select: { id: true, name: true, slug: true } },
      _count: { select: { applications: true } },
    },
  });

  await recordAudit({
    actorId: admin.id,
    action: "job.status.changed",
    entityType: "JOB",
    entityId: jobId,
    metadata: { from: job.status, to: status },
  });

  const { _count, ...rest } = updated;
  return { ...rest, applicationCount: _count.applications };
}

export interface PlatformStats {
  users: { total: number; candidates: number; employers: number; disabled: number };
  jobs: { total: number; published: number; draft: number; hidden: number; private: number };
  applications: { total: number; last7Days: number };
  invitations: { total: number; pending: number };
}

export async function getStats(): Promise<PlatformStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    users,
    candidates,
    employers,
    disabled,
    jobs,
    published,
    draft,
    hidden,
    privateJobs,
    applications,
    recentApplications,
    invitations,
    pendingInvitations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CANDIDATE" } }),
    prisma.user.count({ where: { role: "EMPLOYER" } }),
    prisma.user.count({ where: { status: "DISABLED" } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.job.count({ where: { status: "DRAFT" } }),
    prisma.job.count({ where: { status: "HIDDEN" } }),
    prisma.job.count({ where: { private: true } }),
    prisma.application.count(),
    prisma.application.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.invitation.count(),
    prisma.invitation.count({ where: { status: "PENDING" } }),
  ]);

  return {
    users: { total: users, candidates, employers, disabled },
    jobs: { total: jobs, published, draft, hidden, private: privateJobs },
    applications: { total: applications, last7Days: recentApplications },
    invitations: { total: invitations, pending: pendingInvitations },
  };
}
