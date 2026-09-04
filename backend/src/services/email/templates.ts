import { env } from "../../config/env";
import type { EmailMessage } from "./email.types";

/**
 * The four MVP notifications. Plain text, one function per message, so the copy is
 * in one place and easy to change.
 */

const SIGN_OFF = "\n\nThe CeonHub team";

export function welcomeEmail(to: string, name: string, role: "CANDIDATE" | "EMPLOYER"): EmailMessage {
  const next =
    role === "CANDIDATE"
      ? `Complete your profile so employers can find you: ${env.FRONTEND_URL}/candidate/profile`
      : `Create your company profile and post your first job: ${env.FRONTEND_URL}/employer/profile`;

  return {
    to,
    subject: "Welcome to CeonHub",
    text: `Hi ${name},\n\nYour CeonHub account is ready.\n\n${next}${SIGN_OFF}`,
  };
}

export function applicationReceivedEmail(
  to: string,
  jobTitle: string,
  candidateName: string,
  jobId: string,
): EmailMessage {
  return {
    to,
    subject: `New application: ${jobTitle}`,
    text:
      `${candidateName} applied to "${jobTitle}".\n\n` +
      `Review the application: ${env.FRONTEND_URL}/employer/jobs/${jobId}${SIGN_OFF}`,
  };
}

export function applicationStatusEmail(
  to: string,
  jobTitle: string,
  companyName: string,
  status: string,
): EmailMessage {
  return {
    to,
    subject: `Update on your application: ${jobTitle}`,
    text:
      `${companyName} moved your application for "${jobTitle}" to: ${status.toLowerCase()}.\n\n` +
      `See your applications: ${env.FRONTEND_URL}/candidate/applications${SIGN_OFF}`,
  };
}

export function invitationEmail(
  to: string,
  candidateName: string,
  companyName: string,
  jobTitle: string,
  message: string | null,
): EmailMessage {
  return {
    to,
    subject: `${companyName} invited you to a private opportunity`,
    text:
      `Hi ${candidateName},\n\n` +
      `${companyName} invited you to apply for "${jobTitle}".\n\n` +
      (message ? `Their message:\n"${message}"\n\n` : "") +
      `View and answer the invitation: ${env.FRONTEND_URL}/candidate/invitations${SIGN_OFF}`,
  };
}
