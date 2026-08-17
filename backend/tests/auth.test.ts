import { describe, expect, it } from "vitest";
import { prisma } from "../src/database/prisma";
import { api, createAccount, createAdmin, createPasswordAccount, DEFAULT_PASSWORD } from "./helpers";

/**
 * Candidates and employers join and return through LinkedIn — the rules for that
 * live in linkedin.test.ts. What is checked here is the shape of the rest of the
 * session: that password registration is gone, that password sign-in is reserved
 * for staff, and that sessions behave.
 */

describe("password registration", () => {
  it("no longer exists", async () => {
    const response = await api()
      .post("/api/auth/register")
      .send({
        email: "new.person@example.test",
        password: DEFAULT_PASSWORD,
        role: "CANDIDATE",
        name: "New Person",
      })
      .expect(404);

    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(await prisma.user.count()).toBe(0);
  });
});

describe("POST /api/auth/login", () => {
  it("signs an admin in", async () => {
    const admin = await createAdmin();

    const response = await api()
      .post("/api/auth/login")
      .send({ email: admin.email, password: admin.password })
      .expect(200);

    expect(response.body.data.user).toMatchObject({ role: "ADMIN", hasPassword: true });
    expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
  });

  it("turns a candidate away, even with a valid password on the record", async () => {
    // An account left over from before LinkedIn-only sign-in.
    const legacy = await createPasswordAccount("CANDIDATE", "legacy@example.test");

    const response = await api()
      .post("/api/auth/login")
      .send({ email: legacy.email, password: DEFAULT_PASSWORD })
      .expect(400);

    expect(response.body.error.message).toContain("LinkedIn");
  });

  it("turns an employer away the same way", async () => {
    const legacy = await createPasswordAccount("EMPLOYER", "legacy.employer@example.test");

    await api()
      .post("/api/auth/login")
      .send({ email: legacy.email, password: DEFAULT_PASSWORD })
      .expect(400);
  });

  it("gives the same answer for an unknown email as for a wrong password", async () => {
    const admin = await createAdmin();

    const wrongPassword = await api()
      .post("/api/auth/login")
      .send({ email: admin.email, password: "totally-wrong" })
      .expect(401);

    const unknownEmail = await api()
      .post("/api/auth/login")
      .send({ email: "nobody@example.test", password: DEFAULT_PASSWORD })
      .expect(401);

    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it("blocks a disabled admin", async () => {
    const admin = await createAdmin();
    await prisma.user.update({ where: { id: admin.id }, data: { status: "DISABLED" } });

    await api()
      .post("/api/auth/login")
      .send({ email: admin.email, password: admin.password })
      .expect(403);
  });

  it("never returns the password hash", async () => {
    const admin = await createAdmin();

    const response = await api()
      .post("/api/auth/login")
      .send({ email: admin.email, password: admin.password })
      .expect(200);

    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    expect(JSON.stringify(response.body)).not.toContain(DEFAULT_PASSWORD);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the signed-in candidate", async () => {
    const account = await createAccount("CANDIDATE");

    const response = await account.agent.get("/api/auth/me").expect(200);
    expect(response.body.data.user).toMatchObject({
      id: account.id,
      role: "CANDIDATE",
      hasPassword: false,
      linkedinConnected: true,
    });
  });

  it("rejects an anonymous request", async () => {
    const response = await api().get("/api/auth/me").expect(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a forged token", async () => {
    const response = await api()
      .get("/api/auth/me")
      .set("Cookie", "ceonhub_token=not.a.real.token")
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a valid token belonging to a user that was disabled afterwards", async () => {
    const account = await createAccount("CANDIDATE");
    await account.agent.get("/api/auth/me").expect(200);

    await prisma.user.update({ where: { id: account.id }, data: { status: "DISABLED" } });

    await account.agent.get("/api/auth/me").expect(403);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session", async () => {
    const admin = await createAdmin();

    await admin.agent.post("/api/auth/logout").expect(200);
    await admin.agent.get("/api/auth/me").expect(401);
  });
});

describe("PATCH /api/users/me/password", () => {
  it("lets an admin change their password and ends the session", async () => {
    const admin = await createAdmin();

    await admin.agent
      .patch("/api/users/me/password")
      .send({ currentPassword: admin.password, newPassword: "An0therGoodOne!" })
      .expect(200);

    await admin.agent.get("/api/auth/me").expect(401);

    await api()
      .post("/api/auth/login")
      .send({ email: admin.email, password: "An0therGoodOne!" })
      .expect(200);
    await api()
      .post("/api/auth/login")
      .send({ email: admin.email, password: admin.password })
      .expect(401);
  });

  it("rejects a wrong current password", async () => {
    const admin = await createAdmin();

    await admin.agent
      .patch("/api/users/me/password")
      .send({ currentPassword: "wrong-password", newPassword: "An0therGoodOne!" })
      .expect(400);
  });

  it("refuses on a LinkedIn account, which has no password", async () => {
    const account = await createAccount("CANDIDATE");

    const response = await account.agent
      .patch("/api/users/me/password")
      .send({ currentPassword: "anything", newPassword: "An0therGoodOne!" })
      .expect(400);

    expect(response.body.error.message).toContain("LinkedIn");
  });

  it("requires authentication", async () => {
    await api()
      .patch("/api/users/me/password")
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: "An0therGoodOne!" })
      .expect(401);
  });
});
