# Architecture

How CeonHub is put together, and why. Paired with [api.md](api.md) (the endpoint
reference) and [deployment.md](deployment.md).

---

## 1. Shape of the system

```
      browser
         │  httpOnly session cookie, JSON over HTTPS
         ▼
   ┌───────────────┐        REST (credentials: include)        ┌──────────────┐
   │  Next.js 16   │ ────────────────────────────────────────► │  Express 5   │
   │  frontend     │ ◄──────────────────────────────────────── │  API         │
   └───────────────┘                                           └──────┬───────┘
      server render for public pages                                  │ Prisma 7
      client render for dashboards                                    ▼
                                                              ┌──────────────┐
                                                              │  PostgreSQL  │
                                                              └──────────────┘
```

The frontend has **no database access at all** — no connection string, no ORM, no
credentials. Everything it knows comes from the API, whose base URL is configuration
(`NEXT_PUBLIC_API_URL`), never a hardcoded host.

---

## 2. Backend

### Layering

```
routes  →  controller  →  service  →  prisma
             │
             └── schema (Zod) parsed at the top of the controller
```

| Layer | File | Responsibility |
| --- | --- | --- |
| Route | `*.routes.ts` | Path and middleware wiring only |
| Controller | `*.controller.ts` | Parse input with a Zod schema, call a service, shape the HTTP response |
| Service | `*.service.ts` | Business rules **and authorization**; the only layer that touches Prisma |
| Schema | `*.schema.ts` | Zod objects for bodies and query strings |

Validation happens by calling `schema.parse(req.body)` at the top of the controller rather
than in a middleware. It reads the same, and the parsed result keeps its inferred type all
the way down — no casts, no `any`. A `ZodError` is caught by the central error handler and
turned into a `422 VALIDATION_ERROR` with field-level details.

### Modules

`auth`, `users`, `companies`, `candidates`, `skills`, `jobs`, `applications`,
`invitations`, `admin`. Each owns its routes, controller, service and schemas, and is
mounted in `src/routes/index.ts`. There is one cross-module route by design: `POST
/api/jobs/:id/applications` lives in the jobs router but is handled by the applications
controller, because that URL belongs to the job's URL space.

### Cross-cutting pieces

| Concern | Where |
| --- | --- |
| Environment | `config/env.ts` — one Zod schema, validated at import; the process refuses to start with invalid configuration |
| Cookies | `config/cookies.ts` — one place that decides `secure`, `sameSite`, `domain` and lifetime |
| Errors | `utils/apiError.ts` + `middleware/error.ts` — the only place that writes an error response |
| Responses | `utils/response.ts` — `sendSuccess`, `sendError`, `paginated` |
| Pagination | `utils/pagination.ts` — shared `page`/`pageSize` schema, capped at 50 |
| Audit | `utils/audit.ts` — records admin actions; failures are logged, never thrown |

### Error envelope

Every response uses one of two shapes:

```jsonc
{ "success": true, "data": { … } }

{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request",
                               "details": [{ "field": "email", "message": "…" }] } }
```

Codes: `VALIDATION_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`CONFLICT`, `PAYLOAD_TOO_LARGE`, `RATE_LIMITED`, `INTERNAL_ERROR`. Stack traces are never
returned; in production even the message of an unexpected error is replaced with a generic
one, and the real error is logged server-side.

---

## 3. Authentication and authorization

* Passwords are hashed with **bcrypt** (`bcryptjs`, cost 10; cost 4 in tests). Plain text
  passwords are never stored, logged, or returned.
* Sign-in issues a **JWT** (7 days by default) in an **httpOnly** cookie. JavaScript in the
  browser cannot read it, so a cross-site scripting bug cannot steal the session token.
* `requireAuth` re-reads the user **from the database on every request**. The role inside
  the token is only a hint; a disabled account loses access immediately, without waiting for
  the token to expire.
* `requireRole(...)` gates routes by role. Services check *ownership* — that this employer
  owns this job, that this candidate owns this application — because a role alone is not
  authorization.
* **Candidates and employers exist only through LinkedIn.** There is no password
  registration endpoint, and the LinkedIn flow creates only `CANDIDATE` or `EMPLOYER`
  accounts. **Admins can never be created through the API**; they are made by the seed or
  directly in the database, keep a password, and are the only accounts `POST /api/auth/login`
  accepts (staff page: `/admin/login`).
* Login answers with the same message for an unknown email and a wrong password, and hashes
  a dummy password when the email is unknown so response time does not reveal which accounts
  exist.

### Sign in with LinkedIn (required)

`modules/auth/linkedin.service.ts` implements **Sign In with LinkedIn using OpenID
Connect**, and it is the only way candidates and employers get an account.
`config/env.ts` exposes one `linkedin.enabled` flag and nothing else reads those variables;
when it is false the sign-in pages say the product is unavailable rather than offering a
button that cannot work.

`passwordHash` is therefore nullable, and most accounts have none. Password login and
password change refuse those accounts with an explanation rather than a confusing "wrong
password".

Three details worth knowing:

* **`state` is a signed, 10-minute JWT** containing the chosen role, the return path and a
  nonce, and the same nonce is stored in an httpOnly `SameSite=Lax` cookie. Both must agree
  on the way back, which is what stops a forged callback. The role travels in `state`
  because LinkedIn strips query parameters from registered redirect URLs.
* **Account linking requires a verified email.** LinkedIn returns `email_verified`; without
  it, matching an existing CeonHub account by address would let anyone who can set that
  address on LinkedIn take the account over, so the request is refused instead.
* **A new member must choose a role.** LinkedIn cannot tell CeonHub whether someone is a
  candidate or an employer, so a first-time sign-in that started from the login page is
  redirected to `/register?linkedin=choose-role` rather than guessing.

Adding another provider (Google, GitHub, …) means a second service file of the same shape
plus one entry in `/api/auth/providers`; the session, roles and authorization below it are
untouched.

### What the frontend does and does not do

`AuthGate` redirects signed-out visitors to `/login` and sends users to their own dashboard
if they open the wrong section. That is **presentation only**. Every protected resource is
authorized again by the API, which is the only side that can be trusted.

---

## 4. Data model

Defined in `backend/prisma/schema.prisma`.

```
User ──1:1── CandidateProfile ──*── CandidateSkill ──*── Skill
  │                │  └──*── Resume                        │
  │                └──*── Application ──*── Job ──*── JobSkill
  │                └──*── Invitation ──────*── Job
  ├──1:1── EmployerProfile ──*:1── Company ──1:*── Job
  └──1:*── AuditLog
```

Notes on the design:

* `CandidateProfile` and `EmployerProfile` use `userId` as their **primary key**, so a
  "candidate id" is always a user id and the 1:1 relationship cannot be violated.
* Both profiles are created inside the same transaction as the user, so no account can exist
  without the profile the rest of the app expects.
* `Job.category` is a `String` validated against `utils/categories.ts`, so the list can grow
  without a migration.
* `Job.publishedAt` records when a job **first** went live; pausing and republishing keeps
  the original date and therefore the original ordering in search.
* `Application` and `Invitation` both have a unique constraint on `(jobId, candidateId)`:
  one application and one invitation per candidate per job.
* Indexes exist for the queries that actually run: `(status, private, publishedAt)` for
  public search, `(companyId, status)` for the employer console, `(candidateId, createdAt)`
  and `(jobId, status)` for applications.

### Job visibility — the rule that makes private hiring work

A job is in the **public index** only when `status = PUBLISHED`, `private = false`, and it
has not expired. Beyond that index, a job detail can also be opened by:

| Who | When |
| --- | --- |
| The owning employer | Always |
| An admin | Always |
| A candidate | If they were invited to it, or already applied to it |

Anything else is answered with `404`, not `403` — a private job does not reveal that it
exists. Private job pages additionally carry `noindex, nofollow`.

---

## 5. Frontend

### Rendering strategy

| Page type | Rendering | Why |
| --- | --- | --- |
| `/`, `/jobs`, `/jobs/[id]`, `/companies`, `/companies/[id]`, `/about`, `/how-it-works` | Server components | Real HTML and metadata for search engines; no client JavaScript needed to read a job |
| `/candidate/*`, `/employer/*`, `/admin/*` | Client components | They need the browser's session cookie and are highly interactive |

Job and company detail fetches use `revalidate`, so repeated views are served from Next's
data cache. The homepage renders per request (`dynamic = "force-dynamic"`) with cached data
fetches — prerendering it at build time would bake in whatever the API returned during the
build, including nothing at all if the API was not reachable yet.

### Data access

`src/lib/api.ts` is the single place the frontend talks to the API: it sends
`credentials: "include"`, unwraps the success envelope, and turns any failure into an
`ApiError` carrying the code and per-field messages. `src/lib/useApiQuery.ts` wraps it for
client pages with `data` / `loading` / `error` / `reload`, which is what makes the loading,
empty and error states consistent everywhere.

Types in `src/lib/types.ts` are maintained by hand to keep the build simple — there is no
codegen step. They mirror the service DTOs; update both sides together.

### Components

Small and composable: `ui/` (Button, Input, Select, Textarea, Field, Modal, Badge, Card,
Pagination, SkillsInput, StatCard, LoadingState, EmptyState, ErrorState),
`layout/` (Navbar, Footer, Container, PageHeader, Logo), and feature folders for jobs,
applications, invitations, candidates, companies and the home page.

Forms initialise their state from props and are re-mounted with a `key` when the saved
record changes, rather than synchronising with an effect.

### Design system

Tokens live in `src/app/globals.css` (Tailwind CSS 4's `@theme`): an `ink` neutral scale, a
`brand` blue for actions, and three semantic colours — `available` (green), `immediate`
(amber) and `danger` (red) — which carry meaning in this marketplace rather than decoration.
No web fonts are loaded: the system stack renders instantly and removes a build-time network
dependency.

---

## 6. Storage

`services/storage/` defines a `StorageService` interface (`save`, `delete`, `urlFor`) and
ships one driver, `LocalStorageService`, which writes to `STORAGE_LOCAL_DIR` and serves
files from `/uploads`. Business logic depends only on the interface.

**Adding an S3-compatible driver** (S3, Cloudflare R2, Supabase Storage, …):

1. `npm --prefix backend install @aws-sdk/client-s3`
2. Create `backend/src/services/storage/s3.storage.ts` implementing `StorageService`.
3. Add `"s3"` to the `STORAGE_DRIVER` enum in `config/env.ts`, along with the bucket,
   region, endpoint and credential variables the driver needs.
4. Add one branch to the `switch` in `services/storage/index.ts`.

Nothing else changes: no controller, service or frontend code refers to the local driver.
The `/uploads` static route only mounts when the local driver is active.

Local-driver caveat: files live on the server's disk, so a container needs a mounted volume
(Compose does this) and multiple instances do not share uploads. That is exactly why the
abstraction exists.

---

## 7. Email

`services/email/` defines an `EmailService` interface and ships two drivers: `console`
(prints the message to the server log — the development default) and `noop` (sends nothing;
used by the test suite). The four MVP notifications live in `templates.ts`: welcome,
application received, application status changed, private invitation.

`sendEmail()` is deliberately fire-and-forget: a failed notification is logged and never
breaks the request that triggered it.

**Adding a real provider**: implement `EmailService` in a new file, add the driver name to
the `EMAIL_DRIVER` enum in `config/env.ts` with whatever credentials it needs, and add a
branch to the factory in `services/email/index.ts`. No business logic changes.

Until such a driver is added, **CeonHub does not send real email** — with `EMAIL_DRIVER=console`
the messages only appear in the server log.

---

## 8. Security

| Control | Implementation |
| --- | --- |
| Password hashing | bcrypt, never stored or returned in plain text |
| Session | JWT in an httpOnly, `Secure`, `SameSite`-controlled cookie |
| Role escalation | Roles come from the database, never from request input; registration cannot create an admin |
| Ownership checks | In services, for every job, application, invitation, profile and company |
| Input validation | Zod on every body and query string; frontend validation is never trusted |
| Rate limiting | `express-rate-limit`: 300 requests / 15 min per IP on `/api`, 20 on credential endpoints |
| CORS | Explicit origin allowlist with credentials; unknown origins are rejected |
| Security headers | `helmet` (with `crossOriginResourcePolicy: cross-origin` so the site can load uploaded files) |
| Request size | 100 KB JSON bodies; uploads capped by `MAX_UPLOAD_MB` and restricted by MIME type |
| Error handling | Central handler; no stack traces, no internal messages in production |
| Audit logging | Admin status changes recorded with actor, entity and before/after values |
| Data exposure | `passwordHash` is never selected; candidate emails are visible only to the candidate, to admins, and to employers whose job they applied to |

Known limitation: the rate limiter keeps its counters in memory, so a multi-instance
deployment needs a shared store (documented in [deployment.md](deployment.md)).

---

## 9. Performance

Server-side filtering and pagination on every list (page size capped at 50); database
indexes for the real query patterns; `revalidate` caching on public pages; Next.js
standalone output for a small production image. Keyword search uses `ILIKE` containment,
which is right for MVP data volumes — the point at which it stops being right is the point
to add a PostgreSQL full-text index, not a search cluster.

Deliberately absent: Redis, Elasticsearch, queues, microservices.
