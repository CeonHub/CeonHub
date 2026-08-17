You are the lead engineer responsible for building a production-ready MVP for a product called CeonHub.

IMPORTANT:
Build a REAL working MVP, not a mockup or prototype.

The application must be:
- Easy to run locally
- Easy to deploy
- Easy to maintain
- Easy for another developer to understand
- Split into separate frontend and backend applications
- Production-ready without unnecessary complexity

Do not over-engineer the MVP.

==================================================
1. PRODUCT
==================================================

CeonHub is a hiring and work marketplace.

The initial focus is:

- Immediate hiring
- Immediate work
- Freelance opportunities
- Side-income opportunities
- Internships
- Private hiring
- Direct employer/candidate connections
- International hiring

The product should help:

CANDIDATES:
Find work quickly.

EMPLOYERS:
Find candidates quickly.

The long-term vision may include recruiting services, payments, subscriptions, messaging, referrals, social networking, and other marketplace functionality.

DO NOT build those advanced features in the MVP unless explicitly requested.

==================================================
2. MVP OBJECTIVE
==================================================

The MVP must allow this complete workflow:

Employer:
Register
→ Create company profile
→ Post job
→ Publish job
→ Receive applications
→ View applicants
→ Invite a candidate privately

Candidate:
Register
→ Create profile
→ Add skills/resume
→ Set availability
→ Browse jobs
→ Search/filter jobs
→ View job
→ Apply
→ View application status
→ Receive private invitation

Admin:
Login
→ View users
→ View jobs
→ Manage/disable users
→ Hide/remove jobs

If these workflows work reliably, the MVP is successful.

==================================================
3. REPOSITORY ARCHITECTURE
==================================================

Use a monorepo-style repository:

/ceonhub
    /frontend
    /backend
    /docs

Frontend and backend MUST remain separate applications.

Frontend:
Next.js + TypeScript

Backend:
Node.js + TypeScript

Database:
PostgreSQL

ORM:
Prisma

API:
REST

Do NOT allow the frontend to directly access PostgreSQL.

All application data must go through the backend API.

==================================================
4. FRONTEND
==================================================

Use:

- Next.js
- TypeScript
- Tailwind CSS
- React
- Responsive design

The frontend should communicate with the backend through an environment-configured API URL.

Example:

NEXT_PUBLIC_API_URL=http://localhost:4000

Never hardcode production API URLs.

Use reusable components.

Suggested components:

- Navbar
- Footer
- Button
- Input
- Select
- Modal
- JobCard
- JobFilters
- CandidateCard
- CompanyCard
- ApplicationStatus
- LoadingState
- EmptyState
- ErrorState
- Pagination

Keep components reasonably small.

Do not create giant React components.

==================================================
5. BACKEND
==================================================

Use:

- Node.js
- TypeScript
- Express.js
- Prisma
- PostgreSQL
- Zod for validation

Structure:

/backend
    /src
        /config
        /middleware
        /modules
            /auth
            /users
            /companies
            /candidates
            /jobs
            /applications
            /invitations
            /admin
        /routes
        /utils
        /database

Use modular architecture.

Keep:

Routes
Controllers
Services
Validation
Database access

separated.

Do not put all backend logic into one file.

==================================================
6. AUTHENTICATION
==================================================

Implement secure authentication.

Required:

- Register
- Login
- Logout
- Current user
- Password hashing
- Protected routes
- Role-based authorization

Roles:

CANDIDATE
EMPLOYER
ADMIN

Passwords must NEVER be stored in plain text.

Use bcrypt or another established password hashing library.

Use secure HTTP-only cookies for authentication if practical.

Do not expose authentication secrets to the frontend.

Use environment variables for secrets.

==================================================
7. DATABASE
==================================================

Use PostgreSQL + Prisma.

Create appropriate Prisma models for:

User
CandidateProfile
Company
EmployerProfile
Job
Application
Invitation
Skill
CandidateSkill
JobSkill
Resume
AuditLog

Keep the database schema simple.

Do not create unnecessary tables.

Users:

- id
- email
- passwordHash
- role
- status
- createdAt
- updatedAt

CandidateProfile:

- userId
- name
- headline
- bio
- location
- country
- availability
- resumeUrl
- portfolioUrl
- profileVisibility
- createdAt
- updatedAt

Company:

- id
- name
- description
- website
- logoUrl
- location
- country
- createdAt
- updatedAt

Job:

- id
- companyId
- createdBy
- title
- description
- location
- remote
- employmentType
- category
- compensation
- currency
- immediateHire
- private
- internship
- freelance
- sideIncome
- status
- createdAt
- updatedAt
- expiresAt

Application:

- id
- jobId
- candidateId
- coverLetter
- status
- createdAt
- updatedAt

Invitation:

- id
- jobId
- employerId
- candidateId
- message
- status
- createdAt
- updatedAt

Application statuses:

SUBMITTED
REVIEWING
SHORTLISTED
INTERVIEW
OFFER
HIRED
REJECTED
WITHDRAWN

Invitation statuses:

PENDING
ACCEPTED
DECLINED
EXPIRED

==================================================
8. JOBS
==================================================

Candidates can:

- Browse jobs
- Search jobs
- Filter jobs
- View job details
- Apply

Filters:

- Keyword
- Location
- Remote
- Employment type
- Category
- Immediate hiring
- Freelance
- Internship
- Side income

Employers can:

- Create job
- Save draft
- Publish job
- Edit job
- Pause job
- Close job
- View applicants

Public jobs should be searchable.

Private jobs should NOT appear in public job search.

==================================================
9. PRIVATE HIRING
==================================================

This is one of CeonHub's important differentiators.

Employers can invite individual candidates to private opportunities.

Example workflow:

Employer views candidate
→ Clicks "Invite"
→ Selects job
→ Adds message
→ Sends invitation

Candidate:

Dashboard
→ Private Invitations
→ View opportunity
→ Accept / Decline

Do not build complex messaging yet.

==================================================
10. CANDIDATE EXPERIENCE
==================================================

Pages:

/candidate/dashboard
/candidate/profile
/candidate/jobs
/candidate/applications
/candidate/invitations
/candidate/settings

Candidate dashboard should show:

- Profile completion
- Available Now status
- Recommended/latest jobs
- Applications
- Invitations

Candidate profile should allow:

- Name
- Headline
- Bio
- Location
- Skills
- Resume
- Portfolio
- Availability
- Desired employment type

Availability options:

AVAILABLE_NOW
AVAILABLE_SOON
NOT_AVAILABLE

==================================================
11. EMPLOYER EXPERIENCE
==================================================

Pages:

/employer/dashboard
/employer/profile
/employer/jobs
/employer/jobs/new
/employer/jobs/[id]
/employer/applications
/employer/candidates
/employer/invitations
/employer/settings

Dashboard should show:

- Active jobs
- Applications
- Recent applicants
- Invitations

==================================================
12. PUBLIC WEBSITE
==================================================

Create:

/
 /jobs
 /jobs/[id]
 /companies
 /companies/[id]
 /about
 /how-it-works

Homepage messaging should clearly communicate:

"Find work. Hire talent. Connect privately."

Hero CTAs:

"Find Jobs"

"Hire Talent"

Include sections for:

- Immediate opportunities
- Private opportunities
- Freelance work
- Side income
- Internships
- How CeonHub works
- Candidate CTA
- Employer CTA

Design should be professional and modern.

Do NOT make it look like a generic AI-generated landing page.

==================================================
13. ADMIN
==================================================

Create:

/admin
/admin/users
/admin/jobs

Admin functionality:

- View users
- Disable users
- View jobs
- Hide jobs
- Close jobs
- Basic platform statistics

Keep admin simple.

==================================================
14. API
==================================================

Create REST endpoints.

Authentication:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

Jobs:

GET /api/jobs
POST /api/jobs
GET /api/jobs/:id
PATCH /api/jobs/:id
DELETE /api/jobs/:id

Applications:

POST /api/jobs/:id/applications
GET /api/applications
GET /api/applications/:id
PATCH /api/applications/:id

Candidates:

GET /api/candidates
GET /api/candidates/:id
PATCH /api/candidates/:id

Companies:

GET /api/companies
GET /api/companies/:id
POST /api/companies
PATCH /api/companies/:id

Invitations:

POST /api/invitations
GET /api/invitations
PATCH /api/invitations/:id

Admin:

GET /api/admin/users
PATCH /api/admin/users/:id/status
GET /api/admin/jobs
PATCH /api/admin/jobs/:id/status

Use consistent JSON responses.

Example:

{
  "success": true,
  "data": {}
}

Errors:

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}

Use correct HTTP status codes.

==================================================
15. VALIDATION
==================================================

Use Zod for API input validation.

Validate:

- Registration
- Login
- Job creation
- Job updates
- Applications
- Candidate profiles
- Company profiles
- Invitations

Never trust frontend validation.

Backend validation is mandatory.

==================================================
16. SECURITY
==================================================

Implement:

- Password hashing
- Authentication middleware
- Role-based authorization
- Input validation
- Rate limiting
- CORS
- Secure cookies
- Helmet/security headers
- Request size limits
- Error handling
- Audit logging for sensitive admin actions

Never return:

- passwordHash
- authentication secrets
- internal sensitive data

Never trust role information sent by the frontend.

==================================================
17. FILE UPLOADS
==================================================

For the MVP, resumes and images should use a storage abstraction.

Do not tightly couple the application to local filesystem storage.

Create an interface/service so cloud storage can later use:

- S3
- Cloudflare R2
- Supabase Storage
- another S3-compatible provider

For local development, a simple local implementation is acceptable.

Document how to switch to cloud storage.

==================================================
18. EMAIL
==================================================

Create an email service abstraction.

MVP emails:

- Welcome
- Application received
- Application status changed
- Private invitation

Do not tightly couple business logic to a specific email provider.

Use environment variables.

For local development, provide a development-friendly option.

==================================================
19. DEPLOYMENT — VERY IMPORTANT
==================================================

Deployment simplicity is a major requirement.

The application must be easy to deploy.

Do NOT require Kubernetes.

Do NOT require Docker Swarm.

Do NOT introduce unnecessary infrastructure.

The recommended production architecture should be:

Frontend:
Next.js deployed to Vercel or another standard Node-compatible platform.

Backend:
Node.js API deployed to Render, Railway, Fly.io, AWS, or another standard Node hosting platform.

Database:
Managed PostgreSQL.

The application must also work with Docker if practical.

Create:

/frontend/Dockerfile
/backend/Dockerfile
/docker-compose.yml

docker-compose.yml should allow a developer to run:

- PostgreSQL
- backend
- frontend

locally with minimal configuration.

Also provide:

.env.example

for frontend and backend.

Never commit real credentials.

==================================================
20. ENVIRONMENT VARIABLES
==================================================

Frontend:

NEXT_PUBLIC_API_URL=

Backend:

NODE_ENV=
PORT=
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=
CORS_ORIGIN=

Storage variables should be added only when needed.

Email variables should be added only when needed.

Document every environment variable.

==================================================
21. DATABASE DEPLOYMENT
==================================================

Use Prisma migrations.

Commands should be straightforward.

Example:

npm run db:migrate
npm run db:seed

Provide a seed script with realistic demo data.

Seed:

- 1 admin
- 2 employers
- 2 companies
- 5 candidates
- 10 jobs
- several applications
- several private invitations

Never use real personal information.

==================================================
22. DEVELOPMENT COMMANDS
==================================================

The project should have simple commands.

Root:

npm install
npm run dev
npm run build
npm run test
npm run lint

Frontend:

npm run dev
npm run build
npm run start

Backend:

npm run dev
npm run build
npm run start

Database:

npm run db:migrate
npm run db:seed

If using npm workspaces, configure them properly.

Choose the simplest approach that keeps frontend/backend separated.

==================================================
23. DOCUMENTATION
==================================================

Create:

README.md

Include:

- Product overview
- Architecture
- Requirements
- Installation
- Environment variables
- Local development
- Database setup
- Database migration
- Seed data
- Testing
- Production build
- Deployment
- Troubleshooting

Also create:

/docs/architecture.md
/docs/api.md
/docs/deployment.md

Documentation must match the actual implementation.

Do not document functionality that does not exist.

==================================================
24. TESTING
==================================================

At minimum test:

Authentication
Authorization
Job creation
Job publishing
Job search
Job application
Private invitation
Application status changes

Test that:

Candidate cannot create employer jobs.

Employer cannot access another employer's private data.

Candidate cannot modify another candidate's profile.

Normal users cannot access admin endpoints.

Private jobs are not publicly searchable.

==================================================
25. ERROR HANDLING
==================================================

Implement centralized backend error handling.

Do not expose stack traces in production.

Frontend should have:

- Loading states
- Empty states
- Error states
- Form validation errors
- API error handling

Do not leave blank screens when an API request fails.

==================================================
26. PERFORMANCE
==================================================

Keep the MVP performant.

Use:

- Database indexes
- Pagination
- Server-side filtering where appropriate
- Reasonable API response sizes
- Image optimization
- Next.js optimization

Do not prematurely introduce Redis, Elasticsearch, queues, microservices, etc.

==================================================
27. SEO
==================================================

Public job pages should have proper:

- Page titles
- Meta descriptions
- Open Graph metadata
- Semantic HTML

Job detail pages should be indexable when appropriate.

Private jobs should not be publicly indexable.

==================================================
28. UI DESIGN
==================================================

Create a professional hiring marketplace.

The design should communicate:

- Trust
- Speed
- Professionalism
- Opportunity
- Privacy

Use a consistent design system.

Do not overuse animations.

Prioritize usability over visual effects.

Mobile responsiveness is required.

==================================================
29. WHAT NOT TO BUILD
==================================================

Do NOT implement these in MVP unless specifically requested:

- Payments
- Escrow
- Subscriptions
- Complex chat
- Social network
- AI candidate matching
- AI resume generation
- Job scraping
- Automated job aggregation
- Complex recommendation engine
- Video interviews
- Background checks
- Advanced analytics
- Cryptocurrency
- Microservices

Keep extension points where appropriate, but don't build them.

==================================================
30. DEVELOPMENT PROCESS
==================================================

Do NOT generate the entire application blindly.

Work in milestones.

Milestone 1:
Project infrastructure
Frontend
Backend
PostgreSQL
Prisma
Environment configuration
Basic deployment configuration

Milestone 2:
Authentication
Users
Roles
Authorization

Milestone 3:
Companies
Candidate profiles

Milestone 4:
Jobs
Job search
Job details
Job management

Milestone 5:
Applications
Candidate dashboard
Employer dashboard

Milestone 6:
Private opportunities
Invitations

Milestone 7:
Admin
Notifications
Polishing
Security
Testing

Milestone 8:
Production deployment preparation

After each milestone:

1. Run TypeScript checks
2. Run lint
3. Run tests
4. Run build
5. Fix all errors
6. Review security
7. Update documentation
8. Verify the user flow

Do not move forward with broken builds.

==================================================
31. GIT
==================================================

Use logical commits.

Examples:

feat(auth): implement authentication
feat(jobs): implement job management
feat(applications): implement applications
feat(invitations): implement private invitations
feat(admin): implement admin dashboard

Do not make one enormous commit.

==================================================
32. IMPORTANT ENGINEERING RULES
==================================================

Prefer simple, boring, reliable technology.

Do not add dependencies unless necessary.

Before adding a library, determine whether the functionality can reasonably be implemented with the existing stack.

Avoid:

- any
- duplicated business logic
- huge files
- huge components
- hardcoded URLs
- hardcoded credentials
- direct frontend database access
- fake API implementations
- fake data in production code
- TODOs pretending to be finished functionality

When a feature is incomplete, clearly identify it.

Never claim something works unless you have tested it.

==================================================
33. FIRST ACTION
==================================================

Start by inspecting the repository.

Do NOT immediately write the entire application.

First determine:

1. Existing files
2. Existing code
3. Existing package configuration
4. Existing git configuration
5. Existing environment configuration
6. Whether frontend/backend already exist

Then create:

docs/implementation-plan.md

The implementation plan should contain the exact milestones and files/modules expected for each milestone.

After inspection, begin Milestone 1.

Do not ask unnecessary questions.

If there is a reasonable engineering decision, make it yourself and document it.

==================================================
34. DEFINITION OF DONE
==================================================

The CeonHub MVP is complete only when:

- Frontend builds successfully
- Backend builds successfully
- Database migrations work
- Seed data works
- Authentication works
- Candidate workflow works
- Employer workflow works
- Job posting works
- Job search works
- Applications work
- Private invitations work
- Admin works
- Tests pass
- Production builds pass
- Environment variables are documented
- Docker setup works
- README contains deployment instructions
- No known critical security issues remain

The final application must be deployable without major code changes.You are the lead engineer responsible fo.txt