# CeonHub — Implementation Plan

This document is written before any application code. It records the inspection results,
the engineering decisions taken (and why), and the exact milestones with the files each
milestone produces.

---

## 1. Repository inspection (before starting)

Performed on the working directory `f:\Site\new`.

| Check | Result |
| --- | --- |
| Existing files | `prompt1.md` only |
| Existing code | none |
| Existing `package.json` / lockfiles | none |
| Existing git repository | none (`git init` performed as part of Milestone 1) |
| Existing environment configuration | none |
| `frontend/` or `backend/` present | no |
| Node.js | v22.15.0 |
| npm | 10.9.2 |
| git | 2.49.0 |
| Docker | **not installed on this machine** |
| PostgreSQL (local service / port 5432) | **not installed / not running** |

Consequences of the last two rows are handled in section 4 ("Verification strategy").

---

## 2. Decisions made (no questions asked, per the brief)

| # | Decision | Reason |
| --- | --- | --- |
| D1 | The working directory **is** the `ceonhub` repository root. It contains `frontend/`, `backend/`, `docs/`. No nested `ceonhub/` folder is created. | Avoids a redundant directory level; the repo *is* CeonHub. |
| D2 | **No npm workspaces.** `frontend/` and `backend/` are fully independent npm projects, each with its own `package.json` and lockfile. The root `package.json` only holds convenience scripts. | Deployment simplicity is a stated major requirement. Vercel (root = `frontend`) and Render/Railway/Fly (root = `backend`) work with zero extra configuration, and each `Dockerfile` stays trivial. Workspace hoisting complicates both. |
| D3 | Root scripts are driven by a small dependency-free Node script (`scripts/run.mjs`) instead of `concurrently`/`npm-run-all`. | ~60 lines of `child_process` replaces a dependency; the root has **zero** `node_modules`. |
| D4 | Auth = **JWT in an httpOnly cookie**, signed with `JWT_SECRET`, 7-day expiry, no refresh token. | Simplest thing that is genuinely secure. Refresh-token rotation is a post-MVP concern. |
| D5 | Cookie is `SameSite=Lax` in development (same site, `localhost`) and `SameSite=None; Secure` in production. | Production frontend and backend live on different domains (Vercel + Render), which requires `SameSite=None`. Driven by `NODE_ENV`/`COOKIE_SAMESITE`. |
| D6 | Frontend renders **public pages on the server** (SEO) and **authenticated pages on the client** (via a `fetch` wrapper with `credentials: "include"`). | Public job/company pages need real metadata and indexable HTML. Dashboard pages need the browser's cookie; server-side forwarding of a cross-domain cookie adds complexity with no MVP benefit. |
| D7 | Route protection in the frontend is a **UX guard only** (redirect on 401). All real authorization is enforced by the backend. | The frontend must never hold `JWT_SECRET`. Never trust the client. |
| D8 | Versions: Next 16 / React 19 / Tailwind 4 / Express 5 / Prisma 7 / Zod 4 / Vitest 4, but **TypeScript 5.9** and **ESLint 9**. | Current stable majors, except TypeScript 7 and ESLint 10, which `typescript-eslint` does not yet support (`typescript: ">=4.8.4 <6.1.0"`). Being one major behind on the linting toolchain is worth a working lint. |
| D9 | Storage and email are **interfaces with a local/console driver**. Cloud drivers are *not* written. | The brief asks for an abstraction plus a documented switch, not an S3 integration. Unwritten drivers are documented as extension points, never as existing features. |
| D10 | Rate limiting uses `express-rate-limit`'s in-memory store. | No Redis in the MVP. Documented limitation: a multi-instance deployment needs a shared store. |
| D11 | Tests are backend integration tests (Vitest + Supertest) against a **real PostgreSQL** database. There are no frontend unit tests; the frontend's `test` script runs a strict typecheck. | The whole risk surface (authn, authz, privacy of private jobs) is in the API. Stated honestly rather than padded with token frontend tests. |

---

## 3. Architecture

```
/                     repo root — convenience scripts only, no dependencies
  /backend            Node + TypeScript + Express 5 + Prisma 7 REST API
  /frontend           Next.js 16 (App Router) + TypeScript + Tailwind 4
  /docs               architecture.md, api.md, deployment.md, implementation-plan.md
  docker-compose.yml  postgres + backend + frontend
```

The frontend never touches PostgreSQL. Its only backend contact point is
`NEXT_PUBLIC_API_URL`.

### Backend layering (enforced, not aspirational)

```
routes  →  controller  →  service  →  prisma
             ↑ schema (Zod) validated by middleware before the controller runs
```

* **routes** — path + middleware wiring only.
* **controller** — reads validated input, calls a service, shapes the HTTP response.
* **service** — business rules and authorization checks; the only layer that touches Prisma.
* **schema** — Zod objects for body/query/params.

### Backend module layout

```
/backend/src
  /config       env.ts (Zod-validated environment), cookies.ts
  /database     prisma.ts (single PrismaClient), generated client output
  /middleware   auth.ts, validate.ts, error.ts, rateLimit.ts, upload.ts
  /modules      auth, users, companies, candidates, jobs, applications, invitations, admin
  /routes       index.ts (mounts every module router under /api)
  /services     storage/ (interface + local driver), email/ (interface + console driver)
  /utils        apiError.ts, response.ts, password.ts, token.ts, pagination.ts, slug.ts, audit.ts
  app.ts        express app (exported for tests)
  server.ts     listen()
```

---

## 4. Verification strategy (given no Docker and no local PostgreSQL)

The brief requires "never claim something works unless you have tested it". PostgreSQL is
therefore obtained for the build session via the `embedded-postgres` npm package, run from a
scratch directory **outside the repository** on port 5433. Real `prisma migrate deploy`,
real `db:seed` and the real Vitest suite run against it.

This is a build-time verification tool only — it is **not** a project dependency. Developers
use `docker compose up` or any managed PostgreSQL, as documented in the README.

After every milestone: `tsc --noEmit` → `lint` → `test` → `build`, then fix everything before
moving on.

---

## 5. Milestones

### Milestone 1 — Infrastructure

* `package.json`, `scripts/run.mjs`, `.gitignore`, `.editorconfig`, `README.md` (skeleton)
* `backend/`: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`,
  `.env.example`, `Dockerfile`, `.dockerignore`, `src/app.ts` (health route),
  `src/server.ts`, `src/config/env.ts`, `src/database/prisma.ts`
* `backend/prisma/schema.prisma` — the complete schema (all models and enums), so later
  milestones add behaviour rather than migrations-on-top-of-migrations
* `frontend/`: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`,
  `postcss.config.mjs`, `.env.example`, `Dockerfile`, `.dockerignore`,
  `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/env.ts`
* `docker-compose.yml`
* Exit: both apps install, typecheck, lint and build; `/health` responds.

### Milestone 2 — Authentication, users, roles

* `backend/src/utils`: `apiError.ts`, `response.ts`, `password.ts`, `token.ts`
* `backend/src/middleware`: `auth.ts` (`requireAuth`, `optionalAuth`, `requireRole`),
  `validate.ts`, `error.ts`, `rateLimit.ts`
* `backend/src/modules/auth/*` — register, login, logout, me
* `backend/src/modules/users/*` — change password, delete/deactivate own account
* `frontend`: `src/lib/api.ts`, `src/providers/AuthProvider.tsx`, `/login`, `/register`,
  UI primitives (`Button`, `Input`, `Select`, `Textarea`, `Field`, `Alert`)
* Tests: registration, login, logout, `me`, role gating.

### Milestone 3 — Companies and candidate profiles

* `backend/src/modules/companies/*`, `backend/src/modules/candidates/*`
* `backend/src/services/storage/*` + `middleware/upload.ts` + resume upload endpoint
* `frontend`: `/employer/profile`, `/candidate/profile`, `/companies`, `/companies/[id]`,
  `CompanyCard`, `CandidateCard`, skills editor, availability control
* Tests: profile ownership, company ownership, candidate directory visibility rules.

### Milestone 4 — Jobs

* `backend/src/modules/jobs/*` — create/draft/publish/pause/close/edit/delete, public
  search with all nine filters, private-job exclusion, pagination, indexes
* `frontend`: `/jobs`, `/jobs/[id]` (server-rendered + metadata), `/employer/jobs`,
  `/employer/jobs/new`, `/employer/jobs/[id]`, `JobCard`, `JobFilters`, `Pagination`
* Tests: creation authorization, publish transitions, search filters, private jobs absent
  from public search.

### Milestone 5 — Applications and dashboards

* `backend/src/modules/applications/*` — apply, list (role-scoped), status transitions
* `frontend`: `/candidate/dashboard`, `/candidate/applications`, `/candidate/jobs`,
  `/employer/dashboard`, `/employer/applications`, `/employer/jobs/[id]` applicants,
  `ApplicationStatus`
* Tests: duplicate application, applying to a non-published job, cross-employer access,
  status change authorization.

### Milestone 6 — Private invitations

* `backend/src/modules/invitations/*` — send (employer, own job), list (role-scoped),
  accept/decline (candidate only)
* `frontend`: `/employer/candidates`, invite modal, `/employer/invitations`,
  `/candidate/invitations`, `Modal`
* Tests: invitation ownership, accept/decline authorization, duplicate invitation.

### Milestone 7 — Admin, email, security, tests

* `backend/src/modules/admin/*` — users, jobs, status changes, platform stats, audit log
* `backend/src/services/email/*` + `utils/audit.ts`; wire the four MVP emails
* Security pass: helmet, CORS allowlist, body size limits, rate limits, no `passwordHash`
  in any response, centralized error handler without stack traces in production
* `frontend`: `/admin`, `/admin/users`, `/admin/jobs`
* Full test suite green.

### Milestone 8 — Production preparation

* `prisma/seed.ts` with the required demo dataset (1 admin, 2 employers, 2 companies,
  5 candidates, 10 jobs, applications, invitations)
* Public site: `/`, `/about`, `/how-it-works`, SEO metadata, `robots.txt`, `sitemap.ts`
* `README.md`, `docs/architecture.md`, `docs/api.md`, `docs/deployment.md`
* Final: migrate → seed → test → build, both apps, from clean.

---

## 6. What actually changed during implementation

The plan above is the one written before any code. These are the deviations, and why:

| # | Change | Reason |
| --- | --- | --- |
| C1 | **No `middleware/validate.ts`.** Controllers call `schema.parse(req.body)` directly. | Express 5 makes `req.query` read-only, so a validation middleware would have to stash results somewhere untyped and every controller would cast them back. Parsing in the controller keeps Zod's inferred types end to end, with no `any`. `ZodError` is still handled centrally. |
| C2 | **Applications shipped with Milestone 4** rather than 5. | The job detail page needs the apply action to be a real feature. Splitting them would have meant committing a button that does nothing. |
| C3 | **Public `/companies` pages shipped with Milestone 4** rather than 3. | A company page whose "open roles" section could not exist yet would have been a placeholder. |
| C4 | **Milestone 5 and 6 merged into one commit** (dashboards + invitations). | The dashboards display invitations; building them apart would have required temporary stand-ins. |
| C5 | **Added `GET /api/jobs/meta` and `GET /api/skills`.** | The job form and filters need the category list and skill lookup; hardcoding them in the frontend would duplicate backend validation rules. |
| C6 | **Added `PATCH /api/users/me`.** | The employer settings and profile pages need to edit the display name and job title, which live on the role profile. |
| C7 | **Accepting an invitation also files an application.** | Otherwise an accepted invitation goes nowhere and the employer has to track it separately from every other candidate. |
| C8 | **The homepage renders per request** instead of being prerendered. | Caught during verification: building the frontend while the API is unreachable baked an empty homepage into the build output. Data fetches are still cached for five minutes. |
| C9 | **`publishedAt` marks the first publish**, not the latest. | Caught by a test: pausing and republishing was resetting the date, which would have re-sorted old jobs to the top of search. |

## 7. Explicitly out of scope

Payments, escrow, subscriptions, chat, social features, AI matching or resume generation,
job scraping/aggregation, recommendation engines, video interviews, background checks,
advanced analytics, cryptocurrency, microservices. Extension points are left where natural
(storage driver, email driver, job `category`), but nothing above is implemented.
