import { env } from "../../config/env";
import { ConsoleEmailService, NoopEmailService } from "./console.email";
import type { EmailMessage, EmailService } from "./email.types";

export type { EmailMessage, EmailService } from "./email.types";
export * from "./templates";

function createEmailService(): EmailService {
  switch (env.EMAIL_DRIVER) {
    case "console":
      return new ConsoleEmailService();
    case "noop":
      return new NoopEmailService();
  }
}

export const email: EmailService = createEmailService();

/**
 * Notifications must never break the request that triggered them: a failed email
 * is logged and forgotten, and the API call still succeeds.
 */
export function sendEmail(message: EmailMessage): void {
  void email.send(message).catch((error: unknown) => {
    console.error(`[email] failed to send "${message.subject}" to ${message.to}`, error);
  });
}
