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

describe("job creation", () => {
  it("requires a company first", async () => {
    const employer = await createAccount("EMPLOYER");

    const response = await employer.agent.post("/api/jobs").send(JOB_DEFAULTS).expect(400);
    expect(response.body.error.message).toContain("company profile");
  });

  it("creates a draft by default", async () => {
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer);

    expect(job.status).toBe("DRAFT");
    expect(job.publishedAt).toBeNull();
  });

  it("publishes immediately when asked to", async () => {
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer, { status: "PUBLISHED" });

    expect(job.status).toBe("PUBLISHED");
    expect(job.publishedAt).not.toBeNull();
  });

  it("stores skills on the job", async () => {
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer, { skills: ["React", "TypeScript"] });

    expect((job.skills as Array<{ slug: string }>).map((skill) => skill.slug).sort()).toEqual([
      "react",
      "typescript",
    ]);
  });

  it("refuses to let a candidate create a job", async () => {
    const candidate = await createAccount("CANDIDATE");
    await candidate.agent.post("/api/jobs").send(JOB_DEFAULTS).expect(403);
    expect(await prisma.job.count()).toBe(0);
  });

  it("refuses anonymous job creation", async () => {
    await api().post("/api/jobs").send(JOB_DEFAULTS).expect(401);
  });

  it("validates the payload", async () => {
    const employer = await createEmployerWithCompany();

    const response = await employer.agent
      .post("/api/jobs")
      .send({ title: "Hi", description: "too short", employmentType: "NOPE", category: "Nope" })
      .expect(422);

    const fields = response.body.error.details.map((detail: { field: string }) => detail.field);
    expect(fields).toEqual(
      expect.arrayContaining(["title", "description", "employmentType", "category"]),
    );
  });
});

describe("public job search", () => {
  it("only returns published, non-private, unexpired jobs", async () => {
    const employer = await createEmployerWithCompany();

    await postJob(employer, { title: "Published Job", status: "PUBLISHED" });
    await postJob(employer, { title: "Draft Job" });
    await postJob(employer, { title: "Private Job", status: "PUBLISHED", private: true });
    const paused = await postJob(employer, { title: "Paused Job", status: "PUBLISHED" });
    await employer.agent.patch(`/api/jobs/${paused.id}`).send({ status: "PAUSED" }).expect(200);
    await postJob(employer, {
      title: "Expired Job",
      status: "PUBLISHED",
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const response = await api().get("/api/jobs").expect(200);
    const titles = response.body.data.items.map((job: { title: string }) => job.title);

    expect(titles).toEqual(["Published Job"]);
    expect(response.body.data.meta.total).toBe(1);
  });

  it("never exposes a private job in search, even to a signed-in candidate", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    await postJob(employer, { title: "Private Job", status: "PUBLISHED", private: true });

    const anonymous = await api().get("/api/jobs?q=Private").expect(200);
    expect(anonymous.body.data.items).toHaveLength(0);

    const signedIn = await candidate.agent.get("/api/jobs?q=Private").expect(200);
    expect(signedIn.body.data.items).toHaveLength(0);
  });

  it("filters by keyword, flags, employment type, category, remote and skill", async () => {
    const employer = await createEmployerWithCompany("Filter Co");

    await postJob(employer, {
      title: "Remote React Engineer",
      status: "PUBLISHED",
      remote: true,
      immediateHire: true,
      skills: ["React"],
      location: "Lisbon",
    });
    await postJob(employer, {
      title: "On-site Warehouse Assistant",
      status: "PUBLISHED",
      employmentType: "PART_TIME",
      category: "Logistics & Delivery",
      sideIncome: true,
      location: "Porto",
    });
    await postJob(employer, {
      title: "Summer Internship",
      status: "PUBLISHED",
      employmentType: "INTERNSHIP",
      internship: true,
    });
    await postJob(employer, {
      title: "Freelance Copywriter",
      status: "PUBLISHED",
      employmentType: "FREELANCE",
      category: "Writing & Content",
      freelance: true,
    });

    const cases: Array<[string, string[]]> = [
      ["?q=react", ["Remote React Engineer"]],
      ["?q=Filter Co", [
        "Remote React Engineer",
        "On-site Warehouse Assistant",
        "Summer Internship",
        "Freelance Copywriter",
      ]],
      ["?remote=true", ["Remote React Engineer"]],
      ["?immediateHire=true", ["Remote React Engineer"]],
      ["?sideIncome=true", ["On-site Warehouse Assistant"]],
      ["?internship=true", ["Summer Internship"]],
      ["?freelance=true", ["Freelance Copywriter"]],
      ["?employmentType=PART_TIME", ["On-site Warehouse Assistant"]],
      ["?category=Writing%20%26%20Content", ["Freelance Copywriter"]],
      ["?skill=react", ["Remote React Engineer"]],
      ["?location=porto", ["On-site Warehouse Assistant"]],
    ];

    for (const [query, expected] of cases) {
      const response = await api().get(`/api/jobs${query}`).expect(200);
      const titles = response.body.data.items.map((job: { title: string }) => job.title);
      expect(titles.sort()).toEqual([...expected].sort());
    }
  });

  it("paginates", async () => {
    const employer = await createEmployerWithCompany();
    for (let index = 0; index < 5; index += 1) {
      await postJob(employer, { title: `Job number ${index}`, status: "PUBLISHED" });
    }

    const response = await api().get("/api/jobs?page=2&pageSize=2").expect(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.meta).toMatchObject({ page: 2, pageSize: 2, total: 5, totalPages: 3 });
  });
});

describe("job detail visibility", () => {
  it("hides drafts and private jobs from the public", async () => {
    const employer = await createEmployerWithCompany();
    const draft = await postJob(employer);
    const priv = await postJob(employer, { status: "PUBLISHED", private: true });

    await api().get(`/api/jobs/${draft.id}`).expect(404);
    await api().get(`/api/jobs/${priv.id}`).expect(404);
  });

  it("shows the employer their own draft, and an admin any job", async () => {
    const employer = await createEmployerWithCompany();
    const admin = await createAdmin();
    const draft = await postJob(employer);

    await employer.agent.get(`/api/jobs/${draft.id}`).expect(200);
    await admin.agent.get(`/api/jobs/${draft.id}`).expect(200);
  });

  it("hides another employer's draft", async () => {
    const owner = await createEmployerWithCompany("Owner Co");
    const other = await createEmployerWithCompany("Other Co");
    const draft = await postJob(owner);

    await other.agent.get(`/api/jobs/${draft.id}`).expect(404);
  });

  it("shows a private job to a candidate who was invited to it", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED", private: true });

    await candidate.agent.get(`/api/jobs/${job.id}`).expect(404);

    await prisma.invitation.create({
      data: { jobId: job.id, employerId: employer.id, candidateId: candidate.id },
    });

    await candidate.agent.get(`/api/jobs/${job.id}`).expect(200);
  });
});

describe("job management", () => {
  it("lets the owner publish, pause and close a job", async () => {
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer);

    for (const status of ["PUBLISHED", "PAUSED", "CLOSED"] as const) {
      const response = await employer.agent
        .patch(`/api/jobs/${job.id}`)
        .send({ status })
        .expect(200);
      expect(response.body.data.job.status).toBe(status);
    }
  });

  it("keeps the original publish date when a job is paused and republished", async () => {
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer, { status: "PUBLISHED" });
    const first = (await employer.agent.get(`/api/jobs/${job.id}`).expect(200)).body.data.job
      .publishedAt;

    await employer.agent.patch(`/api/jobs/${job.id}`).send({ status: "PAUSED" }).expect(200);
    const republished = await employer.agent
      .patch(`/api/jobs/${job.id}`)
      .send({ status: "PUBLISHED" })
      .expect(200);

    expect(republished.body.data.job.publishedAt).toBe(first);
  });

  it("stops an employer from editing another company's job", async () => {
    const owner = await createEmployerWithCompany("Owner Co");
    const other = await createEmployerWithCompany("Other Co");
    const job = await postJob(owner, { title: "Owned Job" });

    await other.agent.patch(`/api/jobs/${job.id}`).send({ title: "Stolen" }).expect(403);

    const unchanged = await prisma.job.findUnique({ where: { id: job.id } });
    expect(unchanged?.title).toBe("Owned Job");
  });

  it("only lists the employer's own jobs in /api/jobs/mine", async () => {
    const owner = await createEmployerWithCompany("Owner Co");
    const other = await createEmployerWithCompany("Other Co");
    await postJob(owner, { title: "Mine" });
    await postJob(other, { title: "Theirs" });

    const response = await owner.agent.get("/api/jobs/mine").expect(200);
    const titles = response.body.data.items.map((job: { title: string }) => job.title);
    expect(titles).toEqual(["Mine"]);
  });

  it("deletes a job that has no applications", async () => {
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer);

    await employer.agent.delete(`/api/jobs/${job.id}`).expect(200);
    expect(await prisma.job.count()).toBe(0);
  });

  it("refuses to delete a job that has applications", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });

    await prisma.application.create({ data: { jobId: job.id, candidateId: candidate.id } });

    const response = await employer.agent.delete(`/api/jobs/${job.id}`).expect(409);
    expect(response.body.error.message).toContain("Close it instead");
    expect(await prisma.job.count()).toBe(1);
  });

  it("prevents an employer from editing a job an admin has hidden", async () => {
    const employer = await createEmployerWithCompany();
    const admin = await createAdmin();
    const job = await postJob(employer, { status: "PUBLISHED" });

    await prisma.job.update({ where: { id: job.id }, data: { status: "HIDDEN" } });

    await employer.agent.patch(`/api/jobs/${job.id}`).send({ status: "PUBLISHED" }).expect(403);
    await admin.agent.patch(`/api/jobs/${job.id}`).send({ status: "PUBLISHED" }).expect(200);
  });
});

describe("partial job updates", () => {
  it("leaves flags it was not asked to change alone, so a private job stays private", async () => {
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer, {
      title: "Confidential Role",
      status: "PUBLISHED",
      private: true,
      immediateHire: true,
      remote: true,
    });

    // Renaming says nothing about the flags, so none of them may move.
    const renamed = await employer.agent
      .patch(`/api/jobs/${job.id}`)
      .send({ title: "Confidential Role (renamed)" })
      .expect(200);

    expect(renamed.body.data.job).toMatchObject({
      title: "Confidential Role (renamed)",
      private: true,
      immediateHire: true,
      remote: true,
    });

    // The flags surviving is the point: a private job must not enter public search.
    const search = await api().get("/api/jobs?q=Confidential").expect(200);
    expect(search.body.data.items).toHaveLength(0);
  });

  it("leaves flags alone when only the status changes", async () => {
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer, {
      status: "PUBLISHED",
      private: true,
      sideIncome: true,
    });

    const paused = await employer.agent
      .patch(`/api/jobs/${job.id}`)
      .send({ status: "PAUSED" })
      .expect(200);

    expect(paused.body.data.job).toMatchObject({
      status: "PAUSED",
      private: true,
      sideIncome: true,
    });
  });

  it("still turns a flag off when asked to explicitly", async () => {
    const employer = await createEmployerWithCompany();
    const job = await postJob(employer, { status: "PUBLISHED", private: true });

    const opened = await employer.agent
      .patch(`/api/jobs/${job.id}`)
      .send({ private: false })
      .expect(200);
    expect(opened.body.data.job.private).toBe(false);

    const search = await api().get("/api/jobs").expect(200);
    expect(search.body.data.items).toHaveLength(1);
  });
});
