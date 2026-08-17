export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain text keeps the MVP free of a templating dependency. */
  text: string;
}

/**
 * Everything the application knows about sending email.
 *
 * Business logic depends on this interface only, so adding a real provider
 * (SMTP, Resend, SES, Postmark, …) means implementing `send` in a new file and
 * adding one branch to the factory. See docs/architecture.md ("Email").
 */
export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}
