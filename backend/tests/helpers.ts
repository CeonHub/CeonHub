import request from "supertest";
import type TestAgent from "supertest/lib/agent";
import { app } from "../src/app";
import { prisma } from "../src/database/prisma";
import { signInWithLinkedIn } from "../src/modules/auth/linkedin.service";
import { hashPassword } from "../src/utils/password";
import { signToken } from "../src/utils/token";
import type { Role } from "../src/generated/prisma/enums";

export const api = (): TestAgent => request(app);

/** Only ADMIN accounts have passwords; candidates and employers use LinkedIn. */
export const DEFAULT_PASSWORD = "Sup3rSecret!";

export interface TestAccount {
  /** Supertest agent that carries the session cookie on every request. */
  agent: TestAgent;
  id: string;
  email: string;
}

let counter = 0;
function unique(prefix: string): { email: string; sub: string } {
  counter += 1;
  return { email: `${prefix}${counter}@example.test`, sub: `linkedin-sub-${prefix}${counter}` };
}

/** Puts an existing user's session cookie into a fresh agent's jar. */
export function agentFor(userId: string, role: Role): TestAgent {
  const agent = request.agent(app);
  agent.jar.setCookie(`ceonhub_token=${signToken({ sub: userId, role })}; Path=/`);
  return agent;
}

/**
 * Creates a candidate or employer the way the product now does: through the
 * LinkedIn sign-in path. The network calls to LinkedIn are not involved — the
 * service is handed the profile those calls would have returned.
 */
export async function createAccount(
  role: Exclude<Role, "ADMIN">,
  overrides: { email?: string; name?: string; linkedinId?: string } = {},
): Promise<TestAccount> {
  const generated = unique(role.toLowerCase());
  const email = overrides.email ?? generated.email;

  const result = await signInWithLinkedIn(
    {
      sub: overrides.linkedinId ?? generated.sub,
      name: overrides.name ?? (role === "CANDIDATE" ? "Test Candidate" : "Test Employer"),
      email,
      emailVerified: true,
    },
    role,
  );

  if (result.outcome !== "signed-in") {
    throw new Error(`Could not create a ${role} test account`);
  }

  return { agent: agentFor(result.user.id, role), id: result.user.id, email };
}

/** A legacy account that still has a password, for the linking tests. */
export async function createPasswordAccount(
  role: Role,
  email: string,
): Promise<{ id: string; email: string }> {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(DEFAULT_PASSWORD),
      role,
      ...(role === "CANDIDATE"
        ? { candidateProfile: { create: { name: "Legacy Candidate" } } }
        : role === "EMPLOYER"
          ? { employerProfile: { create: { name: "Legacy Employer" } } }
          : {}),
    },
    select: { id: true, email: true },
  });

  return user;
}

export interface TestEmployer extends TestAccount {
  companyId: string;
}

/** An employer that has already created their company, ready to post jobs. */
export async function createEmployerWithCompany(
  companyName = "Test Company",
): Promise<TestEmployer> {
  const employer = await createAccount("EMPLOYER");
  const response = await employer.agent
    .post("/api/companies")
    .send({ name: companyName })
    .expect(201);

  return { ...employer, companyId: response.body.data.company.id };
}

export const JOB_DEFAULTS = {
  title: "Senior Frontend Developer",
  description:
    "We are looking for a frontend developer to help us build the next version of our product.",
  employmentType: "FULL_TIME" as const,
  category: "Engineering" as const,
};

/** Posts a job as the given employer and returns the created job. */
export async function postJob(
  employer: TestEmployer,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; status: string; [key: string]: unknown }> {
  const response = await employer.agent
    .post("/api/jobs")
    .send({ ...JOB_DEFAULTS, ...overrides })
    .expect(201);

  return response.body.data.job;
}

/** Admins are never created through the API, only by the seed — mirror that here. */
export async function createAdmin(): Promise<TestAccount & { password: string }> {
  const { email } = unique("admin");

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(DEFAULT_PASSWORD), role: "ADMIN" },
    select: { id: true },
  });

  // Admins are the one role that still signs in with a password.
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email, password: DEFAULT_PASSWORD }).expect(200);

  return { agent, id: user.id, email, password: DEFAULT_PASSWORD };
}
