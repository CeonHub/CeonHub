import type {
  ApplicationStatus,
  Availability,
  EmploymentType,
  InvitationStatus,
  JobStatus,
} from "./types";

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  AVAILABLE_NOW: "Available now",
  AVAILABLE_SOON: "Available soon",
  NOT_AVAILABLE: "Not available",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: "Submitted",
  REVIEWING: "Reviewing",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  PAUSED: "Paused",
  CLOSED: "Closed",
  HIDDEN: "Hidden by admin",
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMAT.format(date);
}

/** "3 days ago" style label, falling back to an absolute date after a month. */
export function formatRelative(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days <= 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return formatDate(date);
}

/** Compensation is free text plus an optional currency code. */
export function formatCompensation(
  compensation: string | null,
  currency: string | null,
): string | null {
  if (!compensation) return null;
  return currency ? `${compensation} ${currency}` : compensation;
}

export function formatLocation(location: string | null, remote: boolean): string {
  if (remote && location) return `Remote · ${location}`;
  if (remote) return "Remote";
  return location ?? "Location not specified";
}
