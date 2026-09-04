import { describe, expect, it } from "vitest";
import { prisma } from "../src/database/prisma";
import {
  api,
  createAccount,
  createAdmin,
  createEmployerWithCompany,
  JOB_DEFAULTS,
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

describe("admin job authoring", () => {
  it("creates a company that no employer account owns", async () => {
    const admin = await createAdmin();

    const response = await admin.agent
      .post("/api/companies")
      .send({ name: "CeonHub", description: "The marketplace itself." })
      .expect(201);

    const company = response.body.data.company;
    expect(company.slug).toBe("ceonhub");
    // Nothing is linked to an employer profile, so an employer can still claim it.
    expect(await prisma.employerProfile.count({ where: { companyId: company.id } })).toBe(0);

    const entries = await prisma.auditLog.findMany({ where: { entityId: company.id } });
    expect(entries[0]).toMatchObject({ action: "company.created", entityType: "COMPANY" });
  });

  it("lists every company, including those with no published job", async () => {
    const admin = await createAdmin();
    await createEmployerWithCompany("Employer Co");
    await admin.agent.post("/api/companies").send({ name: "CeonHub" }).expect(201);

    // The public directory only carries companies with a published, public job.
    const publicList = await api().get("/api/companies").expect(200);
    expect(publicList.body.data.items).toHaveLength(0);

    const response = await admin.agent.get("/api/admin/companies").expect(200);
    const names = response.body.data.items.map((row: { name: string }) => row.name);
    expect(names.sort()).toEqual(["CeonHub", "Employer Co"]);
    expect(response.body.data.items.every((row: { jobCount: number }) => row.jobCount === 0)).toBe(
      true,
    );

    const search = await admin.agent.get("/api/admin/companies?q=ceon").expect(200);
    expect(search.body.data.items).toHaveLength(1);
  });

  it("keeps the company list closed to everyone but staff", async () => {
    const candidate = await createAccount("CANDIDATE");
    const employer = await createEmployerWithCompany();

    await api().get("/api/admin/companies").expect(401);
    await candidate.agent.get("/api/admin/companies").expect(403);
    await employer.agent.get("/api/admin/companies").expect(403);
  });

  it("posts a job under a named company and publishes it to public search", async () => {
    const admin = await createAdmin();
    const created = await admin.agent.post("/api/companies").send({ name: "CeonHub" }).expect(201);
    const companyId = created.body.data.company.id;

    const response = await admin.agent
      .post("/api/jobs")
      .send({ ...JOB_DEFAULTS, title: "Full-stack Engineer", status: "PUBLISHED", companyId })
      .expect(201);

    const job = response.body.data.job;
    expect(job.company.id).toBe(companyId);
    expect(job.status).toBe("PUBLISHED");
    expect(job.createdBy).toBe(admin.id);

    // This is exactly what the careers page asks for.
    const careers = await api().get(`/api/jobs?companyId=${companyId}`).expect(200);
    expect(careers.body.data.items.map((row: { title: string }) => row.title)).toEqual([
      "Full-stack Engineer",
    ]);

    const entries = await prisma.auditLog.findMany({ where: { entityId: job.id } });
    expect(entries[0]).toMatchObject({
      actorId: admin.id,
      action: "job.created",
      entityType: "JOB",
    });
  });

  it("requires the admin to name a company, and refuses an unknown one", async () => {
    const admin = await createAdmin();

    const missing = await admin.agent.post("/api/jobs").send(JOB_DEFAULTS).expect(400);
    expect(missing.body.error.message).toContain("company");

    await admin.agent
      .post("/api/jobs")
      .send({ ...JOB_DEFAULTS, companyId: "does-not-exist" })
      .expect(404);
  });

  it("ignores a companyId sent by an employer, who always posts under their own", async () => {
    const admin = await createAdmin();
    const employer = await createEmployerWithCompany("Employer Co");
    const other = await admin.agent.post("/api/companies").send({ name: "Someone Else" }).expect(201);

    const response = await employer.agent
      .post("/api/jobs")
      .send({ ...JOB_DEFAULTS, companyId: other.body.data.company.id })
      .expect(201);

    expect(response.body.data.job.company.id).toBe(employer.companyId);
  });

  it("edits and closes another company's job, and logs both", async () => {
    const admin = await createAdmin();
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer, { title: "Original Title", status: "PUBLISHED" });

    const edited = await admin.agent
      .patch(`/api/jobs/${job.id}`)
      .send({ title: "Corrected Title", immediateHire: true })
      .expect(200);
    expect(edited.body.data.job.title).toBe("Corrected Title");
    expect(edited.body.data.job.immediateHire).toBe(true);

    await admin.agent.patch(`/api/jobs/${job.id}`).send({ status: "CLOSED" }).expect(200);
    const search = await api().get("/api/jobs").expect(200);
    expect(search.body.data.items).toHaveLength(0);

    const actions = (await prisma.auditLog.findMany({ where: { entityId: job.id } })).map(
      (entry) => entry.action,
    );
    expect(actions).toEqual(["job.updated", "job.updated"]);
  });

  it("deletes a job that nobody has applied to, and logs it", async () => {
    const admin = await createAdmin();
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer, { title: "Posted By Mistake" });

    await admin.agent.delete(`/api/jobs/${job.id}`).expect(200);
    expect(await prisma.job.count()).toBe(0);

    const entries = await prisma.auditLog.findMany({ where: { entityId: job.id } });
    expect(entries[0]).toMatchObject({ action: "job.deleted", entityType: "JOB" });
  });

  it("refuses to delete a job with applications, pointing at closing instead", async () => {
    const admin = await createAdmin();
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });
    await candidate.agent.post(`/api/jobs/${job.id}/applications`).send({}).expect(201);

    const response = await admin.agent.delete(`/api/jobs/${job.id}`).expect(409);
    expect(response.body.error.message).toContain("Close it instead");
    expect(await prisma.job.count()).toBe(1);
  });
});
