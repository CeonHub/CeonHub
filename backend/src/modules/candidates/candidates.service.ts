import { prisma } from "../../database/prisma";
import { storage } from "../../services/storage";
import { ApiError } from "../../utils/apiError";
import { toSkipTake } from "../../utils/pagination";
import { paginated, type PaginatedData } from "../../utils/response";
import { resolveSkills, type SkillDto } from "../skills/skills.service";
import type { AuthUser } from "../../types/express";
import type { Availability, EmploymentType, ProfileVisibility } from "../../generated/prisma/enums";
import type { ListCandidatesInput, UpdateCandidateInput } from "./candidates.schema";

export interface CandidateSummaryDto {
  userId: string;
  name: string;
  headline: string | null;
  location: string | null;
  country: string | null;
  availability: Availability;
  desiredEmployment: EmploymentType | null;
  skills: SkillDto[];
}

export interface CandidateProfileDto extends CandidateSummaryDto {
  bio: string | null;
  resumeUrl: string | null;
  portfolioUrl: string | null;
  profileVisibility: ProfileVisibility;
  createdAt: Date;
  updatedAt: Date;
  /** Only present when the candidate is viewing their own profile, or for admins. */
  email?: string;
}

const PROFILE_SELECT = {
  userId: true,
  name: true,
  headline: true,
  bio: true,
  location: true,
  country: true,
  availability: true,
  desiredEmployment: true,
  resumeUrl: true,
  portfolioUrl: true,
  profileVisibility: true,
  createdAt: true,
  updatedAt: true,
  skills: { select: { skill: { select: { id: true, name: true, slug: true } } } },
} as const;

type ProfileRow = {
  skills: Array<{ skill: SkillDto }>;
} & Omit<CandidateProfileDto, "skills" | "email">;

function toProfileDto(row: ProfileRow): CandidateProfileDto {
  const { skills, ...rest } = row;
  return { ...rest, skills: skills.map((entry) => entry.skill) };
}

/**
 * Who may see a candidate profile:
 * - the candidate themselves, always;
 * - admins, always;
 * - employers, only when the candidate has set their profile to PUBLIC.
 * Anonymous visitors never see candidate profiles.
 */
export async function getCandidate(
  viewer: AuthUser,
  candidateId: string,
): Promise<CandidateProfileDto> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: candidateId },
    select: { ...PROFILE_SELECT, user: { select: { email: true, status: true } } },
  });

  if (!profile) throw ApiError.notFound("Candidate not found");

  const isSelf = viewer.id === candidateId;
  const isAdmin = viewer.role === "ADMIN";

  if (!isSelf && !isAdmin) {
    if (viewer.role !== "EMPLOYER") throw ApiError.forbidden();
    if (profile.profileVisibility !== "PUBLIC" || profile.user.status !== "ACTIVE") {
      throw ApiError.notFound("Candidate not found");
    }
  }

  const { user, ...rest } = profile;
  const dto = toProfileDto(rest);
  return isSelf || isAdmin ? { ...dto, email: user.email } : dto;
}

export async function getOwnProfile(user: AuthUser): Promise<CandidateProfileDto> {
  return getCandidate(user, user.id);
}

export async function updateCandidate(
  viewer: AuthUser,
  candidateId: string,
  input: UpdateCandidateInput,
): Promise<CandidateProfileDto> {
  if (viewer.id !== candidateId && viewer.role !== "ADMIN") {
    throw ApiError.forbidden("You can only edit your own profile");
  }

  const exists = await prisma.candidateProfile.findUnique({
    where: { userId: candidateId },
    select: { userId: true },
  });
  if (!exists) throw ApiError.notFound("Candidate not found");

  const { skills, ...fields } = input;

  // Skills are global reference data, resolved before the transaction so the
  // transaction only touches this candidate's own rows.
  const resolved = skills ? await resolveSkills(skills) : null;

  await prisma.$transaction(async (tx) => {
    await tx.candidateProfile.update({ where: { userId: candidateId }, data: fields });

    if (resolved) {
      await tx.candidateSkill.deleteMany({ where: { candidateId } });
      if (resolved.length > 0) {
        await tx.candidateSkill.createMany({
          data: resolved.map((skill) => ({ candidateId, skillId: skill.id })),
          skipDuplicates: true,
        });
      }
    }
  });

  return getCandidate(viewer, candidateId);
}

/** Employer-facing candidate directory. Only PUBLIC, active candidates are listed. */
export async function listCandidates(
  viewer: AuthUser,
  input: ListCandidatesInput,
): Promise<PaginatedData<CandidateSummaryDto>> {
  const visibility = viewer.role === "ADMIN" ? {} : { profileVisibility: "PUBLIC" as const };

  const where = {
    ...visibility,
    user: { status: "ACTIVE" as const },
    ...(input.availability ? { availability: input.availability } : {}),
    ...(input.employmentType ? { desiredEmployment: input.employmentType } : {}),
    ...(input.country ? { country: { equals: input.country, mode: "insensitive" as const } } : {}),
    ...(input.skill ? { skills: { some: { skill: { slug: input.skill } } } } : {}),
    ...(input.q
      ? {
          OR: [
            { name: { contains: input.q, mode: "insensitive" as const } },
            { headline: { contains: input.q, mode: "insensitive" as const } },
            { bio: { contains: input.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.candidateProfile.findMany({
      where,
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
      // Available-now candidates first: the marketplace is built around speed.
      orderBy: [{ availability: "asc" }, { updatedAt: "desc" }],
      ...toSkipTake(input),
    }),
    prisma.candidateProfile.count({ where }),
  ]);

  const items = rows.map((row) => ({
    ...row,
    skills: row.skills.map((entry) => entry.skill),
  }));

  return paginated(items, total, input.page, input.pageSize);
}

export interface ResumeDto {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

/** Stores the file through the storage service and points the profile at it. */
export async function addResume(
  user: AuthUser,
  file: { buffer: Buffer; originalname: string; mimetype: string },
): Promise<ResumeDto> {
  const stored = await storage.save({
    buffer: file.buffer,
    fileName: file.originalname,
    mimeType: file.mimetype,
    folder: "resumes",
  });

  const resume = await prisma.$transaction(async (tx) => {
    const created = await tx.resume.create({
      data: {
        candidateId: user.id,
        fileName: stored.fileName,
        storageKey: stored.key,
        url: stored.url,
        mimeType: stored.mimeType,
        size: stored.size,
      },
      select: { id: true, fileName: true, url: true, mimeType: true, size: true, createdAt: true },
    });

    await tx.candidateProfile.update({
      where: { userId: user.id },
      data: { resumeUrl: stored.url },
    });

    return created;
  });

  return resume;
}

export async function listResumes(user: AuthUser): Promise<ResumeDto[]> {
  return prisma.resume.findMany({
    where: { candidateId: user.id },
    select: { id: true, fileName: true, url: true, mimeType: true, size: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}
