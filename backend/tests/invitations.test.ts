import { describe, expect, it } from "vitest";
import { prisma } from "../src/database/prisma";
import { createAccount, createAdmin, createEmployerWithCompany, postJob } from "./helpers";

async function invite(
  employer: Awaited<ReturnType<typeof createEmployerWithCompany>>,
  jobId: string,
  candidateId: string,
  message = "We think you would be a great fit.",
) {
  const response = await employer.agent
    .post("/api/invitations")
    .send({ jobId, candidateId, message })
    .expect(201);
  return response.body.data.invitation;
}

describe("sending invitations", () => {
  it("lets an employer invite a candidate to their own private job", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED", private: true });

    const invitation = await invite(employer, job.id, candidate.id);

    expect(invitation).toMatchObject({ status: "PENDING" });
    expect(invitation.candidate.userId).toBe(candidate.id);
    expect(invitation.job.id).toBe(job.id);
  });

  it("refuses to invite to another company's job", async () => {
    const owner = await createEmployerWithCompany("Owner Co");
    const other = await createEmployerWithCompany("Other Co");
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(owner, { status: "PUBLISHED" });

    await other.agent
      .post("/api/invitations")
      .send({ jobId: job.id, candidateId: candidate.id })
      .expect(404);

    expect(await prisma.invitation.count()).toBe(0);
  });

  it("refuses duplicates and unknown candidates", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });

    await invite(employer, job.id, candidate.id);
    await employer.agent
      .post("/api/invitations")
      .send({ jobId: job.id, candidateId: candidate.id })
      .expect(409);

    await employer.agent
      .post("/api/invitations")
      .send({ jobId: job.id, candidateId: "does-not-exist" })
      .expect(404);
  });

  it("refuses to invite to a closed job", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });
    await employer.agent.patch(`/api/jobs/${job.id}`).send({ status: "CLOSED" }).expect(200);

    await employer.agent
      .post("/api/invitations")
      .send({ jobId: job.id, candidateId: candidate.id })
      .expect(400);
  });

  it("is not available to candidates", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const other = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });

    await candidate.agent
      .post("/api/invitations")
      .send({ jobId: job.id, candidateId: other.id })
      .expect(403);
  });
});

describe("reading invitations", () => {
  it("shows candidates only their own invitations", async () => {
    const employer = await createEmployerWithCompany();
    const invited = await createAccount("CANDIDATE");
    const other = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED", private: true });

    const invitation = await invite(employer, job.id, invited.id);

    const mine = await invited.agent.get("/api/invitations").expect(200);
    expect(mine.body.data.meta.total).toBe(1);

    const theirs = await other.agent.get("/api/invitations").expect(200);
    expect(theirs.body.data.meta.total).toBe(0);

    await other.agent.get(`/api/invitations/${invitation.id}`).expect(404);
    await invited.agent.get(`/api/invitations/${invitation.id}`).expect(200);
  });

  it("shows employers the invitations sent for their own jobs", async () => {
    const employerA = await createEmployerWithCompany("Company A");
    const employerB = await createEmployerWithCompany("Company B");
    const candidate = await createAccount("CANDIDATE");

    const jobA = await postJob(employerA, { status: "PUBLISHED" });
    const jobB = await postJob(employerB, { status: "PUBLISHED" });
    const invitationA = await invite(employerA, jobA.id, candidate.id);
    await invite(employerB, jobB.id, candidate.id);

    const forA = await employerA.agent.get("/api/invitations").expect(200);
    expect(forA.body.data.meta.total).toBe(1);
    expect(forA.body.data.items[0].id).toBe(invitationA.id);

    await employerB.agent.get(`/api/invitations/${invitationA.id}`).expect(404);

    const admin = await createAdmin();
    const forAdmin = await admin.agent.get("/api/invitations").expect(200);
    expect(forAdmin.body.data.meta.total).toBe(2);
  });
});

describe("answering invitations", () => {
  it("lets the invited candidate accept, which also creates an application", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED", private: true });
    const invitation = await invite(employer, job.id, candidate.id);

    const response = await candidate.agent
      .patch(`/api/invitations/${invitation.id}`)
      .send({ status: "ACCEPTED" })
      .expect(200);

    expect(response.body.data.invitation.status).toBe("ACCEPTED");

    const applications = await employer.agent.get("/api/applications").expect(200);
    expect(applications.body.data.meta.total).toBe(1);
    expect(applications.body.data.items[0].candidate.userId).toBe(candidate.id);
  });

  it("lets the invited candidate decline without creating an application", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED", private: true });
    const invitation = await invite(employer, job.id, candidate.id);

    await candidate.agent
      .patch(`/api/invitations/${invitation.id}`)
      .send({ status: "DECLINED" })
      .expect(200);

    expect(await prisma.application.count()).toBe(0);
  });

  it("cannot be answered twice", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });
    const invitation = await invite(employer, job.id, candidate.id);

    await candidate.agent
      .patch(`/api/invitations/${invitation.id}`)
      .send({ status: "ACCEPTED" })
      .expect(200);
    await candidate.agent
      .patch(`/api/invitations/${invitation.id}`)
      .send({ status: "DECLINED" })
      .expect(409);
  });

  it("cannot be answered by another candidate or by the employer", async () => {
    const employer = await createEmployerWithCompany();
    const candidate = await createAccount("CANDIDATE");
    const other = await createAccount("CANDIDATE");
    const job = await postJob(employer, { status: "PUBLISHED" });
    const invitation = await invite(employer, job.id, candidate.id);

    await other.agent
      .patch(`/api/invitations/${invitation.id}`)
      .send({ status: "ACCEPTED" })
      .expect(404);
    await employer.agent
      .patch(`/api/invitations/${invitation.id}`)
      .send({ status: "ACCEPTED" })
      .expect(403);
  });
});
