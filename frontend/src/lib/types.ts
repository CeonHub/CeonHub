/**
 * Shapes returned by the CeonHub API.
 *
 * These are maintained by hand to keep the build simple (no codegen step). They
 * mirror backend/src/modules/**\/*.service.ts. Update both sides together.
 */

export type Role = "CANDIDATE" | "EMPLOYER" | "ADMIN";
export type UserStatus = "ACTIVE" | "DISABLED";
export type Availability = "AVAILABLE_NOW" | "AVAILABLE_SOON" | "NOT_AVAILABLE";
export type ProfileVisibility = "PUBLIC" | "PRIVATE";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "FREELANCE"
  | "INTERNSHIP"
  | "TEMPORARY";

export type JobStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "HIDDEN";

export type ApplicationStatus =
  | "SUBMITTED"
  | "REVIEWING"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  location?: string | null;
  country?: string | null;
}

export interface Company extends CompanySummary {
  description: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
  openJobCount?: number;
}

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  name: string;
  /** False for accounts that only sign in with LinkedIn. */
  hasPassword: boolean;
  linkedinConnected: boolean;
  candidate: {
    headline: string | null;
    availability: Availability;
    profileVisibility: ProfileVisibility;
    profileCompletion: number;
  } | null;
  employer: {
    title: string | null;
    company: { id: string; name: string; slug: string } | null;
  } | null;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
}

/** Social sign-in providers this deployment has configured. */
export interface AuthProviders {
  linkedin: boolean;
}

export interface CandidateProfile {
  userId: string;
  name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  availability: Availability;
  desiredEmployment: EmploymentType | null;
  resumeUrl: string | null;
  portfolioUrl: string | null;
  profileVisibility: ProfileVisibility;
  skills: Skill[];
  createdAt: string;
  updatedAt: string;
}

export interface CandidateSummary {
  userId: string;
  name: string;
  headline: string | null;
  location: string | null;
  country: string | null;
  availability: Availability;
  desiredEmployment: EmploymentType | null;
  skills: Skill[];
}

export interface JobSummary {
  id: string;
  title: string;
  location: string | null;
  remote: boolean;
  employmentType: EmploymentType;
  category: string;
  compensation: string | null;
  currency: string | null;
  immediateHire: boolean;
  internship: boolean;
  freelance: boolean;
  sideIncome: boolean;
  private: boolean;
  status: JobStatus;
  createdAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
  company: CompanySummary;
  skills: Skill[];
  applicationCount?: number;
}

export interface Job extends JobSummary {
  description: string;
  createdBy: string;
  updatedAt: string;
  /** Present for candidates: their own application to this job, if any. */
  myApplication?: { id: string; status: ApplicationStatus; createdAt: string } | null;
}

export interface ApplicationJobRef {
  id: string;
  title: string;
  status: JobStatus;
  private: boolean;
  company: CompanySummary;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
  job: ApplicationJobRef;
  candidate?: CandidateSummary & { email?: string; resumeUrl?: string | null };
}

export interface Invitation {
  id: string;
  status: InvitationStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  job: ApplicationJobRef;
  candidate?: CandidateSummary;
  employer?: { id: string; name: string; title: string | null; company: CompanySummary | null };
}

export interface AdminUserRow {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  name: string;
}

/**
 * GET /api/admin/companies. Unlike the public directory this includes companies
 * with no published job, which is exactly the case staff need when posting the
 * first one.
 */
export interface AdminCompanyRow {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  country: string | null;
  createdAt: string;
  jobCount: number;
  publishedJobCount: number;
}

export interface AdminStats {
  users: { total: number; candidates: number; employers: number; disabled: number };
  jobs: { total: number; published: number; draft: number; hidden: number; private: number };
  applications: { total: number; last7Days: number };
  invitations: { total: number; pending: number };
}
