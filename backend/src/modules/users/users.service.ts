import { prisma } from "../../database/prisma";
import { ApiError } from "../../utils/apiError";
import { hashPassword, verifyPassword } from "../../utils/password";
import type { Role, UserStatus } from "../../generated/prisma/enums";

/**
 * The user object returned to the browser. `passwordHash` is never selected, so it
 * cannot leak by accident from any endpoint that reuses this shape.
 */
export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  /** Display name taken from the role-specific profile. */
  name: string;
  /** False for accounts that only sign in with LinkedIn. */
  hasPassword: boolean;
  linkedinConnected: boolean;
  candidate: {
    headline: string | null;
    availability: string;
    profileVisibility: string;
    profileCompletion: number;
  } | null;
  employer: {
    title: string | null;
    company: { id: string; name: string; slug: string } | null;
  } | null;
}

const CANDIDATE_COMPLETION_FIELDS = [
  "headline",
  "bio",
  "location",
  "resumeUrl",
  "portfolioUrl",
] as const;

/**
 * Percentage of a candidate profile that is filled in: the five optional text
 * fields above plus "has at least one skill". Used by the candidate dashboard.
 */
export function candidateProfileCompletion(profile: {
  headline: string | null;
  bio: string | null;
  location: string | null;
  resumeUrl: string | null;
  portfolioUrl: string | null;
  skillCount: number;
}): number {
  const total = CANDIDATE_COMPLETION_FIELDS.length + 1;
  let filled = CANDIDATE_COMPLETION_FIELDS.filter((field) => {
    const value = profile[field];
    return typeof value === "string" && value.trim().length > 0;
  }).length;
  if (profile.skillCount > 0) filled += 1;
  return Math.round((filled / total) * 100);
}

export async function getSessionUser(userId: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      // Mapped to booleans below — neither value is ever returned to a client.
      passwordHash: true,
      linkedinId: true,
      candidateProfile: {
        select: {
          name: true,
          headline: true,
          bio: true,
          location: true,
          resumeUrl: true,
          portfolioUrl: true,
          availability: true,
          profileVisibility: true,
          _count: { select: { skills: true } },
        },
      },
      employerProfile: {
        select: {
          name: true,
          title: true,
          company: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  if (!user) throw ApiError.notFound("User not found");

  const candidate = user.candidateProfile;
  const employer = user.employerProfile;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    name: candidate?.name ?? employer?.name ?? user.email,
    hasPassword: user.passwordHash !== null,
    linkedinConnected: user.linkedinId !== null,
    candidate: candidate
      ? {
          headline: candidate.headline,
          availability: candidate.availability,
          profileVisibility: candidate.profileVisibility,
          profileCompletion: candidateProfileCompletion({
            headline: candidate.headline,
            bio: candidate.bio,
            location: candidate.location,
            resumeUrl: candidate.resumeUrl,
            portfolioUrl: candidate.portfolioUrl,
            skillCount: candidate._count.skills,
          }),
        }
      : null,
    employer: employer ? { title: employer.title, company: employer.company } : null,
  };
}

/** Updates the display name (and, for employers, the job title). */
export async function updateProfile(
  user: { id: string; role: Role },
  input: { name?: string; title?: string | null },
): Promise<SessionUser> {
  if (user.role === "CANDIDATE") {
    if (input.name !== undefined) {
      await prisma.candidateProfile.update({
        where: { userId: user.id },
        data: { name: input.name },
      });
    }
  } else if (user.role === "EMPLOYER") {
    await prisma.employerProfile.update({
      where: { userId: user.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
      },
    });
  } else {
    throw ApiError.forbidden("Admin accounts have no editable profile");
  }

  return getSessionUser(user.id);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw ApiError.notFound("User not found");
  if (!user.passwordHash) {
    throw ApiError.badRequest(
      "This account signs in with LinkedIn, so it has no password to change.",
    );
  }

  const matches = await verifyPassword(currentPassword, user.passwordHash);
  if (!matches) throw ApiError.badRequest("Current password is incorrect");

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
}
