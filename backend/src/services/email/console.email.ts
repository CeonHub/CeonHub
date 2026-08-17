import { env } from "../../config/env";
import type { EmailMessage, EmailService } from "./email.types";

/**
 * Development driver: prints the message to the server log instead of sending it.
 * Nothing leaves the machine, which is what you want while building.
 */
export class ConsoleEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    console.info(
      [
        "",
        "──────────── email (console driver) ────────────",
        `From:    ${env.EMAIL_FROM}`,
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        "",
        message.text,
        "────────────────────────────────────────────────",
      ].join("\n"),
    );
  }
}

/** Sends nothing at all. Used by the test suite. */
export class NoopEmailService implements EmailService {
  async send(): Promise<void> {
    // Intentionally empty.
  }
}
