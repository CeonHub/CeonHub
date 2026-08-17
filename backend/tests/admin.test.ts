import { describe, expect, it } from "vitest";
import { prisma } from "../src/database/prisma";
import {
  api,
  createAccount,
  createAdmin,
  createEmployerWithCompany,
  postJob,
} from "./helpers";

describe("admin access control", () => {
  it("is closed to anonymous visitors, candidates and employers", async () => {
    const candidate = await createAccount("CANDIDATE");
    const employer = await createEmployerWithCompany();

    for (const path of ["/api/admin/users", "/api/admin/jobs", "/api/admin/stats"]) {
      await api().get(path).expect(401);
      await candidate.agent.get(path).expect(403);
      await employer.agent.get(path).expect(403);
    }

    const job = await postJob(employer, { status: "PUBLISHED" });
    await employer.agent
      .patch(`/api/admin/jobs/${job.id}/status`)
      .send({ status: "HIDDEN" })
      .expect(403);
    await candidate.agent
      .patch(`/api/admin/users/${employer.id}/status`)
      .send({ status: "DISABLED" })
      .expect(403);
  });
});

describe("admin user management", () => {
  it("lists and filters users", async () => {
    const admin = await createAdmin();
    await createAccount("CANDIDATE", { name: "Ada Candidate" });
    await createAccount("EMPLOYER", { name: "Grace Employer" });

    const all = await admin.agent.get("/api/admin/users").expect(200);
    expect(all.body.data.meta.total).toBe(3);

    const candidates = await admin.agent.get("/api/admin/users?role=CANDIDATE").expect(200);
    expect(candidates.body.data.items).toHaveLength(1);
    expect(candidates.body.data.items[0].name).toBe("Ada Candidate");

    const search = await admin.agent.get("/api/admin/users?q=grace").expect(200);
    expect(search.body.data.items).toHaveLength(1);
  });

  it("never returns password hashes", async () => {
    const admin = await createAdmin();
    await createAccount("CANDIDATE");

    const response = await admin.agent.get("/api/admin/users").expect(200);
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    expect(JSON.stringify(response.body)).not.toContain("$2b$");
  });

  it("disables a user, which ends their access immediately", async () => {
    const admin = await createAdmin();
    const candidate = await createAccount("CANDIDATE");

    await candidate.agent.get("/api/auth/me").expect(200);

    await admin.agent
      .patch(`/api/admin/users/${candidate.id}/status`)
      .send({ status: "DISABLED" })
      .expect(200);

    await candidate.agent.get("/api/auth/me").expect(403);

    await admin.agent
      .patch(`/api/admin/users/${candidate.id}/status`)
      .send({ status: "ACTIVE" })
      .expect(200);
    await candidate.agent.get("/api/auth/me").expect(200);
  });

  it("refuses to let an admin disable their own account", async () => {
    const admin = await createAdmin();

    await admin.agent
      .patch(`/api/admin/users/${admin.id}/status`)
      .send({ status: "DISABLED" })
      .expect(400);
  });

  it("writes an audit log entry for status changes", async () => {
    const admin = await createAdmin();
    const candidate = await createAccount("CANDIDATE");

    await admin.agent
      .patch(`/api/admin/users/${candidate.id}/status`)
      .send({ status: "DISABLED" })
      .expect(200);

    const entries = await prisma.auditLog.findMany({ where: { entityId: candidate.id } });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      actorId: admin.id,
      action: "user.status.changed",
      entityType: "USER",
    });
    expect(entries[0]?.metadata).toEqual({ from: "ACTIVE", to: "DISABLED" });
  });
});

describe("admin job moderation", () => {
  it("hides a job, removing it from public search and from the employer's control", async () => {
    const admin = await createAdmin();
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer, { title: "Questionable Job", status: "PUBLISHED" });

    const before = await api().get("/api/jobs").expect(200);
    expect(before.body.data.items).toHaveLength(1);

    await admin.agent.patch(`/api/admin/jobs/${job.id}/status`).send({ status: "HIDDEN" }).expect(200);

    const after = await api().get("/api/jobs").expect(200);
    expect(after.body.data.items).toHaveLength(0);

    await employer.agent.patch(`/api/jobs/${job.id}`).send({ status: "PUBLISHED" }).expect(403);

    const entries = await prisma.auditLog.findMany({ where: { entityId: job.id } });
    expect(entries[0]).toMatchObject({ action: "job.status.changed", entityType: "JOB" });
  });

  it("lists jobs of every status with their application counts", async () => {
    const admin = await createAdmin();
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");

    const published = await postJob(employer, { title: "Published", status: "PUBLISHED" });
    await postJob(employer, { title: "Draft" });
    await candidate.agent.post(`/api/jobs/${published.id}/applications`).send({}).expect(201);

    const response = await admin.agent.get("/api/admin/jobs").expect(200);
    expect(response.body.data.meta.total).toBe(2);

    const row = response.body.data.items.find(
      (job: { title: string }) => job.title === "Published",
    );
    expect(row.applicationCount).toBe(1);

    const drafts = await admin.agent.get("/api/admin/jobs?status=DRAFT").expect(200);
    expect(drafts.body.data.items).toHaveLength(1);
  });
});

describe("platform statistics", () => {
  it("counts users, jobs, applications and invitations", async () => {
    const admin = await createAdmin();
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");

    const job = await postJob(employer, { status: "PUBLISHED" });
    await postJob(employer, { private: true, status: "PUBLISHED" });
    await candidate.agent.post(`/api/jobs/${job.id}/applications`).send({}).expect(201);
    await employer.agent
      .post("/api/invitations")
      .send({ jobId: job.id, candidateId: candidate.id })
      .expect(201);

    const response = await admin.agent.get("/api/admin/stats").expect(200);

    expect(response.body.data.stats).toMatchObject({
      users: { total: 3, candidates: 1, employers: 1, disabled: 0 },
      jobs: { total: 2, published: 2, draft: 0, hidden: 0, private: 1 },
      applications: { total: 1, last7Days: 1 },
      invitations: { total: 1, pending: 1 },
    });
  });
});
