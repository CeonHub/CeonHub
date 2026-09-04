import type { CookieOptions, RequestHandler, Response } from "express";
import { z } from "zod";
import { env, isProduction, linkedin } from "../../config/env";
import { setAuthCookie } from "../../config/cookies";
import { ApiError } from "../../utils/apiError";
import { sendSuccess } from "../../utils/response";
import type { Role } from "../../generated/prisma/enums";
import * as linkedinService from "./linkedin.service";
import { STATE_COOKIE } from "./linkedin.service";

const startSchema = z.object({
  role: z.enum(["CANDIDATE", "EMPLOYER"]).optional(),
  next: z.string().max(200).optional(),
});

const callbackSchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().max(100).optional(),
});

/**
 * SameSite=Lax is enough for the state cookie: the callback arrives as a top-level
 * GET navigation from linkedin.com, which Lax allows, and nothing else needs it.
 */
function stateCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 10 * 60 * 1000,
  };
}

function homePathFor(role: Role): string {
  if (role === "CANDIDATE") return "/candidate/dashboard";
  if (role === "EMPLOYER") return "/employer/dashboard";
  return "/admin";
}

function redirectToFrontend(res: Response, path: string): void {
  res.redirect(`${env.FRONTEND_URL}${path}`);
}

/** Failures come back as a page, not JSON, because the browser is mid-navigation. */
function redirectWithError(res: Response, message: string): void {
  redirectToFrontend(res, `/login?error=${encodeURIComponent(message)}`);
}

/** Public: lets the sign-in pages hide buttons for providers that are not configured. */
export const providers: RequestHandler = (_req, res) => {
  sendSuccess(res, { providers: { linkedin: linkedin.enabled } });
};

export const linkedinStart: RequestHandler = (req, res) => {
  const input = startSchema.parse(req.query);
  const { url, nonce } = linkedinService.buildAuthorizationUrl(input);

  res.cookie(STATE_COOKIE, nonce, stateCookieOptions());
  res.redirect(url);
};

export const linkedinCallback: RequestHandler = async (req, res) => {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const nonce = cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, stateCookieOptions());

  try {
    const query = callbackSchema.parse(req.query);

    // The member declined at LinkedIn's consent screen.
    if (query.error) {
      redirectWithError(res, "LinkedIn sign-in was cancelled.");
      return;
    }
    if (!query.code) {
      redirectWithError(res, "LinkedIn did not return an authorization code.");
      return;
    }

    const state = linkedinService.readState(query.state, nonce);

    const accessToken = await linkedinService.exchangeCodeForAccessToken(query.code);
    const profile = await linkedinService.fetchLinkedInProfile(accessToken);
    const result = await linkedinService.signInWithLinkedIn(profile, state.role);

    if (result.outcome === "role-required") {
      redirectToFrontend(res, "/register?linkedin=choose-role");
      return;
    }

    setAuthCookie(res, result.token);
    redirectToFrontend(res, state.next ?? homePathFor(result.user.role));
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "LinkedIn sign-in failed. Please try again.";
    if (!(error instanceof ApiError)) {
      console.error("[linkedin] callback failed", error);
    }
    redirectWithError(res, message);
  }
};
