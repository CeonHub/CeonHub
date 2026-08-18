# CeonHub

A hiring and work marketplace for **immediate hiring, freelance and side-income work,
internships, and private employer–candidate connections**.

> Find work. Hire talent. Connect privately.

This repository contains the MVP: two independent applications (a Next.js site and an
Express API) sharing one PostgreSQL database through Prisma.

---

## Contents

1. [Product overview](#product-overview)
2. [Architecture](#architecture)
3. [Requirements](#requirements)
4. [Installation](#installation)
5. [Environment variables](#environment-variables)
6. [Local development](#local-development)
7. [Database setup](#database-setup)
8. [Database migrations](#database-migrations)
9. [Seed data](#seed-data)
10. [Testing](#testing)
11. [Production build](#production-build)
12. [Deployment](#deployment)
13. [Docker](#docker)
14. [Project layout](#project-layout)
15. [Troubleshooting](#troubleshooting)

---

## Product overview

Three roles share one marketplace.

Candidates and employers **join and sign in with LinkedIn** — there is no password sign-up.
See [Sign in with LinkedIn](#sign-in-with-linkedin), which must be configured before anyone
can use the product.

**Candidates** join with LinkedIn, build a profile (skills, availability, resume), search and
filter jobs, apply, track application status, and receive private invitations from employers.

**Employers** join with LinkedIn, create a company profile, post jobs (as drafts or published),
publish/pause/close them, review applicants and move them through the hiring stages, search
the candidate directory, and invite candidates privately.

**Admins** sign in with a password at `/admin/login` (LinkedIn sign-up cannot create an
admin), review users and jobs, disable or re-enable accounts, hide or close jobs, and read
platform statistics. Every admin status change is recorded in an audit log.

**Private hiring** is the differentiator: a job marked private never appears in public
search, is not listed on the company page, and carries `noindex`. Only candidates the
employer invites can open it or apply to it. Accepting an invitation files an application,
so the candidate appears in the employer's normal applicant list.

Not in this MVP (deliberately): payments, escrow, subscriptions, chat, social features, AI
matching, job scraping, video interviews, background checks, advanced analytics.

---

## Architecture

```
/                     repo root — convenience scripts only, no dependencies
  /backend            Node + TypeScript + Express 5 + Prisma 7  → PostgreSQL
  /frontend           Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
  /docs               architecture.md · api.md · deployment.md · implementation-plan.md
  docker-compose.yml  postgres + backend + frontend
```

* The frontend **never** connects to PostgreSQL. Its only contact point with data is the
  REST API at `NEXT_PUBLIC_API_URL`.
* Public pages (`/`, `/jobs`, `/jobs/[id]`, `/companies`, …) are rendered on the server for
  SEO. Dashboard pages run in the browser and authenticate with the session cookie.
* Authentication is a JWT in an **httpOnly** cookie. The browser never reads the token, and
  the frontend never sees `JWT_SECRET`.
* Authorization is enforced by the API on every request; the frontend's route guards are a
  user-experience convenience only.

Details: [docs/architecture.md](docs/architecture.md) · API reference:
[docs/api.md](docs/api.md).

---

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | 20.19+, 22.12+ or 24+ (Prisma 7 requirement) |
| npm | 10+ |
| PostgreSQL | 14 or newer — or none at all, using `npm run db:local` (see below) |
| Docker | optional — only for the Compose workflow |

---

## Installation

```bash
git clone <your-repository-url> ceonhub
cd ceonhub
npm install          # installs both apps (root postinstall) and generates the Prisma client
```

The root `package.json` has no dependencies of its own; `npm install` runs
`npm install` inside `backend/` and `frontend/` in turn.

Then create the two environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Generate a real `JWT_SECRET` for `backend/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## Environment variables

### Backend (`backend/.env`)

Every variable is validated at startup by `backend/src/config/env.ts`; the process refuses
to start with an invalid configuration.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `development` \| `test` \| `production` |
| `PORT` | no | `4000` | Port the API listens on |
| `DATABASE_URL` | **yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **yes** | — | Signing key, minimum 32 characters |
| `JWT_EXPIRES_IN_DAYS` | no | `7` | Session lifetime |
| `FRONTEND_URL` | no | `http://localhost:3000` | Used in links inside emails |
| `CORS_ORIGIN` | no | `http://localhost:3000` | Comma-separated list of allowed browser origins |
| `API_URL` | no | `http://localhost:4000` | Public URL of the API, used to build file URLs |
| `COOKIE_NAME` | no | `ceonhub_token` | Name of the session cookie |
| `COOKIE_DOMAIN` | no | — | Set only when the API and site share a parent domain |
| `COOKIE_SAMESITE` | no | `lax` in dev, `none` in production | `lax` \| `strict` \| `none` |
| `LINKEDIN_CLIENT_ID` | **yes** | — | Without it no candidate or employer can sign in |
| `LINKEDIN_CLIENT_SECRET` | **yes** | — | LinkedIn app client secret |
| `LINKEDIN_CALLBACK_URL` | no | `<API_URL>/api/auth/linkedin/callback` | Must match a Redirect URL registered on the LinkedIn app |
| `STORAGE_DRIVER` | no | `local` | `local` (disk, development) \| `cloudinary` (production — see [deployment.md](docs/deployment.md#3-file-storage-cloudinary)) |
| `STORAGE_LOCAL_DIR` | no | `storage` | Upload directory, relative to `backend/`. Local driver only |
| `MAX_UPLOAD_MB` | no | `5` | Maximum resume size. Cloudinary's free plan rejects raw files over 10 MB |
| `CLOUDINARY_URL` | with `cloudinary` | — | `cloudinary://<api_key>:<api_secret>@<cloud_name>`, copied from the Cloudinary dashboard |
| `CLOUDINARY_CLOUD_NAME` | with `cloudinary` | — | Alternative to `CLOUDINARY_URL`; set all three together |
| `CLOUDINARY_API_KEY` | with `cloudinary` | — | Alternative to `CLOUDINARY_URL` |
| `CLOUDINARY_API_SECRET` | with `cloudinary` | — | Alternative to `CLOUDINARY_URL`. Never expose it to the browser |
| `CLOUDINARY_FOLDER` | no | `ceonhub` | Top-level folder, so one account can host staging and production |
| `EMAIL_DRIVER` | no | `console` | `console` (log the message) \| `noop` (send nothing) |
| `EMAIL_FROM` | no | `CeonHub <no-reply@ceonhub.local>` | From header used by drivers |
| `RATE_LIMIT_WINDOW_MINUTES` | no | `15` | Rate-limit window |
| `RATE_LIMIT_MAX` | no | `300` | Requests per window per IP for `/api/*` |
| `AUTH_RATE_LIMIT_MAX` | no | `20` | Requests per window per IP for login/register/password |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | **yes** in production | `http://localhost:4000` | Base URL of the API, no trailing slash |
| `NEXT_PUBLIC_SITE_URL` | no | `http://localhost:3000` | Absolute site URL for SEO metadata and the sitemap |

`NEXT_PUBLIC_*` values are inlined into the browser bundle **at build time** — never put a
secret in one, and remember to rebuild after changing them.

---

## Local development

Start PostgreSQL (see [Database setup](#database-setup)), then:

```bash
npm run dev
```

This runs both dev servers with prefixed output:

* API — <http://localhost:4000> (health check at `/health`)
* Web — <http://localhost:3000>

You can also run them separately:

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

Other root commands: `npm run build`, `npm run test`, `npm run lint`, `npm run typecheck` —
each runs in both apps and stops at the first failure.

---

## Sign in with LinkedIn

**Required.** Candidates and employers join and sign in **only** with LinkedIn, using
**Sign In with LinkedIn using OpenID Connect**. There is no password sign-up: no
`POST /api/auth/register` endpoint, and no email form on `/register`.

> Until `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are set, **nobody can create an
> account or sign in** except administrators. The sign-in pages say so plainly instead of
> showing a button that cannot work.

Administrators are the exception: LinkedIn sign-up only ever creates candidates and
employers, so admin accounts keep a password and sign in at **`/admin/login`**, which is
deliberately not linked from the navigation or the public sign-in page.

### Setting it up

1. Go to <https://www.linkedin.com/developers/apps> and **Create app**. LinkedIn requires
   the app to be associated with a LinkedIn **Company Page**; create one first if you do
   not have it, and verify the app from the page (LinkedIn shows a verification link to
   open as a page admin).
2. Open the app's **Products** tab and request **Sign In with LinkedIn using OpenID
   Connect**. It is normally granted immediately. This is what grants the `openid`,
   `profile` and `email` scopes — without it, LinkedIn answers the sign-in request with
   `invalid scope`.
3. Open the **Auth** tab and add your callback under **Authorized redirect URLs**:

   | Environment | Redirect URL |
   | --- | --- |
   | Production | `https://api.your-domain.com/api/auth/linkedin/callback` |
   | Local | `http://localhost:4000/api/auth/linkedin/callback` |

   It must match `LINKEDIN_CALLBACK_URL` **exactly** — LinkedIn rejects anything else with
   `Redirect_uri doesn't match`. LinkedIn's documentation specifies HTTPS URLs; if a plain
   `http://localhost` entry is refused for your app, put an HTTPS tunnel
   (`cloudflared tunnel --url http://localhost:4000`, ngrok, or similar) in front of the API
   and register that URL instead, setting `LINKEDIN_CALLBACK_URL` and `API_URL` to match.
4. Copy the **Client ID** and **Client Secret** from the same tab into `backend/.env`:

   ```ini
   LINKEDIN_CLIENT_ID=your-client-id
   LINKEDIN_CLIENT_SECRET=your-client-secret
   ```

5. Restart the API. `GET /api/auth/providers` should now report
   `{"linkedin":true}`, and the buttons appear on `/login` and `/register`.

### How the flow behaves

* **Signing up**: the sign-up page sends the chosen role (candidate or employer) with the
  request, so the account is created as the right type. Someone who starts from the
  *sign-in* page and has no account yet is sent to `/register` to pick a role first —
  CeonHub never guesses.
* **Existing accounts**: if the LinkedIn email matches an existing CeonHub account **and
  LinkedIn reports it as verified**, the two are linked. If the address is unverified, the
  request is refused rather than allowing a takeover. This is how an administrator can also
  use LinkedIn to reach the admin console.
* **No email**: LinkedIn documents `email` as optional. If it is withheld, CeonHub asks the
  person to sign up with an email address instead.
* **Disabled accounts** stay locked out through LinkedIn exactly as through a password.

## Database setup

Pick whichever suits you — all three end up at the same `DATABASE_URL`
(`postgresql://ceonhub:ceonhub@localhost:5432/ceonhub?schema=public`), which is the default
in `.env.example`.

**A. Nothing to install** — a real PostgreSQL, run from `backend/.localdb`:

```bash
npm --prefix backend run db:local     # leave running; Ctrl+C stops it
```

On first run it downloads the PostgreSQL binaries for your platform (~100 MB, once),
creates the `ceonhub` and `ceonhub_test` databases and starts serving on port 5432. No
admin rights, no Docker, no system service. `npm run db:local -- --reset` starts over from
an empty cluster.

This is a **development** convenience: `embedded-postgres` is a devDependency, so
`npm ci --omit=dev` and the Docker image never install it. Deployed environments point
`DATABASE_URL` at a managed database instead — see [docs/deployment.md](docs/deployment.md).

**B. With Docker** (only PostgreSQL; the apps run on the host):

```bash
docker compose up -d db
```

**C. With an existing PostgreSQL**, create a database and a user and set `DATABASE_URL`
accordingly:

```sql
CREATE USER ceonhub WITH PASSWORD 'ceonhub';
CREATE DATABASE ceonhub OWNER ceonhub;
CREATE DATABASE ceonhub_test OWNER ceonhub;  -- for the test suite
```

Prisma 7 reads the connection string from `backend/prisma.config.ts` (CLI) and from the
driver adapter in `backend/src/database/prisma.ts` (application) — not from
`schema.prisma`.

---

## Database migrations

```bash
npm run db:migrate     # development: create and apply a migration
npm run db:deploy      # production: apply existing migrations
npm run db:reset       # drop, re-migrate and re-seed (development only)
npm run db:studio      # Prisma Studio
```

Migrations live in `backend/prisma/migrations/` and are committed to the repository.

---

## Seed data

```bash
npm run db:seed
```

Creates a realistic demo dataset — **all details are invented, no real people or
companies**:

* 1 admin, 2 employers, 2 companies, 5 candidates
* 10 jobs (published, one draft, one private) across immediate-start, freelance,
  side-income and internship categories
* 6 applications in different stages, 3 private invitations

Only one seeded account can be signed into:

| Role | Email | How |
| --- | --- | --- |
| Admin | `admin@ceonhub.example` / `Password123!` | `/admin/login` |
| Employers, candidates | `maria.employer@…`, `ana.candidate@…`, … | **cannot sign in** |

The demo candidates and employers have no password, exactly like real ones — CeonHub
accounts are created through LinkedIn. Their data fills the public site and the admin
console; to walk the candidate or employer journey, sign in with your own LinkedIn account.

The seed **clears the tables it owns** before inserting, so it can be re-run. Do not run it
against a production database.

Inside a container the compiled version is used instead: `npm run db:seed:prod`.

---

## Testing

The suite is a set of integration tests (Vitest + Supertest) that run against a **real
PostgreSQL database**, exercising the API through HTTP exactly as the frontend does.

Create `backend/.env.test` pointing at a **separate** database — the suite truncates every
table between tests. (`npm run db:local` already creates `ceonhub_test` for you.)

```ini
NODE_ENV=test
DATABASE_URL=postgresql://ceonhub:ceonhub@localhost:5432/ceonhub_test?schema=public
JWT_SECRET=any-long-random-string-at-least-32-characters
EMAIL_DRIVER=noop
STORAGE_LOCAL_DIR=storage-test
```

Then:

```bash
npm run test                      # both apps
npm --prefix backend run test     # backend only
```

Migrations are applied to the test database automatically before the suite runs.

90 tests cover authentication, authorization, company and profile ownership, job
management, public search and its filters, private-job exclusion, applications, invitations
and admin moderation — including the negative cases: candidates cannot create jobs,
employers cannot read another employer's data, candidates cannot edit another candidate's
profile, ordinary users cannot reach admin endpoints, and private jobs are not publicly
searchable.

The frontend has no unit tests; `npm --prefix frontend run test` runs a strict TypeScript
check instead. This is stated plainly rather than padded — the whole authorization surface
lives in the API, which is what the suite covers.

---

## Production build

```bash
npm run build          # backend: prisma generate + tsc → dist/ ; frontend: next build
npm --prefix backend run start
npm --prefix frontend run start
```

The backend compiles to `backend/dist` and starts with `node dist/server.js`. The frontend
uses Next's `standalone` output, which the Docker image relies on.

---

## Deployment

The recommended production setup, in full: [docs/deployment.md](docs/deployment.md).

In short:

| Piece | Where | Notes |
| --- | --- | --- |
| Frontend | Vercel (root directory `frontend`) or any Node host | Set `NEXT_PUBLIC_API_URL` at build time |
| Backend | Render / Railway / Fly.io / any Node host (root directory `backend`) | Build `npm run build`, start `npm start`, release `npm run db:deploy` |
| Database | Any managed PostgreSQL | Set `DATABASE_URL` |

Because the site and the API normally sit on different domains, the session cookie must be
`SameSite=None; Secure` in production (the default when `NODE_ENV=production`), and
`CORS_ORIGIN` must list the exact site origin. Both ends must be HTTPS.

No Kubernetes, no Swarm, no message broker, no Redis.

---

## Docker

```bash
docker compose up --build          # postgres + backend + frontend
docker compose run --rm backend npm run db:seed:prod   # optional demo data
```

* Web: <http://localhost:3000> · API: <http://localhost:4000>
* Migrations run automatically when the backend container starts.
* Uploads are kept in a named volume so they survive restarts.
* The credentials in `docker-compose.yml` are local development placeholders.

---

## Project layout

```
backend/
  prisma/schema.prisma      data model and migrations
  prisma.config.ts          Prisma 7 CLI configuration
  src/
    config/                 validated environment, cookie options
    database/               PrismaClient, seed script
    middleware/             auth, rate limiting, uploads, error handling
    modules/                auth · users · companies · candidates · skills ·
                            jobs · applications · invitations · admin
                            (each: routes → controller → service → schema)
    routes/index.ts         mounts every module under /api
    services/               storage/ and email/ abstractions with local drivers
    utils/                  errors, responses, pagination, tokens, audit log
  tests/                    integration tests

frontend/
  src/app/                  routes (public, candidate, employer, admin)
  src/components/           layout · ui · jobs · applications · invitations · …
  src/lib/                  API client, shared types, formatting helpers
  src/providers/            AuthProvider
```

---

## Troubleshooting

**`Invalid environment configuration` on startup**
The message lists exactly which variables are missing or malformed. Compare with
`backend/.env.example`; `JWT_SECRET` must be at least 32 characters.

**`Invalid prisma.…() invocation` / `Can't reach database server` / `ECONNREFUSED`**
PostgreSQL is not running, or `DATABASE_URL` is wrong. The failing Prisma call is simply the
first line of that request to touch the database — it is not a fault in the query. Start a
database (`npm --prefix backend run db:local`, or `docker compose up -d db`) and try again.

**Frontend shows “Could not reach the CeonHub API”**
The API is not running, or `NEXT_PUBLIC_API_URL` points somewhere else. Remember that this
value is baked in at build time — rebuild after changing it.

**Signed in, but requests still come back 401**
Almost always the cookie. Across different domains the cookie needs
`COOKIE_SAMESITE=none` and HTTPS on both ends, and `CORS_ORIGIN` must contain the exact
site origin (scheme and port included).

**`prisma generate` fails during `npm install`**
Run it directly for the real error: `npm --prefix backend exec prisma generate`. It does not
need a database connection.

**Tests fail with `No DATABASE_URL for tests`**
`backend/.env.test` is missing — see [Testing](#testing).

**`DeprecationWarning: Calling client.query() when the client is already executing a query`**
Emitted by `pg` from inside Prisma's own query compiler on some nested writes. It is a
library-internal warning, not a fault in this codebase, and has no effect on behaviour.

**Port already in use**
Change `PORT` (backend) or run the frontend with `npm --prefix frontend run dev -- -p 3001`.
