import { describe, expect, it } from "vitest";
import { prisma } from "../src/database/prisma";
import { api, createAccount, createAdmin } from "./helpers";

describe("companies", () => {
  it("lets an employer create a company and links it to their profile", async () => {
    const employer = await createAccount("EMPLOYER");

    const response = await employer.agent
      .post("/api/companies")
      .send({ name: "Northwind Labs", location: "Berlin", country: "DE" })
      .expect(201);

    expect(response.body.data.company).toMatchObject({
      name: "Northwind Labs",
      slug: "northwind-labs",
    });

    const me = await employer.agent.get("/api/auth/me").expect(200);
    expect(me.body.data.user.employer.company.name).toBe("Northwind Labs");
  });

  it("gives companies with the same name distinct slugs", async () => {
    const first = await createAccount("EMPLOYER");
    const second = await createAccount("EMPLOYER");

    const a = await first.agent.post("/api/companies").send({ name: "Acme" }).expect(201);
    const b = await second.agent.post("/api/companies").send({ name: "Acme" }).expect(201);

    expect(a.body.data.company.slug).toBe("acme");
    expect(b.body.data.company.slug).toBe("acme-2");
  });

  it("refuses a second company for the same employer", async () => {
    const employer = await createAccount("EMPLOYER");
    await employer.agent.post("/api/companies").send({ name: "First" }).expect(201);

    await employer.agent.post("/api/companies").send({ name: "Second" }).expect(409);
  });

  it("stops a candidate from creating a company", async () => {
    const candidate = await createAccount("CANDIDATE");
    await candidate.agent.post("/api/companies").send({ name: "Not Allowed" }).expect(403);
  });

  it("stops an employer from editing another employer's company", async () => {
    const owner = await createAccount("EMPLOYER");
    const other = await createAccount("EMPLOYER");
    const created = await owner.agent.post("/api/companies").send({ name: "Owned" }).expect(201);
    const companyId = created.body.data.company.id;

    await other.agent.patch(`/api/companies/${companyId}`).send({ name: "Hijacked" }).expect(403);

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    expect(company?.name).toBe("Owned");
  });

  it("lets an admin edit any company", async () => {
    const owner = await createAccount("EMPLOYER");
    const admin = await createAdmin();
    const created = await owner.agent.post("/api/companies").send({ name: "Owned" }).expect(201);

    await admin.agent
      .patch(`/api/companies/${created.body.data.company.id}`)
      .send({ name: "Corrected Name" })
      .expect(200);
  });

  it("validates the website URL", async () => {
    const employer = await createAccount("EMPLOYER");

    const response = await employer.agent
      .post("/api/companies")
      .send({ name: "Bad Website", website: "not-a-url" })
      .expect(422);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("candidate profiles", () => {
  it("lets a candidate update their own profile and skills", async () => {
    const candidate = await createAccount("CANDIDATE");

    const response = await candidate.agent
      .patch("/api/candidates/me")
      .send({
        headline: "Full-stack developer",
        location: "Lisbon",
        country: "PT",
        availability: "AVAILABLE_NOW",
        desiredEmployment: "FREELANCE",
        skills: ["TypeScript", "Node.js", "typescript"],
      })
      .expect(200);

    const profile = response.body.data.candidate;
    expect(profile.headline).toBe("Full-stack developer");
    // "TypeScript" and "typescript" resolve to the same skill.
    expect(profile.skills).toHaveLength(2);
    expect(profile.skills.map((skill: { slug: string }) => skill.slug).sort()).toEqual([
      "node-js",
      "typescript",
    ]);
  });

  it("reports profile completion on the session user", async () => {
    const candidate = await createAccount("CANDIDATE");

    const before = await candidate.agent.get("/api/auth/me").expect(200);
    expect(before.body.data.user.candidate.profileCompletion).toBe(0);

    await candidate.agent
      .patch("/api/candidates/me")
      .send({ headline: "Designer", bio: "Ten years of product design.", skills: ["Figma"] })
      .expect(200);

    const after = await candidate.agent.get("/api/auth/me").expect(200);
    expect(after.body.data.user.candidate.profileCompletion).toBe(50);
  });

  it("stops a candidate from editing another candidate's profile", async () => {
    const owner = await createAccount("CANDIDATE");
    const other = await createAccount("CANDIDATE");

    await other.agent
      .patch(`/api/candidates/${owner.id}`)
      .send({ headline: "Hijacked" })
      .expect(403);

    const profile = await prisma.candidateProfile.findUnique({ where: { userId: owner.id } });
    expect(profile?.headline).toBeNull();
  });

  it("stops an employer from editing a candidate profile", async () => {
    const candidate = await createAccount("CANDIDATE");
    const employer = await createAccount("EMPLOYER");

    await employer.agent
      .patch(`/api/candidates/${candidate.id}`)
      .send({ headline: "Hijacked" })
      .expect(403);
  });
});

describe("candidate directory", () => {
  it("is not readable by anonymous visitors or other candidates", async () => {
    await api().get("/api/candidates").expect(401);

    const candidate = await createAccount("CANDIDATE");
    await candidate.agent.get("/api/candidates").expect(403);
  });

  it("lists public candidates for employers and filters by skill and availability", async () => {
    const employer = await createAccount("EMPLOYER");
    const visible = await createAccount("CANDIDATE", { name: "Visible Candidate" });
    const hidden = await createAccount("CANDIDATE", { name: "Hidden Candidate" });

    await visible.agent
      .patch("/api/candidates/me")
      .send({ skills: ["Rust"], availability: "AVAILABLE_NOW" })
      .expect(200);
    await hidden.agent.patch("/api/candidates/me").send({ profileVisibility: "PRIVATE" }).expect(200);

    const all = await employer.agent.get("/api/candidates").expect(200);
    expect(all.body.data.items.map((item: { name: string }) => item.name)).toEqual([
      "Visible Candidate",
    ]);
    expect(all.body.data.meta.total).toBe(1);

    const bySkill = await employer.agent.get("/api/candidates?skill=rust").expect(200);
    expect(bySkill.body.data.items).toHaveLength(1);

    const byOtherSkill = await employer.agent.get("/api/candidates?skill=cobol").expect(200);
    expect(byOtherSkill.body.data.items).toHaveLength(0);
  });

  it("hides a private profile from employers but not from its owner", async () => {
    const employer = await createAccount("EMPLOYER");
    const candidate = await createAccount("CANDIDATE");
    await candidate.agent
      .patch("/api/candidates/me")
      .send({ profileVisibility: "PRIVATE" })
      .expect(200);

    await employer.agent.get(`/api/candidates/${candidate.id}`).expect(404);
    await candidate.agent.get(`/api/candidates/${candidate.id}`).expect(200);
  });

  it("only exposes the email address to the candidate themselves and to admins", async () => {
    const employer = await createAccount("EMPLOYER");
    const admin = await createAdmin();
    const candidate = await createAccount("CANDIDATE");

    const asEmployer = await employer.agent.get(`/api/candidates/${candidate.id}`).expect(200);
    expect(asEmployer.body.data.candidate.email).toBeUndefined();

    const asSelf = await candidate.agent.get("/api/candidates/me").expect(200);
    expect(asSelf.body.data.candidate.email).toBe(candidate.email);

    const asAdmin = await admin.agent.get(`/api/candidates/${candidate.id}`).expect(200);
    expect(asAdmin.body.data.candidate.email).toBe(candidate.email);
  });
});

describe("resume upload", () => {
  it("stores the file and points the profile at it", async () => {
    const candidate = await createAccount("CANDIDATE");

    const response = await candidate.agent
      .post("/api/candidates/me/resume")
      .attach("file", Buffer.from("%PDF-1.4 fake resume"), {
        filename: "my cv.pdf",
        contentType: "application/pdf",
      })
      .expect(201);

    expect(response.body.data.resume.fileName).toBe("my cv.pdf");
    expect(response.body.data.resume.url).toContain("/uploads/resumes/");

    const profile = await prisma.candidateProfile.findUnique({ where: { userId: candidate.id } });
    expect(profile?.resumeUrl).toBe(response.body.data.resume.url);
  });

  it("rejects a file type that is not a document", async () => {
    const candidate = await createAccount("CANDIDATE");

    await candidate.agent
      .post("/api/candidates/me/resume")
      .attach("file", Buffer.from("GIF89a"), {
        filename: "sneaky.gif",
        contentType: "image/gif",
      })
      .expect(400);
  });

  it("is not available to employers", async () => {
    const employer = await createAccount("EMPLOYER");

    await employer.agent
      .post("/api/candidates/me/resume")
      .attach("file", Buffer.from("%PDF-1.4"), {
        filename: "cv.pdf",
        contentType: "application/pdf",
      })
      .expect(403);
  });
});
