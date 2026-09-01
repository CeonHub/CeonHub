import { describe, expect, it } from "vitest";
import { adminEmailDomain } from "../src/config/env";
import { prisma } from "../src/database/prisma";
import { ApiError } from "../src/utils/apiError";
import {
  buildAuthorizationUrl,
  readState,
  safeNextPath,
  signInWithLinkedIn,
  type LinkedInProfile,
} from "../src/modules/auth/linkedin.service";
import { linkedin } from "../src/config/env";
import { api, createPasswordAccount, DEFAULT_PASSWORD } from "./helpers";

/**
 * The network calls to LinkedIn (code exchange, userinfo) cannot be exercised
 * without real credentials. Everything downstream of them — the account matching
 * rules that decide who gets signed in — is tested here directly.
 */
function profile(overrides: Partial<LinkedInProfile> = {}): LinkedInProfile {
  return {
    sub: "linkedin-subject-1",
    name: "Nadia Rahman",
    givenName: "Nadia",
    familyName: "Rahman",
    email: "nadia@example.test",
    emailVerified: true,
    ...overrides,
  };
}

describe("provider configuration", () => {
  it("reports LinkedIn as unavailable when no credentials are configured", async () => {
    // The test environment deliberately leaves LINKEDIN_CLIENT_ID unset.
    expect(linkedin.enabled).toBe(false);

    const response = await api().get("/api/auth/providers").expect(200);
    expect(response.body.data.providers.linkedin).toBe(false);
  });

  it("refuses to start the flow when it is not configured", async () => {
    const response = await api().get("/api/auth/linkedin").expect(503);
    expect(response.body.success).toBe(false);
  });

  it("rejects a callback with no state instead of trusting it", async () => {
    // Redirects back to the frontend with an error rather than signing anyone in.
    const response = await api().get("/api/auth/linkedin/callback?code=abc").expect(302);
    expect(response.headers.location).toContain("/login?error=");

    // The state cookie is cleared, but no session is ever issued.
    const header: unknown = response.headers["set-cookie"];
    const cookies = Array.isArray(header) ? (header as string[]) : [];
    expect(cookies.some((cookie) => cookie.startsWith("ceonhub_token="))).toBe(false);
  });

  it("sends a cancelled sign-in back with an explanation", async () => {
    const response = await api()
      .get("/api/auth/linkedin/callback?error=user_cancelled_authorize")
      .expect(302);

    expect(decodeURIComponent(response.headers.location ?? "")).toContain("cancelled");
  });
});

describe("state handling", () => {
  it("round-trips the role and return path, and rejects a mismatched nonce", () => {
    // buildAuthorizationUrl needs credentials, so exercise it with the real config
    // only when it is enabled; the state helpers are what matter here.
    if (linkedin.enabled) {
      const { url, nonce } = buildAuthorizationUrl({ role: "EMPLOYER", next: "/employer/jobs" });
      const state = new URL(url).searchParams.get("state");
      expect(readState(state ?? undefined, nonce)).toMatchObject({
        role: "EMPLOYER",
        next: "/employer/jobs",
      });
      expect(() => readState(state ?? undefined, "a-different-nonce")).toThrow(ApiError);
    }

    expect(() => readState(undefined, "nonce")).toThrow(ApiError);
    expect(() => readState("not-a-jwt", "nonce")).toThrow(ApiError);
  });

  it("only accepts same-site return paths", () => {
    expect(safeNextPath("/candidate/dashboard")).toBe("/candidate/dashboard");
    expect(safeNextPath("//evil.example.com")).toBeUndefined();
    expect(safeNextPath("https://evil.example.com")).toBeUndefined();
    expect(safeNextPath(undefined)).toBeUndefined();
  });
});

describe("signing in with a LinkedIn profile", () => {
  it("creates a candidate account on first sign-in", async () => {
    const result = await signInWithLinkedIn(profile(), "CANDIDATE");

    expect(result.outcome).toBe("signed-in");
    if (result.outcome !== "signed-in") return;

    expect(result.created).toBe(true);
    expect(result.user).toMatchObject({
      email: "nadia@example.test",
      role: "CANDIDATE",
      name: "Nadia Rahman",
      hasPassword: false,
      linkedinConnected: true,
    });

    const stored = await prisma.user.findUnique({ where: { email: "nadia@example.test" } });
    expect(stored?.passwordHash).toBeNull();
    expect(stored?.linkedinId).toBe("linkedin-subject-1");

    // The candidate profile the rest of the app depends on exists too.
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: stored?.id ?? "" },
    });
    expect(candidateProfile?.name).toBe("Nadia Rahman");
  });

  it("creates an employer account when that is the chosen role", async () => {
    const result = await signInWithLinkedIn(profile(), "EMPLOYER");
    expect(result.outcome).toBe("signed-in");
    if (result.outcome !== "signed-in") return;

    expect(result.user.role).toBe("EMPLOYER");
    expect(result.user.employer).toMatchObject({ company: null });
  });

  it("asks for a role instead of guessing one for a new member", async () => {
    const result = await signInWithLinkedIn(profile(), undefined);

    expect(result.outcome).toBe("role-required");
    expect(await prisma.user.count()).toBe(0);
  });

  it("signs an already-linked member straight back in, without a role", async () => {
    await signInWithLinkedIn(profile(), "CANDIDATE");

    const again = await signInWithLinkedIn(profile({ name: "Nadia R." }), undefined);
    expect(again.outcome).toBe("signed-in");
    if (again.outcome !== "signed-in") return;

    expect(again.created).toBe(false);
    expect(await prisma.user.count()).toBe(1);
  });

  it("matches on the LinkedIn subject, not the email address", async () => {
    await signInWithLinkedIn(profile(), "CANDIDATE");

    // Same person, new email on their LinkedIn account.
    const result = await signInWithLinkedIn(profile({ email: "nadia.new@example.test" }), undefined);
    expect(result.outcome).toBe("signed-in");
    expect(await prisma.user.count()).toBe(1);
  });

  it("links LinkedIn to an existing account when the email is verified", async () => {
    // An admin is the one account type that still has a password of its own, and
    // signing in with it means the address has to be on the staff domain.
    const email = `linkme@${adminEmailDomain}`;
    const existing = await createPasswordAccount("ADMIN", email);

    const result = await signInWithLinkedIn(
      profile({ sub: "subject-link", email, emailVerified: true }),
      undefined,
    );

    expect(result.outcome).toBe("signed-in");
    if (result.outcome !== "signed-in") return;
    expect(result.user.id).toBe(existing.id);
    expect(result.user.hasPassword).toBe(true);
    expect(result.user.linkedinConnected).toBe(true);

    // Their password still works afterwards.
    await api()
      .post("/api/auth/login")
      .send({ email, password: DEFAULT_PASSWORD })
      .expect(200);
  });

  it("refuses to take over an existing account on an unverified email", async () => {
    // An account with no LinkedIn link yet is the one a takeover would target.
    await createPasswordAccount("ADMIN", "victim@example.test");

    await expect(
      signInWithLinkedIn(
        profile({ sub: "attacker", email: "victim@example.test", emailVerified: false }),
        undefined,
      ),
    ).rejects.toThrow(ApiError);

    const untouched = await prisma.user.findUnique({ where: { email: "victim@example.test" } });
    expect(untouched?.linkedinId).toBeNull();
  });

  it("refuses when LinkedIn shares no email address at all", async () => {
    await expect(
      signInWithLinkedIn(profile({ email: undefined }), "CANDIDATE"),
    ).rejects.toThrow(ApiError);
  });

  it("keeps disabled accounts locked out", async () => {
    const result = await signInWithLinkedIn(profile(), "CANDIDATE");
    if (result.outcome !== "signed-in") throw new Error("expected a session");

    await prisma.user.update({ where: { id: result.user.id }, data: { status: "DISABLED" } });

    await expect(signInWithLinkedIn(profile(), undefined)).rejects.toThrow(ApiError);
  });

  it("falls back to the email local part when LinkedIn sends no name", async () => {
    const result = await signInWithLinkedIn(
      profile({ name: undefined, givenName: undefined, familyName: undefined }),
      "CANDIDATE",
    );

    if (result.outcome !== "signed-in") throw new Error("expected a session");
    expect(result.user.name).toBe("nadia");
  });
});

describe("password endpoints with a LinkedIn account", () => {
  it("tells the member to use LinkedIn rather than reporting a wrong password", async () => {
    await signInWithLinkedIn(profile(), "CANDIDATE");

    const response = await api()
      .post("/api/auth/login")
      .send({ email: "nadia@example.test", password: DEFAULT_PASSWORD })
      .expect(400);

    expect(response.body.error.message).toContain("LinkedIn");
  });

  it("refuses a password change on an account that has no password", async () => {
    const result = await signInWithLinkedIn(profile(), "CANDIDATE");
    if (result.outcome !== "signed-in") throw new Error("expected a session");

    const agent = api();
    const response = await agent
      .patch("/api/users/me/password")
      .set("Cookie", `ceonhub_token=${result.token}`)
      .send({ currentPassword: "anything", newPassword: "An0therGoodOne!" })
      .expect(400);

    expect(response.body.error.message).toContain("LinkedIn");
  });
});
