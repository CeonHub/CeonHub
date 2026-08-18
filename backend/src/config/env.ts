import "dotenv/config";
import { z } from "zod";

/**
 * Every environment variable the backend reads is declared here and nowhere else.
 * The process refuses to start with an invalid configuration rather than failing
 * later at an unpredictable point. See backend/.env.example for documentation.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN_DAYS: z.coerce.number().int().positive().max(90).default(7),

  FRONTEND_URL: z.url().default("http://localhost:3000"),
  /** Comma-separated list of allowed browser origins. */
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  /** Absolute base URL of this API, used to build public file URLs. */
  API_URL: z.url().default("http://localhost:4000"),

  COOKIE_NAME: z.string().min(1).default("ceonhub_token"),
  /** Leave empty unless the API and the site share a parent domain. */
  COOKIE_DOMAIN: z.string().optional(),
  /** "none" is required when the API and the frontend are on different sites. */
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).optional(),

  /**
   * Sign in with LinkedIn (OpenID Connect). Optional: when the client id or secret
   * is missing the feature switches itself off and the buttons disappear from the
   * sign-in pages, rather than failing at the moment someone clicks them.
   */
  LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
  LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),
  /** Must match a Redirect URL registered in the LinkedIn developer app, exactly. */
  LINKEDIN_CALLBACK_URL: z.url().optional(),

  STORAGE_DRIVER: z.enum(["local", "cloudinary"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("storage"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(25).default(5),

  /**
   * Cloudinary, used when STORAGE_DRIVER=cloudinary. Either set CLOUDINARY_URL
   * (the "API environment variable" the Cloudinary dashboard hands you) or the
   * three fields separately — see the refinement below, which refuses to start
   * with a cloudinary driver and no credentials.
   */
  CLOUDINARY_URL: z.string().min(1).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  /** Top-level folder, so one Cloudinary account can host several environments. */
  CLOUDINARY_FOLDER: z.string().default("ceonhub"),

  EMAIL_DRIVER: z.enum(["console", "noop"]).default("console"),
  EMAIL_FROM: z.string().default("CeonHub <no-reply@ceonhub.local>"),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}\n\nSee backend/.env.example.`);
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/** Origins allowed to call the API with credentials. */
export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * LinkedIn configuration, resolved once. `enabled` is the single switch the rest of
 * the app checks — no other file reads the LinkedIn variables directly.
 */
export const linkedin = {
  enabled: Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET),
  clientId: env.LINKEDIN_CLIENT_ID ?? "",
  clientSecret: env.LINKEDIN_CLIENT_SECRET ?? "",
  callbackUrl: env.LINKEDIN_CALLBACK_URL ?? `${env.API_URL}/api/auth/linkedin/callback`,
} as const;

/**
 * Cloudinary credentials, accepted in either of the two forms the dashboard offers:
 * the single CLOUDINARY_URL ("cloudinary://key:secret@cloud-name") or the three
 * fields spelled out. Resolved once, here, so no other file parses them.
 *
 * Missing credentials are only fatal when the driver is actually cloudinary — a
 * local development setup should not need a Cloudinary account to boot.
 */
function loadCloudinary() {
  let cloudName = env.CLOUDINARY_CLOUD_NAME ?? "";
  let apiKey = env.CLOUDINARY_API_KEY ?? "";
  let apiSecret = env.CLOUDINARY_API_SECRET ?? "";

  if (env.CLOUDINARY_URL) {
    try {
      const url = new URL(env.CLOUDINARY_URL);
      if (url.protocol !== "cloudinary:") throw new Error("expected the cloudinary:// scheme");
      // The explicit fields win, so a deployment can override one part of the URL.
      cloudName ||= decodeURIComponent(url.hostname);
      apiKey ||= decodeURIComponent(url.username);
      apiSecret ||= decodeURIComponent(url.password);
    } catch (error) {
      throw new Error(
        `Invalid CLOUDINARY_URL: ${(error as Error).message}. ` +
          "Expected cloudinary://<api_key>:<api_secret>@<cloud_name>.",
      );
    }
  }

  if (env.STORAGE_DRIVER === "cloudinary" && !(cloudName && apiKey && apiSecret)) {
    throw new Error(
      "Invalid environment configuration:\n" +
        "  - STORAGE_DRIVER=cloudinary requires CLOUDINARY_URL, or all of " +
        "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.\n\n" +
        "See backend/.env.example.",
    );
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: env.CLOUDINARY_FOLDER.replace(/^\/+|\/+$/g, ""),
  } as const;
}

export const cloudinaryConfig = loadCloudinary();
