import { randomBytes } from "node:crypto";
import { linkedin } from "../../config/env";
import { prisma } from "../../database/prisma";
import { sendEmail, welcomeEmail } from "../../services/email";
import { ApiError } from "../../utils/apiError";
import { signShortLivedToken, signToken, verifyShortLivedToken } from "../../utils/token";
import { getSessionUser, type SessionUser } from "../users/users.service";

/**
 * "Sign In with LinkedIn using OpenID Connect".
 *
 * Endpoints come from LinkedIn's discovery document:
 * https://www.linkedin.com/oauth/.well-known/openid-configuration
 */
const AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const SCOPES = ["openid", "profile", "email"] as const;

/** The authorization code is short-lived; so is the state that guards it. */
const STATE_TTL_SECONDS = 10 * 60;
export const STATE_COOKIE = "ceonhub_oauth_state";

export type SignupRole = "CANDIDATE" | "EMPLOYER";

interface StatePayload {
  /** Matched against the value stored in the state cookie. */
  nonce: string;
  /** Chosen on the sign-up page; absent when starting from the sign-in page. */
  role?: SignupRole;
  /** Relative path to return to after signing in. */
  next?: string;
}

export interface LinkedInProfile {
  /** OpenID Connect subject identifier — stable per member, per application. */
  sub: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  emailVerified?: boolean;
}

export function assertLinkedInEnabled(): void {
  if (!linkedin.enabled) {
    throw new ApiError(
      503,
      "BAD_REQUEST",
      "Sign in with LinkedIn is not configured on this server",
    );
  }
}

/** Only same-site paths may be used as a post-login destination. */
export function safeNextPath(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value.slice(0, 200);
}

/**
 * Builds the URL the browser is sent to, plus the nonce to store in a cookie.
 *
 * Role and return path travel inside `state` rather than on the callback URL:
 * LinkedIn ignores query parameters on registered redirect URLs.
 */
export function buildAuthorizationUrl(input: { role?: SignupRole; next?: string }): {
  url: string;
  nonce: string;
} {
  assertLinkedInEnabled();

  const nonce = randomBytes(24).toString("base64url");
  const state = signShortLivedToken(
    { nonce, role: input.role, next: safeNextPath(input.next) } satisfies StatePayload,
    STATE_TTL_SECONDS,
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: linkedin.clientId,
    redirect_uri: linkedin.callbackUrl,
    scope: SCOPES.join(" "),
    state,
  });

  return { url: `${AUTHORIZATION_URL}?${params.toString()}`, nonce };
}

/** Verifies the signature and that the state came from the browser we started with. */
export function readState(state: string | undefined, cookieNonce: string | undefined): StatePayload {
  if (!state || !cookieNonce) {
    throw ApiError.badRequest("Your sign-in session expired. Please try again.");
  }

  const payload = verifyShortLivedToken<StatePayload>(state);
  if (!payload || payload.nonce !== cookieNonce) {
    throw ApiError.badRequest("Your sign-in session could not be verified. Please try again.");
  }

  return payload;
}

interface TokenResponse {
  access_token?: string;
}

/** Exchanges the authorization code for an access token (RFC 6749 §4.1.3). */
export async function exchangeCodeForAccessToken(code: string): Promise<string> {
  assertLinkedInEnabled();

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: linkedin.clientId,
      client_secret: linkedin.clientSecret,
      redirect_uri: linkedin.callbackUrl,
    }),
  });

  const payload = (await response.json().catch(() => null)) as TokenResponse | null;

  if (!response.ok || !payload?.access_token) {
    // The body can contain the client secret context; log it, never return it.
    console.error("[linkedin] token exchange failed", response.status, payload);
    throw ApiError.badRequest("LinkedIn rejected the sign-in attempt. Please try again.");
  }

  return payload.access_token;
}

interface UserInfoResponse {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
}

/** Reads the member's profile. `email` is documented as optional — handle its absence. */
export async function fetchLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const payload = (await response.json().catch(() => null)) as UserInfoResponse | null;

  if (!response.ok || !payload?.sub) {
    console.error("[linkedin] userinfo failed", response.status, payload);
    throw ApiError.badRequest("Could not read your LinkedIn profile. Please try again.");
  }

  return {
    sub: payload.sub,
    name: payload.name,
    givenName: payload.given_name,
    familyName: payload.family_name,
    email: payload.email?.trim().toLowerCase(),
    emailVerified: payload.email_verified,
  };
}

export type LinkedInSignInResult =
  | { outcome: "signed-in"; token: string; user: SessionUser; created: boolean }
  /** A new member arrived without choosing candidate or employer first. */
  | { outcome: "role-required" };

function displayName(profile: LinkedInProfile): string {
  const fromParts = [profile.givenName, profile.familyName].filter(Boolean).join(" ").trim();
  const name = (profile.name ?? fromParts).trim();
  if (name.length >= 2) return name.slice(0, 80);
  return profile.email?.split("@")[0]?.slice(0, 80) ?? "CeonHub member";
}

/**
 * Turns a LinkedIn profile into a CeonHub session.
 *
 * Matching order:
 *  1. an account already linked to this LinkedIn member;
 *  2. an existing account with the same address, but only if LinkedIn says the
 *     address is verified — otherwise anyone able to set an unverified address on
 *     LinkedIn could take over a CeonHub account;
 *  3. a new account, which needs to know whether it is a candidate or an employer.
 */
export async function signInWithLinkedIn(
  profile: LinkedInProfile,
  role: SignupRole | undefined,
): Promise<LinkedInSignInResult> {
  const linked = await prisma.user.findUnique({
    where: { linkedinId: profile.sub },
    select: { id: true, role: true, status: true },
  });

  if (linked) {
    if (linked.status === "DISABLED") {
      throw ApiError.forbidden("This account has been disabled. Contact support.");
    }
    return {
      outcome: "signed-in",
      token: signToken({ sub: linked.id, role: linked.role }),
      user: await getSessionUser(linked.id),
      created: false,
    };
  }

  if (!profile.email) {
    throw ApiError.badRequest(
      "LinkedIn did not share an email address with CeonHub. Sign up with your email instead.",
    );
  }

  const byEmail = await prisma.user.findUnique({
    where: { email: profile.email },
    select: { id: true, role: true, status: true, linkedinId: true },
  });

  if (byEmail) {
    if (profile.emailVerified !== true) {
      throw ApiError.conflict(
        "An account already uses this email address. Sign in with your password to link LinkedIn.",
      );
    }
    if (byEmail.status === "DISABLED") {
      throw ApiError.forbidden("This account has been disabled. Contact support.");
    }

    await prisma.user.update({
      where: { id: byEmail.id },
      data: { linkedinId: profile.sub },
    });

    return {
      outcome: "signed-in",
      token: signToken({ sub: byEmail.id, role: byEmail.role }),
      user: await getSessionUser(byEmail.id),
      created: false,
    };
  }

  if (!role) return { outcome: "role-required" };

  const name = displayName(profile);
  const created = await prisma.user.create({
    data: {
      email: profile.email,
      linkedinId: profile.sub,
      passwordHash: null,
      role,
      ...(role === "CANDIDATE"
        ? { candidateProfile: { create: { name } } }
        : { employerProfile: { create: { name } } }),
    },
    select: { id: true, role: true },
  });

  sendEmail(welcomeEmail(profile.email, name, role));

  return {
    outcome: "signed-in",
    token: signToken({ sub: created.id, role: created.role }),
    user: await getSessionUser(created.id),
    created: true,
  };
}
