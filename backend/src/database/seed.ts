/**
 * Demo data for local development and for trying the product out.
 *
 * Everything here is invented: no real people, companies or contact details. The
 * script is idempotent: it clears the tables it owns before inserting, so it can
 * be run repeatedly.
 *
 *   npm run db:seed            (development, via tsx)
 *   npm run db:seed:prod       (inside a container, from dist/)
 */
import { prisma } from "./prisma";
import { hashPassword } from "../utils/password";
import { slugify } from "../utils/slug";
import type { EmploymentType, JobStatus } from "../generated/prisma/enums";

const DEMO_PASSWORD = "Password123!";

interface JobSeed {
  title: string;
  description: string;
  category: string;
  employmentType: EmploymentType;
  location: string | null;
  remote: boolean;
  compensation: string;
  currency: string;
  status: JobStatus;
  immediateHire?: boolean;
  private?: boolean;
  internship?: boolean;
  freelance?: boolean;
  sideIncome?: boolean;
  skills: string[];
  companyIndex: 0 | 1;
}

const COMPANIES = [
  {
    name: "Northwind Logistics",
    description:
      "A regional logistics operator moving goods across the Midwest and the East Coast. We hire quickly and we hire often: warehouse teams, drivers and the people who keep the software running.",
    website: "https://example.com/northwind",
    location: "Columbus, OH",
    country: "United States",
  },
  {
    name: "Harbor Studio",
    description:
      "A small product studio building web and mobile products for clients in fintech and health. We work with freelancers as much as with employees.",
    website: "https://example.com/harbor",
    location: "Austin, TX",
    country: "United States",
  },
];

/**
 * CeonHub's own company row, which is what the careers page reads. The slug
 * derived from this name ("ceonhub") has to match the frontend's
 * NEXT_PUBLIC_CAREERS_COMPANY_SLUG, or /careers finds nothing.
 *
 * Unlike the demo companies it has no employer profile attached: its jobs are
 * posted by staff from the admin console, which is exactly the flow an admin
 * uses in production.
 */
const CEONHUB_COMPANY = {
  name: "CeonHub",
  description:
    "CeonHub is the hiring and work marketplace this site runs on. We are a small team building it in the open: the public job index, the private hiring flow, and the tooling behind both.",
  website: "https://www.ceonhub.net",
  location: "Remote, United States",
  country: "United States",
};

const CEONHUB_JOBS: Array<Omit<JobSeed, "companyIndex">> = [
  {
    title: "Full-stack Engineer",
    description:
      "We are looking for a full-stack engineer to work across the CeonHub product: the Next.js frontend, the Express and Prisma API, and the Postgres schema underneath.\n\nYou would own features end to end, from the database columns to the empty states. The codebase is small and deliberately boring, and we intend to keep it that way.\n\nWe work remotely across US time zones with a few hours of overlap each day.",
    category: "Engineering",
    employmentType: "FULL_TIME",
    location: "Remote, United States",
    remote: true,
    compensation: "$120,000 to $150,000 / year",
    currency: "USD",
    status: "PUBLISHED",
    skills: ["TypeScript", "Node.js", "React", "PostgreSQL"],
  },
  {
    title: "Product Designer",
    description:
      "CeonHub is a product where the interface is most of the product. We need a designer to take it from workable to genuinely good.\n\nThe work covers the job search and application flows, the employer console, and the design system that holds them together. You would be the first designer here, so you would set how design and engineering work together.\n\nA portfolio matters more than a CV.",
    category: "Design",
    employmentType: "FULL_TIME",
    location: "Remote, United States",
    remote: true,
    compensation: "$100,000 to $130,000 / year",
    currency: "USD",
    status: "PUBLISHED",
    skills: ["Product Design", "Design Systems", "Figma"],
  },
  {
    title: "Customer Support Specialist (part-time)",
    description:
      "Employers and candidates write to us when something is confusing or broken, and the answers they get shape whether they come back.\n\nYou would handle that inbox, spot the questions that keep repeating, and tell the team which ones are really product problems.\n\nAround 20 hours a week, with hours you choose inside US business time.",
    category: "Customer Support",
    employmentType: "PART_TIME",
    location: "Remote, United States",
    remote: true,
    compensation: "$28 to $34 / hour",
    currency: "USD",
    status: "PUBLISHED",
    sideIncome: true,
    skills: ["Customer Support", "Technical Writing"],
  },
];

const CANDIDATES = [
  {
    email: "ana.candidate@example.com",
    name: "Ana Ferreira",
    headline: "Frontend developer, React and TypeScript",
    bio: "Six years building interfaces for small product teams. I like getting a first version in front of users quickly, then making it solid.",
    location: "Austin, TX",
    country: "United States",
    availability: "AVAILABLE_NOW" as const,
    desiredEmployment: "FREELANCE" as const,
    skills: ["React", "TypeScript", "Next.js", "CSS"],
    portfolioUrl: "https://example.com/ana",
  },
  {
    email: "bram.candidate@example.com",
    name: "Bram de Vries",
    headline: "Warehouse team lead",
    bio: "Ten years in warehouse operations, five of them leading evening shifts. Forklift certified, used to peak season.",
    location: "Columbus, OH",
    country: "United States",
    availability: "AVAILABLE_NOW" as const,
    desiredEmployment: "FULL_TIME" as const,
    skills: ["Warehouse Operations", "Forklift", "Team Leadership"],
    portfolioUrl: null,
  },
  {
    email: "chidi.candidate@example.com",
    name: "Chidi Okafor",
    headline: "Backend engineer, Node.js and PostgreSQL",
    bio: "I build APIs that stay boring under load. Currently interested in contract work alongside my studies.",
    location: "Chicago, IL",
    country: "United States",
    availability: "AVAILABLE_SOON" as const,
    desiredEmployment: "CONTRACT" as const,
    skills: ["Node.js", "PostgreSQL", "TypeScript", "Docker"],
    portfolioUrl: "https://example.com/chidi",
  },
  {
    email: "dara.candidate@example.com",
    name: "Dara Nowak",
    headline: "Marketing student looking for an internship",
    bio: "Senior-year marketing student. I have run social accounts for two student organizations and want to learn from a real team.",
    location: "Columbus, OH",
    country: "United States",
    availability: "AVAILABLE_SOON" as const,
    desiredEmployment: "INTERNSHIP" as const,
    skills: ["Social Media", "Copywriting", "Analytics"],
    portfolioUrl: null,
  },
  {
    email: "emre.candidate@example.com",
    name: "Emre Yilmaz",
    headline: "Delivery driver, evenings and weekends",
    bio: "Looking for side income around my main job. Clean driving record, own vehicle, familiar with the city.",
    location: "Phoenix, AZ",
    country: "United States",
    availability: "AVAILABLE_NOW" as const,
    desiredEmployment: "PART_TIME" as const,
    skills: ["Driving", "Customer Service"],
    portfolioUrl: null,
  },
];

const JOBS: JobSeed[] = [
  {
    title: "Warehouse Assistant (immediate start)",
    description:
      "We need two warehouse assistants to start this week at our Columbus site.\n\nYou will pick and pack orders, keep the aisles tidy and help load vans in the morning. Previous warehouse experience is welcome but not required, and we train on the first day.\n\nShifts are Monday through Friday, 7:00am–3:30pm, with occasional Saturday overtime paid at a higher rate.",
    category: "Logistics & Delivery",
    employmentType: "FULL_TIME",
    location: "Columbus, OH",
    remote: false,
    compensation: "$3,200–3,600 / month",
    currency: "USD",
    status: "PUBLISHED",
    immediateHire: true,
    skills: ["Warehouse Operations", "Forklift"],
    companyIndex: 0,
  },
  {
    title: "Evening Delivery Driver (side income)",
    description:
      "Deliver packages on an evening route, 6:00pm–10:00pm, three to five days a week. This suits someone who wants steady side income alongside another job or studies.\n\nYou need a clean driving record and your own vehicle; gas is reimbursed weekly. Routes are planned for you and rarely leave the city.",
    category: "Logistics & Delivery",
    employmentType: "PART_TIME",
    location: "Columbus, OH",
    remote: false,
    compensation: "$19 / hour",
    currency: "USD",
    status: "PUBLISHED",
    immediateHire: true,
    sideIncome: true,
    skills: ["Driving", "Customer Service"],
    companyIndex: 0,
  },
  {
    title: "Logistics Operations Intern",
    description:
      "A six-month internship with our operations team. You will sit with the planners, learn how routes and shifts are built, and own a small improvement project of your own by month three.\n\nWe pay interns properly and we hire many of them afterwards.",
    category: "Operations",
    employmentType: "INTERNSHIP",
    location: "Columbus, OH",
    remote: false,
    compensation: "$2,400 / month",
    currency: "USD",
    status: "PUBLISHED",
    internship: true,
    skills: ["Analytics", "Operations"],
    companyIndex: 0,
  },
  {
    title: "Backend Engineer, Node.js",
    description:
      "Our internal tooling runs on a Node.js and PostgreSQL stack, and it is starting to creak. We are looking for an engineer who enjoys tidying that kind of thing up: clearer boundaries, fewer moving parts, better tests.\n\nYou will work with two other engineers and talk directly to the operations team who use what we build.",
    category: "Engineering",
    employmentType: "FULL_TIME",
    location: "Columbus, OH",
    remote: true,
    compensation: "$110,000–135,000 / year",
    currency: "USD",
    status: "PUBLISHED",
    skills: ["Node.js", "PostgreSQL", "TypeScript", "Docker"],
    companyIndex: 0,
  },
  {
    title: "Fleet Coordinator (draft)",
    description:
      "Draft posting, not yet published. The fleet coordinator keeps our vans serviced, insured and on the road, and is the first call when something breaks down mid-route.",
    category: "Operations",
    employmentType: "FULL_TIME",
    location: "Columbus, OH",
    remote: false,
    compensation: "$4,200–4,800 / month",
    currency: "USD",
    status: "DRAFT",
    skills: ["Operations"],
    companyIndex: 0,
  },
  {
    title: "Freelance Frontend Developer, React",
    description:
      "We have a three-month client project starting shortly: a customer dashboard in React and TypeScript, designs already done.\n\nYou would work alongside one of our backend developers and a designer, roughly three days a week. Remote is fine if you can overlap with Central time.",
    category: "Engineering",
    employmentType: "FREELANCE",
    location: "Austin, TX",
    remote: true,
    compensation: "$500–650 / day",
    currency: "USD",
    status: "PUBLISHED",
    freelance: true,
    immediateHire: true,
    skills: ["React", "TypeScript", "Next.js"],
    companyIndex: 1,
  },
  {
    title: "Product Designer (part-time)",
    description:
      "Two to three days a week, working on client products from first sketch to handover. You will be the only designer on most projects, so you need to be comfortable making decisions and explaining them.",
    category: "Design",
    employmentType: "PART_TIME",
    location: "Austin, TX",
    remote: true,
    compensation: "$4,000–5,200 / month",
    currency: "USD",
    status: "PUBLISHED",
    skills: ["Figma", "Product Design"],
    companyIndex: 1,
  },
  {
    title: "Content Writer, freelance and per article",
    description:
      "We need a writer for our clients' product blogs: clear explanatory pieces, 800–1,200 words, one or two a week. Technical subjects, non-technical readers.\n\nPaid per accepted article. A good fit as side income for someone already writing.",
    category: "Writing & Content",
    employmentType: "FREELANCE",
    location: null,
    remote: true,
    compensation: "$250 / article",
    currency: "USD",
    status: "PUBLISHED",
    freelance: true,
    sideIncome: true,
    skills: ["Copywriting", "Content Strategy"],
    companyIndex: 1,
  },
  {
    title: "Summer Marketing Internship",
    description:
      "A summer internship with our marketing team: newsletters, social accounts, and helping run one client campaign end to end. You will present what you learned to the whole studio in the final week.",
    category: "Marketing",
    employmentType: "INTERNSHIP",
    location: "Austin, TX",
    remote: false,
    compensation: "$2,200 / month",
    currency: "USD",
    status: "PUBLISHED",
    internship: true,
    skills: ["Social Media", "Copywriting"],
    companyIndex: 1,
  },
  {
    title: "Lead Engineer (confidential replacement hire)",
    description:
      "A private opportunity: we are quietly looking for a lead engineer before announcing the role publicly. You would own the technical direction of two client teams and mentor three engineers.\n\nBecause this is a replacement hire, we are only approaching candidates directly.",
    category: "Engineering",
    employmentType: "FULL_TIME",
    location: "Austin, TX",
    remote: true,
    compensation: "$150,000–175,000 / year",
    currency: "USD",
    status: "PUBLISHED",
    private: true,
    skills: ["Node.js", "TypeScript", "Team Leadership"],
    companyIndex: 1,
  },
];

async function clearDatabase(): Promise<void> {
  // Order matters: children before parents.
  await prisma.auditLog.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.candidateSkill.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.job.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.employerProfile.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
}

async function upsertSkills(names: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(names)];
  await prisma.skill.createMany({
    data: unique.map((name) => ({ name, slug: slugify(name) })),
    skipDuplicates: true,
  });

  const skills = await prisma.skill.findMany({ select: { id: true, name: true } });
  return new Map(skills.map((skill) => [skill.name, skill.id]));
}

async function main(): Promise<void> {
  console.log("Seeding CeonHub demo data…");
  await clearDatabase();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const admin = await prisma.user.create({
    data: { email: "admin@ceonhub.net", passwordHash, role: "ADMIN" },
    select: { id: true },
  });

  const companies = await Promise.all(
    COMPANIES.map((company) =>
      prisma.company.create({
        data: { ...company, slug: slugify(company.name) },
        select: { id: true, name: true },
      }),
    ),
  );

  const employers = await Promise.all(
    [
      { email: "maria.employer@example.com", name: "Maria Jansen", title: "Operations Manager" },
      { email: "tomas.employer@example.com", name: "Tomás Silva", title: "Studio Director" },
    ].map((employer, index) =>
      prisma.user.create({
        data: {
          email: employer.email,
          passwordHash: null,
          role: "EMPLOYER",
          employerProfile: {
            create: {
              name: employer.name,
              title: employer.title,
              companyId: companies[index]?.id,
            },
          },
        },
        select: { id: true },
      }),
    ),
  );

  const skillMap = await upsertSkills([
    ...CANDIDATES.flatMap((candidate) => candidate.skills),
    ...JOBS.flatMap((job) => job.skills),
    ...CEONHUB_JOBS.flatMap((job) => job.skills),
    "Operations",
    "Content Strategy",
    "Product Design",
  ]);

  const candidates = await Promise.all(
    CANDIDATES.map(async (candidate) => {
      const user = await prisma.user.create({
        data: {
          email: candidate.email,
          // Demo candidates and employers mirror real ones: no password, because
          // accounts are created through LinkedIn. They cannot be signed into.
          passwordHash: null,
          role: "CANDIDATE",
          candidateProfile: {
            create: {
              name: candidate.name,
              headline: candidate.headline,
              bio: candidate.bio,
              location: candidate.location,
              country: candidate.country,
              availability: candidate.availability,
              desiredEmployment: candidate.desiredEmployment,
              portfolioUrl: candidate.portfolioUrl,
            },
          },
        },
        select: { id: true },
      });

      await prisma.candidateSkill.createMany({
        data: candidate.skills
          .map((name) => skillMap.get(name))
          .filter((id): id is string => Boolean(id))
          .map((skillId) => ({ candidateId: user.id, skillId })),
        skipDuplicates: true,
      });

      return user;
    }),
  );

  const jobs = await Promise.all(
    JOBS.map(async (job) => {
      const company = companies[job.companyIndex];
      const employer = employers[job.companyIndex];
      if (!company || !employer) throw new Error("Seed data references a missing company");

      const created = await prisma.job.create({
        data: {
          title: job.title,
          description: job.description,
          category: job.category,
          employmentType: job.employmentType,
          location: job.location,
          remote: job.remote,
          compensation: job.compensation,
          currency: job.currency,
          status: job.status,
          immediateHire: job.immediateHire ?? false,
          private: job.private ?? false,
          internship: job.internship ?? false,
          freelance: job.freelance ?? false,
          sideIncome: job.sideIncome ?? false,
          publishedAt: job.status === "PUBLISHED" ? new Date() : null,
          companyId: company.id,
          createdBy: employer.id,
        },
        select: { id: true, title: true },
      });

      await prisma.jobSkill.createMany({
        data: job.skills
          .map((name) => skillMap.get(name))
          .filter((id): id is string => Boolean(id))
          .map((skillId) => ({ jobId: created.id, skillId })),
        skipDuplicates: true,
      });

      return created;
    }),
  );

  // CeonHub's own company and roles, which is what /careers renders. Posted by
  // the admin account, so the seed exercises the same path the admin console does.
  const ceonhub = await prisma.company.create({
    data: { ...CEONHUB_COMPANY, slug: slugify(CEONHUB_COMPANY.name) },
    select: { id: true, slug: true },
  });

  const ceonhubJobs = await Promise.all(
    CEONHUB_JOBS.map(async (job) => {
      const created = await prisma.job.create({
        data: {
          title: job.title,
          description: job.description,
          category: job.category,
          employmentType: job.employmentType,
          location: job.location,
          remote: job.remote,
          compensation: job.compensation,
          currency: job.currency,
          status: job.status,
          immediateHire: job.immediateHire ?? false,
          private: job.private ?? false,
          internship: job.internship ?? false,
          freelance: job.freelance ?? false,
          sideIncome: job.sideIncome ?? false,
          publishedAt: job.status === "PUBLISHED" ? new Date() : null,
          companyId: ceonhub.id,
          createdBy: admin.id,
        },
        select: { id: true },
      });

      await prisma.jobSkill.createMany({
        data: job.skills
          .map((name) => skillMap.get(name))
          .filter((id): id is string => Boolean(id))
          .map((skillId) => ({ jobId: created.id, skillId })),
        skipDuplicates: true,
      });

      return created;
    }),
  );

  // A handful of applications across both companies, in different stages.
  const applicationPlan: Array<{ job: number; candidate: number; status: JobStatus | string }> = [
    { job: 0, candidate: 1, status: "SHORTLISTED" },
    { job: 1, candidate: 4, status: "SUBMITTED" },
    { job: 2, candidate: 3, status: "REVIEWING" },
    { job: 3, candidate: 2, status: "INTERVIEW" },
    { job: 5, candidate: 0, status: "SUBMITTED" },
    { job: 8, candidate: 3, status: "REJECTED" },
  ];

  for (const entry of applicationPlan) {
    const job = jobs[entry.job];
    const candidate = candidates[entry.candidate];
    if (!job || !candidate) continue;

    await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        status: entry.status as never,
        coverLetter:
          "I am interested in this role and available to start quickly. My profile has the details of my recent work.",
      },
    });
  }

  // Private invitations, including one to the confidential lead engineer role.
  const invitationPlan: Array<{ job: number; employer: 0 | 1; candidate: number; message: string }> = [
    {
      job: 9,
      employer: 1,
      candidate: 2,
      message:
        "We are replacing our lead engineer and are approaching a small number of people directly. Your backend experience looks like a strong match. Would you like to hear more?",
    },
    {
      job: 5,
      employer: 1,
      candidate: 0,
      message:
        "Your portfolio matches a client dashboard we are starting this month. Three days a week, mostly remote. Interested?",
    },
    {
      job: 0,
      employer: 0,
      candidate: 1,
      message: "You led evening shifts at a similar site. We can start you this week if you are free.",
    },
  ];

  for (const entry of invitationPlan) {
    const job = jobs[entry.job];
    const employer = employers[entry.employer];
    const candidate = candidates[entry.candidate];
    if (!job || !employer || !candidate) continue;

    await prisma.invitation.create({
      data: {
        jobId: job.id,
        employerId: employer.id,
        candidateId: candidate.id,
        message: entry.message,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "seed.completed",
      entityType: "USER",
      entityId: admin.id,
      metadata: {
        jobs: jobs.length + ceonhubJobs.length,
        candidates: candidates.length,
      },
    },
  });

  console.log(
    [
      "",
      "Seed complete.",
      "",
      `  ${companies.length + 1} companies · ${jobs.length + ceonhubJobs.length} jobs · ` +
        `${candidates.length} candidates · ${applicationPlan.length} applications · ` +
        `${invitationPlan.length} invitations`,
      "",
      "  Sign in as staff:",
      `    admin@ceonhub.net / ${DEMO_PASSWORD}       →  /admin/login`,
      "",
      `  CeonHub's own ${ceonhubJobs.length} roles are live at /careers, posted by that admin`,
      "  account. Post, edit and close more of them from /admin/jobs.",
      "",
      "  The demo candidates and employers have no password, because CeonHub accounts",
      "  are created with LinkedIn. Their data fills the public site and the admin",
      "  console, but you cannot sign in as them. Use your own LinkedIn account for",
      "  the candidate and employer flows.",
      "",
    ].join("\n"),
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
