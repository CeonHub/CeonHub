# API reference

Base URL: `NEXT_PUBLIC_API_URL` on the frontend, `API_URL` on the backend — locally
`http://localhost:4000`. Every application route is under `/api`.

This document describes the endpoints that exist. Anything not listed here is not
implemented.

---

## Conventions

**Responses.** Two envelopes, always:

```jsonc
{ "success": true,  "data": { … } }
{ "success": false, "error": { "code": "…", "message": "…", "details": [ … ] } }
```

**Error codes and status.**

| Code | Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 422 | Input failed schema validation; `details` lists `{ field, message }` |
| `BAD_REQUEST` | 400 | Valid shape, invalid request (e.g. applying to a closed job) |
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Signed in, but not allowed (or the account is disabled) |
| `NOT_FOUND` | 404 | Missing — also returned instead of 403 where existence itself is private |
| `CONFLICT` | 409 | Duplicate or state conflict |
| `PAYLOAD_TOO_LARGE` | 413 | Body or upload too large |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

**Authentication.** A JWT in the httpOnly cookie `ceonhub_token`, set by register and login.
Browser callers must send `credentials: "include"`; the origin must be in `CORS_ORIGIN`.

**Pagination.** List endpoints accept `page` (default 1) and `pageSize` (default 20,
maximum 50) and return:

```jsonc
{ "items": [ … ], "meta": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 } }
```

**Roles.** `CANDIDATE`, `EMPLOYER`, `ADMIN`. The "Access" column below states who may call
each endpoint; ownership is checked in addition to the role.

---

## Health

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | public | `{ status: "ok", uptime }`. Not under `/api`; for platform health checks. |

---

## Authentication — `/api/auth`

There is **no password registration endpoint**. Candidates and employers are created by the
LinkedIn flow below; `POST /api/auth/register` does not exist and answers `404`.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | admins only | Password sign-in for staff. Rate limited. |
| `POST` | `/api/auth/logout` | public | Clear the session cookie. |
| `GET` | `/api/auth/me` | any signed-in user | The current user. |
| `GET` | `/api/auth/providers` | public | Which social sign-in providers are configured. |
| `GET` | `/api/auth/linkedin` | public | **Redirects** to LinkedIn to start sign-in. |
| `GET` | `/api/auth/linkedin/callback` | public | LinkedIn's return URL. **Redirects** back to the site. |

**`POST /api/auth/login`** — `{ "email", "password" }` → `200 { "user": SessionUser }`.

Reserved for `ADMIN` accounts, which LinkedIn sign-up cannot create. A candidate or
employer address is answered with `400` and a message pointing at LinkedIn, even if a
password hash happens to exist on the record. `401 UNAUTHORIZED` for both an unknown email
and a wrong password (identical message); `403 FORBIDDEN` if the account is disabled.

**`SessionUser`**

```jsonc
{
  "id": "…", "email": "…", "role": "CANDIDATE", "status": "ACTIVE",
  "createdAt": "2026-08-14T…", "name": "Ana Ferreira",
  "candidate": { "headline": "…", "availability": "AVAILABLE_NOW",
                 "profileVisibility": "PUBLIC", "profileCompletion": 67 },
  "employer": null
}
```

`candidate` is null for employers and admins; `employer` (with its `company`, or `null`
before one is created) is null for candidates and admins. `hasPassword` is false for
accounts created through LinkedIn, and `linkedinConnected` is true once an account is
linked.

### Sign in with LinkedIn

These two endpoints are **browser navigations, not API calls** — they answer with `302`
redirects rather than the JSON envelope, because the browser is mid-flow.

**`GET /api/auth/providers`** → `{ "providers": { "linkedin": false } }`. The sign-in pages
use this to decide whether to show the button. `linkedin` is true only when both
`LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are configured.

**`GET /api/auth/linkedin?role=CANDIDATE&next=/candidate/dashboard`**
Both parameters are optional. Redirects to
`https://www.linkedin.com/oauth/v2/authorization` with `scope=openid profile email` and a
signed, 10-minute `state` carrying `role`, `next` and a nonce; the nonce is also written to
the httpOnly `ceonhub_oauth_state` cookie. `role` and `next` travel inside `state` because
LinkedIn ignores query parameters on the registered redirect URL. `next` is accepted only
as a same-site path. Returns `503` when the feature is not configured.

**`GET /api/auth/linkedin/callback?code=…&state=…`**
Verifies the state against the cookie, exchanges the code for an access token, reads
`https://api.linkedin.com/v2/userinfo`, then redirects:

| Outcome | Redirect |
| --- | --- |
| Signed in | `FRONTEND_URL` + `next`, or the role's dashboard, with the session cookie set |
| New member, no role chosen | `FRONTEND_URL/register?linkedin=choose-role` |
| Cancelled at LinkedIn, or any failure | `FRONTEND_URL/login?error=<message>` |

Account matching: an account already linked to the LinkedIn subject signs straight in; an
existing account with the same **verified** email is linked to it; an unverified match is
refused with `409`; otherwise a new account is created with the chosen role.

---

## Users — `/api/users`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `PATCH` | `/api/users/me` | candidate, employer | Update display name; employers may also set `title`. |
| `PATCH` | `/api/users/me/password` | any signed-in user | Change password. Rate limited. |

`PATCH /api/users/me/password` takes `{ "currentPassword", "newPassword" }`, returns
`{ "passwordChanged": true }` and **clears the session cookie** — the user must sign in
again. `400` if the current password is wrong.

---

## Companies — `/api/companies`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/companies` | public | Companies with at least one published public job. Query: `q`, `country`, `page`, `pageSize`. |
| `GET` | `/api/companies/mine` | employer | The signed-in employer's company, or `null`. |
| `POST` | `/api/companies` | employer | Create the company and link it to the employer. `409` if they already have one. |
| `PATCH` | `/api/companies/:id` | employer (own), admin | Update. `403` for another employer's company. |
| `GET` | `/api/companies/:id` | public | By **id or slug**. Includes `openJobCount`. |

Body fields: `name` (required, 2–120), `description`, `website`, `logoUrl`, `location`,
`country`. URLs must start with `http://` or `https://`. A unique `slug` is generated from
the name (`acme`, `acme-2`, …).

---

## Candidates — `/api/candidates`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/candidates` | employer, admin | Candidate directory. |
| `GET` | `/api/candidates/me` | candidate | Own full profile, including email. |
| `PATCH` | `/api/candidates/me` | candidate | Update own profile. |
| `GET` | `/api/candidates/me/resumes` | candidate | Uploaded resumes, newest first. |
| `POST` | `/api/candidates/me/resume` | candidate | Upload a resume (multipart). |
| `GET` | `/api/candidates/:id` | signed-in | See visibility rules below. |
| `PATCH` | `/api/candidates/:id` | self, admin | `403` for anyone else. |

**Directory query:** `q` (name, headline, bio), `availability`, `country`,
`employmentType`, `skill` (slug), `page`, `pageSize`. Only `PUBLIC` profiles of active
users are listed (admins see all). Available-now candidates come first.

**Visibility.** A candidate always sees their own profile; admins see any. Employers see a
profile only if it is `PUBLIC` and the account is active — otherwise `404`. The email
address is included **only** for the candidate themselves and for admins.

**Profile fields:** `name`, `headline`, `bio`, `location`, `country`, `availability`
(`AVAILABLE_NOW` \| `AVAILABLE_SOON` \| `NOT_AVAILABLE`), `desiredEmployment`,
`portfolioUrl`, `profileVisibility` (`PUBLIC` \| `PRIVATE`), `skills` (array of names, max
20 — unknown skills are created, matching is case-insensitive by slug).

**`POST /api/candidates/me/resume`** — `multipart/form-data` with the file in the field
`file`. PDF, Word or plain text, up to `MAX_UPLOAD_MB` (default 5 MB). `201` with
`{ "resume": { id, fileName, url, mimeType, size, createdAt } }`; the profile's `resumeUrl`
is updated to the new file. `400` for an unsupported type, `413` if too large.

---

## Skills — `/api/skills`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/skills` | public | Skill lookup for the pickers. Query: `q`, `limit` (max 50). |

---

## Jobs — `/api/jobs`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/jobs` | public | Public job search. |
| `GET` | `/api/jobs/meta` | public | `{ categories, employmentTypes }` for forms and filters. |
| `GET` | `/api/jobs/mine` | employer | Every job of the employer's company, any status. Query: `status`, `q`. |
| `POST` | `/api/jobs` | employer | Create a job. |
| `GET` | `/api/jobs/:id` | public / signed-in | Job detail; the answer depends on the caller. |
| `PATCH` | `/api/jobs/:id` | employer (own), admin | Update fields and/or status. |
| `DELETE` | `/api/jobs/:id` | employer (own), admin | Delete. `409` if the job has applications. |
| `POST` | `/api/jobs/:id/applications` | candidate | Apply — see [Applications](#applications--apiapplications). |

**Search query parameters:** `q` (title, description, company name), `location`, `remote`,
`employmentType`, `category`, `immediateHire`, `freelance`, `internship`, `sideIncome`,
`companyId`, `skill` (slug), `page`, `pageSize`. Booleans are `true`/`false`.

**Only published, non-private, unexpired jobs are returned.** Immediate-start roles are
listed first, then newest published.

**Job detail visibility.** Public jobs are visible to everyone. Beyond that, the owning
employer and admins always see the job, and a candidate can see it if they were invited to
it or have already applied. Everyone else gets `404` — a private job never reveals that it
exists. For candidates the response includes `myApplication` (`{ id, status, createdAt }`
or `null`).

**Create/update body**

```jsonc
{
  "title": "Warehouse Assistant",          // required, 4–140
  "description": "…",                      // required, 30–20000
  "employmentType": "FULL_TIME",           // FULL_TIME | PART_TIME | CONTRACT |
                                           // FREELANCE | INTERNSHIP | TEMPORARY
  "category": "Logistics & Delivery",      // from /api/jobs/meta
  "location": "Rotterdam", "remote": false,
  "compensation": "€2,400–2,700 / month", "currency": "EUR",
  "immediateHire": true, "private": false,
  "internship": false, "freelance": false, "sideIncome": false,
  "expiresAt": "2026-12-31T00:00:00.000Z", // optional, ISO 8601
  "skills": ["Forklift"],                  // optional, max 20
  "status": "DRAFT"                        // create: DRAFT (default) or PUBLISHED
}
```

On update, `status` may be `DRAFT`, `PUBLISHED`, `PAUSED` or `CLOSED`. `HIDDEN` is
admin-only, and a hidden job cannot be edited by its employer (`403`). `publishedAt` is
stamped on the first publish and preserved afterwards. An employer without a company gets
`400` ("Create your company profile before posting jobs").

---

## Applications — `/api/applications`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/jobs/:id/applications` | candidate | Apply to a job. |
| `GET` | `/api/applications` | signed-in | Scoped list. Query: `status`, `jobId`, `page`, `pageSize`. |
| `GET` | `/api/applications/:id` | participants, admin | One application. |
| `PATCH` | `/api/applications/:id` | employer (own job), candidate (own), admin | Change status. |

**Scope.** Candidates see their own applications; employers see applications to their
company's jobs; admins see everything. The `candidate` object (including email and resume
URL) is present only for employers and admins.

**Applying.** Body: `{ "coverLetter": "…" }` (optional, max 5000). `201` on success.
`409` if already applied, `400` if the job is not published or has expired, `404` if the job
is private and the candidate was not invited.

**Status.** `SUBMITTED`, `REVIEWING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `HIRED`,
`REJECTED`, `WITHDRAWN`. Employers may set any except `WITHDRAWN`; candidates may set only
`WITHDRAWN`. A withdrawn application cannot be moved again (`409`). Employer-driven changes
send the candidate a notification email.

---

## Invitations — `/api/invitations`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/invitations` | employer | Invite a candidate to one of your jobs. |
| `GET` | `/api/invitations` | signed-in | Scoped list. Query: `status`, `jobId`, `page`, `pageSize`. |
| `GET` | `/api/invitations/:id` | participants, admin | One invitation. |
| `PATCH` | `/api/invitations/:id` | candidate (invited) | Accept or decline. |

**Create.** `{ "jobId", "candidateId", "message" }` (message optional, max 2000). `404` if
the job belongs to another company or the candidate does not exist; `409` if that candidate
was already invited to that job; `400` if the job is closed or hidden. The candidate
receives a notification email.

**Answer.** `{ "status": "ACCEPTED" | "DECLINED" }`. Only the invited candidate may answer,
and only once (`409` afterwards). **Accepting also files an application** to that job (if
the job is published and no application exists yet), so the candidate appears in the
employer's applicant list.

**Scope.** Candidates see invitations addressed to them; employers see invitations for
their company's jobs; admins see everything.

---

## Admin — `/api/admin`

Every route requires the `ADMIN` role; others get `401` (signed out) or `403`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/admin/stats` | Platform statistics. |
| `GET` | `/api/admin/users` | Users. Query: `q`, `role`, `status`, `page`, `pageSize`. |
| `PATCH` | `/api/admin/users/:id/status` | `{ "status": "ACTIVE" \| "DISABLED" }`. |
| `GET` | `/api/admin/jobs` | Jobs of any status. Query: `q`, `status`, `page`, `pageSize`. |
| `PATCH` | `/api/admin/jobs/:id/status` | `{ "status": "PUBLISHED" \| "HIDDEN" \| "CLOSED" }`. |

Disabling an account revokes its access on the very next request. An admin cannot change
the status of their own account (`400`). Both status endpoints write an `AuditLog` entry
with the actor, the entity and the before/after values.

`GET /api/admin/stats` returns:

```jsonc
{ "stats": {
    "users":        { "total": 12, "candidates": 8, "employers": 3, "disabled": 1 },
    "jobs":         { "total": 10, "published": 8, "draft": 1, "hidden": 0, "private": 1 },
    "applications": { "total": 24, "last7Days": 6 },
    "invitations":  { "total": 5, "pending": 2 } } }
```

---

## Files

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/uploads/*` | public | Uploaded files, when `STORAGE_DRIVER=local`. Other drivers serve their own URLs. |

Resume URLs returned by the API are absolute and built from `API_URL`. They are
unguessable (UUID-based) but not access-controlled — treat them as capability URLs.
