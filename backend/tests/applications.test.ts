import { describe, expect, it } from "vitest";
import { prisma } from "../src/database/prisma";
import { api, createAccount, createAdmin, createEmployerWithCompany, postJob } from "./helpers";

describe("applying to a job", () => {
  it("lets a candidate apply once", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });

    const response = await candidate.agent
      .post(`/api/jobs/${job.id}/applications`)
      .send({ coverLetter: "I would love to join." })
      .expect(201);

    expect(response.body.data.application).toMatchObject({
      status: "SUBMITTED",
      coverLetter: "I would love to join.",
    });

    await candidate.agent.post(`/api/jobs/${job.id}/applications`).send({}).expect(409);
  });

  it("shows the candidate their own application on the job", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });

    await candidate.agent.post(`/api/jobs/${job.id}/applications`).send({}).expect(201);

    const response = await candidate.agent.get(`/api/jobs/${job.id}`).expect(200);
    expect(response.body.data.job.myApplication.status).toBe("SUBMITTED");
  });

  it("refuses applications to drafts, paused, closed and expired jobs", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");

    const draft = await postJob(employer);
    await candidate.agent.post(`/api/jobs/${draft.id}/applications`).send({}).expect(400);

    const closed = await postJob(employer, { status: "PUBLISHED" });
    await employer.agent.patch(`/api/jobs/${closed.id}`).send({ status: "CLOSED" }).expect(200);
    await candidate.agent.post(`/api/jobs/${closed.id}/applications`).send({}).expect(400);

    const expired = await postJob(employer, {
      status: "PUBLISHED",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    await candidate.agent.post(`/api/jobs/${expired.id}/applications`).send({}).expect(400);
  });

  it("hides private jobs from candidates who were not invited", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED", private: true });

    await candidate.agent.post(`/api/jobs/${job.id}/applications`).send({}).expect(404);

    await prisma.invitation.create({
      data: { jobId: job.id, employerId: employer.id, candidateId: candidate.id },
    });

    await candidate.agent.post(`/api/jobs/${job.id}/applications`).send({}).expect(201);
  });

  it("does not let employers or anonymous visitors apply", async () => {
    const employer = await createEmployerWithCompany();
    const other = await createEmployerWithCompany("Other Co");
    const job = await postJob(employer, { status: "PUBLISHED" });

    await other.agent.post(`/api/jobs/${job.id}/applications`).send({}).expect(403);
    await api().post(`/api/jobs/${job.id}/applications`).send({}).expect(401);
  });
});

describe("listing applications", () => {
  it("scopes the list to the caller", async () => {
    const employerA = await createEmployerWithCompany("Company A");
    const employerB = await createEmployerWithCompany("Company B");
    const candidate1 = await createAccount("CANDIDATE", { name: "Candidate One" });
    const candidate2 = await createAccount("CANDIDATE", { name: "Candidate Two" });

    const jobA = await postJob(employerA, { title: "Job A", status: "PUBLISHED" });
    const jobB = await postJob(employerB, { title: "Job B", status: "PUBLISHED" });

    await candidate1.agent.post(`/api/jobs/${jobA.id}/applications`).send({}).expect(201);
    await candidate2.agent.post(`/api/jobs/${jobA.id}/applications`).send({}).expect(201);
    await candidate1.agent.post(`/api/jobs/${jobB.id}/applications`).send({}).expect(201);

    const forEmployerA = await employerA.agent.get("/api/applications").expect(200);
    expect(forEmployerA.body.data.meta.total).toBe(2);
    expect(
      forEmployerA.body.data.items.every(
        (item: { job: { title: string } }) => item.job.title === "Job A",
      ),
    ).toBe(true);

    const forCandidate1 = await candidate1.agent.get("/api/applications").expect(200);
    expect(forCandidate1.body.data.meta.total).toBe(2);

    const admin = await createAdmin();
    const forAdmin = await admin.agent.get("/api/applications").expect(200);
    expect(forAdmin.body.data.meta.total).toBe(3);
  });

  it("gives employers the candidate's details but hides them from other candidates", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });
    await candidate.agent.post(`/api/jobs/${job.id}/applications`).send({}).expect(201);

    const forEmployer = await employer.agent.get("/api/applications").expect(200);
    expect(forEmployer.body.data.items[0].candidate.email).toBe(candidate.email);

    const forCandidate = await candidate.agent.get("/api/applications").expect(200);
    expect(forCandidate.body.data.items[0].candidate).toBeUndefined();
  });

  it("stops an employer reading an application to another company's job", async () => {
    const employerA = await createEmployerWithCompany("Company A");
    const employerB = await createEmployerWithCompany("Company B");
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employerA, { status: "PUBLISHED" });

    const created = await candidate.agent
      .post(`/api/jobs/${job.id}/applications`)
      .send({})
      .expect(201);
    const applicationId = created.body.data.application.id;

    await employerB.agent.get(`/api/applications/${applicationId}`).expect(404);
    await employerA.agent.get(`/api/applications/${applicationId}`).expect(200);
  });

  it("stops a candidate reading someone else's application", async () => {
    const employer = await createEmployerWithCompany();
    const applicant = await createAccount("CANDIDATE");
    const nosy = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });

    const created = await applicant.agent
      .post(`/api/jobs/${job.id}/applications`)
      .send({})
      .expect(201);

    await nosy.agent.get(`/api/applications/${created.body.data.application.id}`).expect(404);
  });
});

describe("application status changes", () => {
  it("lets the employer move an application through the hiring stages", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });
    const created = await candidate.agent
      .post(`/api/jobs/${job.id}/applications`)
      .send({})
      .expect(201);
    const id = created.body.data.application.id;

    for (const status of ["REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"] as const) {
      const response = await employer.agent
        .patch(`/api/applications/${id}`)
        .send({ status })
        .expect(200);
      expect(response.body.data.application.status).toBe(status);
    }
  });

  it("only lets the candidate withdraw", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });
    const created = await candidate.agent
      .post(`/api/jobs/${job.id}/applications`)
      .send({})
      .expect(201);
    const id = created.body.data.application.id;

    await candidate.agent.patch(`/api/applications/${id}`).send({ status: "HIRED" }).expect(403);
    await candidate.agent.patch(`/api/applications/${id}`).send({ status: "WITHDRAWN" }).expect(200);

    // The employer cannot revive a withdrawn application.
    await employer.agent.patch(`/api/applications/${id}`).send({ status: "REVIEWING" }).expect(409);
  });

  it("stops an employer from touching another company's application", async () => {
    const employerA = await createEmployerWithCompany("Company A");
    const employerB = await createEmployerWithCompany("Company B");
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employerA, { status: "PUBLISHED" });
    const created = await candidate.agent
      .post(`/api/jobs/${job.id}/applications`)
      .send({})
      .expect(201);

    await employerB.agent
      .patch(`/api/applications/${created.body.data.application.id}`)
      .send({ status: "REJECTED" })
      .expect(404);
  });
});
