# Deployment

CeonHub is two ordinary Node applications and one PostgreSQL database. That is the whole
infrastructure: no Kubernetes, no Swarm, no broker, no cache tier.

```
        Vercel  (Hobby)                Render  (free tier)              Neon  (free tier)
   ┌──────────────────────┐         ┌──────────────────────┐         ┌────────────────┐
   │  frontend  (Next.js) │ ──────► │  backend  (Express)  │ ──────► │   PostgreSQL   │
   └──────────────────────┘  HTTPS  └──────────────────────┘         └────────────────┘
```

Resumes go to Cloudinary rather than to disk, so no host needs a persistent volume.

Work through the sections in order. Each one produces a value the next needs, and the
frontend bakes the API URL in at build time, so the API must exist before it:

**GitHub → Neon → Cloudinary → LinkedIn → Render → Vercel → close the loop → domain**

### A stack that is free and needs no card

Verified August 2026 — free tiers move, so re-check before relying on this.

| Piece | Service | Free allowance | The catch |
| --- | --- | --- | --- |
| Code + CI | GitHub free organisation | Unlimited repos; free Actions on public repos | — |
| Frontend | Vercel Hobby | 50 custom domains, automatic TLS | **Non-commercial use only** — see below |
| Backend | Render free web service | 750 instance hours/month, custom domains, managed TLS | Sleeps after 15 min idle; ~1 min to wake |
| Database | Neon free plan | 0.5 GB storage, 100 compute-hours/month | Scales to zero after 5 min idle |
| Resumes | Cloudinary free | 25 GB storage and bandwidth | Raw files capped at 10 MB |

None of these require a payment method to start.

**The commercial-use clause matters here.** Vercel's Hobby plan is for personal,
non-commercial projects. CeonHub is a hiring marketplace, so the moment it takes payment,
serves paying clients, or operates as a business, Hobby is the wrong plan and Vercel's terms
require Pro. While it is a portfolio piece or a private demo, Hobby is fine. If it becomes
commercial and Pro is not an option, the frontend is a plain Next.js server — Render can run
it on a second free web service using the same settings as section 5, with build `npm ci &&
npm run build` and start `npm start`.

**Cold starts are the real cost of free.** A visitor arriving after an idle period waits for
Render to wake (~1 min) and Neon to resume, so the first request can take well over a
minute; everything after it is normal speed. A single always-awake service fits inside the
750 hours (744 in a 31-day month), so a scheduled ping to `/health` every 10 minutes keeps
the API warm — but it consumes the entire monthly allowance, leaving nothing for a second
free service.

---

## 1. Source control (GitHub)

GitHub stores the code and triggers deploys. It does **not** run the application and it is
not where the domain is connected — GitHub Pages serves static files only, and CeonHub
needs two Node processes and a PostgreSQL database. The domain is attached at the hosts
(section 8), not here.

**Create the organisation.** [github.com/organizations/plan](https://github.com/organizations/plan)
> **Free**. A free organisation gives unlimited public and private repositories, and
Actions minutes are unlimited on public repositories.

**Move the repository into it.** If it already exists under a personal account, transfer it
rather than re-uploading — a transfer keeps the history, issues and stars, and leaves a
redirect behind so old clone URLs keep working:

Repository > Settings > General > Danger Zone > **Transfer ownership**.

Then point the local clone at the new location:

```bash
git remote set-url origin https://github.com/<org>/CeonHub.git
git remote -v                     # confirm both fetch and push moved
git push -u origin master
```

**Before the first push**, confirm no credentials are going with it. `.gitignore` already
excludes `.env` and `.env.*` (keeping `.env.example`), so this should list only the two
example files:

```bash
git ls-files | grep -iE ".env|secret|credential|.pem|.key"
```

A secret that reaches GitHub must be treated as leaked and rotated at its source — deleting
the commit is not enough, because forks and caches keep it.

**Branch name.** This repository uses `master`; GitHub's default for new repositories is
`main`. Either is fine, but the hosts ask which branch to deploy from, so know which you
have. To rename: `git branch -m master main && git push -u origin main`, then change the
default branch in Settings and update `.github/workflows/ci.yml`.

**Continuous integration.** `.github/workflows/ci.yml` runs typecheck, lint, build and the
full test suite (against a throwaway PostgreSQL service container) on every push and pull
request. It needs no secrets. Turning on branch protection for the default branch — Settings
> Branches > require status checks — stops a red build from reaching production.

---

## 2. Database (Neon)

1. Sign up at [neon.tech](https://neon.tech) with your GitHub account.
2. Create a project named `ceonhub`. Pick the region **nearest the Render region you will
   use in step 5** — every query crosses that gap.
3. Open **Connection Details** and copy the connection string. **Turn off "Pooled
   connection"** and take the direct one: the Render build runs `prisma migrate deploy`, and
   migrations fail through a transaction pooler. The API is one long-lived Node process, so
   it gains nothing from the pooler anyway.
4. Make sure the string ends with `?sslmode=require`; Neon refuses plaintext connections.

You now hold **`DATABASE_URL`** — it goes into Render in step 5.

Free plan: 0.5 GB storage and 100 compute-hours a month, and the database sleeps after
5 minutes idle, so the first query after a quiet spell takes a few seconds.

---

## 3. File storage (Cloudinary)

Resumes must not live on the API's disk: Render rebuilds the filesystem on every deploy and
the uploads go with it. With `STORAGE_DRIVER=cloudinary` the API uploads each resume to
Cloudinary and stores **only the resulting URL and public id** in Postgres — no file bytes
ever reach the database, which is what keeps a free database tier viable.

1. Create a free account at [cloudinary.com](https://cloudinary.com). No card is asked for.
2. Go to **Programmable Media > API Keys** and copy the **API environment variable**. It is
   already in the exact form the backend wants:
   `cloudinary://<api_key>:<api_secret>@<cloud_name>`.

You now hold **`CLOUDINARY_URL`** — it goes into Render in step 5.

`STORAGE_DRIVER=cloudinary` and `MAX_UPLOAD_MB=5` are already set for you in `render.yaml`.
Keep the cap at 10 or below: the free plan rejects raw files above 10 MB. Optionally set
`CLOUDINARY_FOLDER` (default `ceonhub`) to keep staging and production apart in one account.

The backend refuses to start with `STORAGE_DRIVER=cloudinary` and no credentials, so a
misconfiguration shows up in the deploy log rather than the first time someone uploads a CV.

Files are uploaded as Cloudinary `raw` resources, which keeps PDFs and Word documents
byte-for-byte intact and is unaffected by the account's "PDF and ZIP files delivery"
security setting. Their URLs are public and unguessable (each contains a UUID) — the same
exposure the local `/uploads` route already has.

Switching drivers does not migrate anything: resumes uploaded before the switch keep their
old URLs, which stop resolving once the old disk is gone. On a fresh deployment there is
nothing to migrate.

---

## 4. Sign-in (LinkedIn)

**Start this early — it is the step most likely to hold you up.** Candidates and employers
can *only* sign in with LinkedIn; without it the site works but nobody except an
administrator can get in.

1. A LinkedIn app must be attached to a **LinkedIn Company Page**, and a page admin has to
   verify the app before it will issue tokens. If you do not have a page, create one first.
2. Go to [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) and create
   an app: name, the company page, a logo.
3. On the **Products** tab, add **"Sign In with LinkedIn using OpenID Connect"**. That is
   the one that matters — it grants exactly the `openid profile email` scopes the backend
   requests, and access to the `/v2/userinfo` endpoint it reads the profile from. No other
   LinkedIn product is needed.
4. On the **Auth** tab, copy the **Client ID** and the **Primary Client Secret**.

You now hold **`LINKEDIN_CLIENT_ID`** and **`LINKEDIN_CLIENT_SECRET`** — both go into Render
in step 5. The redirect URL is registered in step 7, once the API has a hostname.

If LinkedIn is not ready yet, leave both blank in Render and carry on. The backend treats a
blank value as absent, boots with LinkedIn switched off, and the sign-in buttons disappear
from the site instead of erroring. Fill them in later and redeploy.

---

## 5. Backend (Render)

1. Sign up at [render.com](https://render.com) with GitHub, and grant it access to the
   organisation that owns the repository.
2. **New > Blueprint**, and pick the CeonHub repository. Render finds `render.yaml` and
   reads the build commands, health check and instance plan from it.
3. If Oregon is not the right region, change `region:` in `render.yaml` and push before
   applying — ideally matching the Neon region from step 2.
4. Render prompts for every value marked `sync: false`. Fill them in like this:

| Prompt | What to paste | From |
| --- | --- | --- |
| `DATABASE_URL` | The Neon direct connection string | Step 2 |
| `CLOUDINARY_URL` | `cloudinary://key:secret@cloud` | Step 3 |
| `LINKEDIN_CLIENT_ID` | Client ID, or leave blank | Step 4 |
| `LINKEDIN_CLIENT_SECRET` | Primary Client Secret, or leave blank | Step 4 |
| `API_URL` | `https://ceonhub-api.onrender.com` | Corrected in step 7 if Render assigns another name |
| `FRONTEND_URL` | Leave blank | Filled in step 7 |
| `CORS_ORIGIN` | Leave blank | Filled in step 7 |
| `LINKEDIN_CALLBACK_URL` | Leave blank | Defaults to `<API_URL>/api/auth/linkedin/callback` |
| `COOKIE_DOMAIN` | Leave blank | Only used once you have a domain (step 8) |
| `COOKIE_SAMESITE` | Leave blank | Production defaults to `none`, correct across `.vercel.app` and `.onrender.com` |

Blank is safe everywhere above: the backend strips blank variables before validating, so a
blank field behaves exactly like an unset one.

You are not asked for `JWT_SECRET` — Render generates it and keeps it. Do not change it
later unless you mean to sign every existing session out. `NODE_ENV`, `STORAGE_DRIVER` and
`MAX_UPLOAD_MB` are already fixed in `render.yaml`.

5. **Apply.** The first deploy runs `npm ci && npm run build && npm run db:deploy`, so your
   Neon database gets its tables during the build. Watch the log — a failed migration fails
   the deploy, which is what you want.
6. Copy the service URL Render assigns (usually `https://ceonhub-api.onrender.com`) and open
   `<that URL>/health`. You want `{"success":true,…}`. Allow a minute; free instances are
   slow to wake.

<details>
<summary>Setting it up by hand instead of from the blueprint</summary>

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Build command | `npm ci && npm run build && npm run db:deploy` |
| Start command | `npm start` |
| Health check path | `/health` |
| Instance type | Free |
| Node version | 20.19+, 22.12+ or 24+ |

`npm run build` runs `prisma generate` then `tsc`. The Prisma CLI is a runtime dependency on
purpose, so `db:deploy` can run on the host. On a paid instance, move `db:deploy` out of the
build into a pre-deploy command.

</details>

---

## 6. Frontend (Vercel)

1. Sign up at [vercel.com](https://vercel.com) with GitHub.
2. **Add New > Project**, and import the CeonHub repository.
3. Set **Root Directory to `frontend`**. This is the one setting that must not be missed —
   left at the repository root the build fails, because there is no Next.js app there.
   Vercel detects the framework and the build command on its own.
4. Add the environment variables:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | The Render URL from step 5, e.g. `https://ceonhub-api.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | Leave for now — set in step 7, once Vercel has assigned the URL |

5. **Deploy**, then copy the `https://<project>.vercel.app` URL it gives you.

Both variables are **build-time** values compiled into the browser bundle. Editing them in
the dashboard changes nothing until you redeploy — the single most common reason a correctly
configured site still calls the wrong API. Neither may contain a secret: anything prefixed
`NEXT_PUBLIC_` is visible to every visitor.

---

## 7. Close the loop

Both halves now exist but do not yet trust each other. Three edits, in any order:

**On Render** (Environment tab) — saving triggers a redeploy:

```ini
FRONTEND_URL=https://<project>.vercel.app
CORS_ORIGIN=https://<project>.vercel.app
API_URL=https://<the real Render URL>     # only if it differs from what you guessed
```

Miss this and the site loads perfectly while every API call fails CORS.

**On Vercel** (Settings > Environment Variables), then **Redeploy**:

```ini
NEXT_PUBLIC_SITE_URL=https://<project>.vercel.app
```

**On LinkedIn** (Auth tab > Authorized redirect URLs), add exactly:

```
https://<the real Render URL>/api/auth/linkedin/callback
```

LinkedIn matches character for character — no trailing slash, right scheme. Sign-in fails
with `redirect_uri_mismatch` until it matches.

### Where every value ends up

| Value | Comes from | Lives in | Under the name |
| --- | --- | --- | --- |
| Postgres connection string | Neon | Render | `DATABASE_URL` |
| Cloudinary credentials | Cloudinary | Render | `CLOUDINARY_URL` |
| LinkedIn client id and secret | LinkedIn | Render | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| The API's own public URL | Render | Render | `API_URL` |
| The site's public URL | Vercel | Render | `FRONTEND_URL`, `CORS_ORIGIN` |
| The API's public URL | Render | Vercel | `NEXT_PUBLIC_API_URL` |
| The site's public URL | Vercel | Vercel | `NEXT_PUBLIC_SITE_URL` |
| The callback URL | Render | LinkedIn | Authorized redirect URL |
| Session signing key | Render generates it | Render | `JWT_SECRET` |

Nothing on this list belongs in the repository. Every secret lives in its host's dashboard.

---

## 8. Custom domain

Buy the domain anywhere (Namecheap, Porkbun, Cloudflare, …); the registrar does not matter.
**Deploy first and attach the domain afterwards** — both hosts need a running service before
they will issue a TLS certificate.

The layout below puts the site on the apex and the API on a subdomain, which is worth doing
deliberately: because both then share the parent domain, the session cookie can use
`SameSite=Lax` scoped to `.your-domain.com` instead of the weaker cross-site
`SameSite=None`.

```
your-domain.com       ──►  Vercel   (frontend)
www.your-domain.com   ──►  Vercel   (redirects to the apex)
api.your-domain.com   ──►  Render   (backend)
```

**1. Claim the names at the hosts.** In Vercel: Project > Settings > Domains > add
`your-domain.com` and `www.your-domain.com`. In Render: Service > Settings > Custom Domains
> add `api.your-domain.com`. Each host then shows the exact DNS record it wants.

**2. Add those records at the registrar.** Use the values the dashboards printed, not the
ones below — Vercel's apex IP in particular changes over time:

| Host | Type | Points at |
| --- | --- | --- |
| `@` | A | Vercel's apex IP, as shown in the dashboard |
| `www` | CNAME | `cname.vercel-dns.com` |
| `api` | CNAME | `<your-service>.onrender.com` |

Propagation is usually minutes, occasionally hours. Both hosts issue Let's Encrypt
certificates automatically once the record resolves; until then the domain shows a
certificate warning, which is expected and not something to fix.

If you put the domain behind Cloudflare, set the `api` record to **DNS only** (grey cloud).
Proxying it breaks Render's certificate issuance and can interfere with the session cookie.

**3. Switch the environment over.** On Render:

```ini
API_URL=https://api.your-domain.com
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
LINKEDIN_CALLBACK_URL=https://api.your-domain.com/api/auth/linkedin/callback

# Now that both ends share a parent domain, tighten the cookie:
COOKIE_DOMAIN=.your-domain.com
COOKIE_SAMESITE=lax
```

On Vercel, `NEXT_PUBLIC_API_URL=https://api.your-domain.com` and
`NEXT_PUBLIC_SITE_URL=https://your-domain.com`. **`NEXT_PUBLIC_*` values are compiled into
the browser bundle**, so changing them in the dashboard does nothing until you redeploy —
this is the single most common reason a freshly domained site still calls the old API.

**4. Register the new callback with LinkedIn.** Add the exact
`https://api.your-domain.com/api/auth/linkedin/callback` URL on the app's **Auth** tab.
LinkedIn matches character for character, and sign-in fails with `redirect_uri_mismatch`
until it does.

---

## 9. Docker

`docker-compose.yml` runs the whole stack locally:

```bash
docker compose up --build
docker compose run --rm backend npm run db:seed:prod    # optional demo data
```

* Web <http://localhost:3000>, API <http://localhost:4000>, PostgreSQL on 5432.
* The backend container runs `npm run db:deploy` before starting, so migrations are applied
  automatically.
* Uploads are stored in the `uploads` volume; without it, files would disappear on restart.
* The credentials in the Compose file are local placeholders. For a server deployment,
  replace them with real values from your platform's secret store.

The images are also usable on their own:

```bash
docker build -t ceonhub-api ./backend
docker build -t ceonhub-web --build-arg NEXT_PUBLIC_API_URL=https://api.example.com ./frontend
```

Note the build argument: the frontend image bakes the API URL in at build time.

---

## 10. Post-deployment checklist

1. `GET https://api.…/health` returns `{"success":true,…}`.
2. `GET https://api.…/api/auth/providers` returns `{"linkedin":true}`. If it says `false`,
   the LinkedIn variables are missing and **no one can sign in**.
3. `GET https://api.…/api/jobs` returns an empty, well-formed page of results.
4. Join as a candidate with LinkedIn, sign out, sign back in — the session survives a
   reload.
5. Join as an employer with a second LinkedIn account, create a company, publish a job,
   and confirm it appears in `/jobs`.
6. Apply to that job as the candidate, and confirm the employer sees the applicant.
7. Create a **private** job and confirm it does **not** appear in `/jobs`, then invite the
   candidate and confirm they can open and accept it.
8. Upload a resume on the candidate profile, then open the returned link: it points at
   `res.cloudinary.com` and downloads the file. Redeploy the backend and open it again —
   still there. (On the `local` driver it would now 404, which is the whole point.)
9. On a custom domain: `https://your-domain.com`, `https://www.your-domain.com` and
   `https://api.your-domain.com/health` all load over HTTPS with no certificate warning,
   and the browser's network tab shows the site calling `api.your-domain.com` — not the
   old `.onrender.com` name, which means the frontend was rebuilt after the switch.
10. `https://…/robots.txt` and `https://…/sitemap.xml` resolve and contain your domain.
11. Create your first admin. There is no sign-up for one, by design — insert the row
   directly, with a bcrypt hash of the password you want:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
   ```
   An admin promoted this way from a LinkedIn account has no password and keeps signing in
   with LinkedIn. To use the `/admin/login` page instead, set `passwordHash` to a bcrypt
   hash you generate yourself. Then check `/admin`.

---

## 11. Operating notes

**Migrations.** Always `npm run db:deploy` in production (never `db:migrate`, which is
interactive and can reset data). Run it as a release step so it completes before the new
version serves traffic.

**Backups.** Use the managed database's snapshots. The application stores nothing else that
matters except uploaded files.

**Uploaded files.** With `STORAGE_DRIVER=cloudinary` the files live in Cloudinary and the
database holds only their URLs, so nothing is lost on redeploy and the database stays small.
The `local` driver writes to the container's disk instead and needs a persistent volume to
survive a restart; that is the development default, not a production one.

**Scaling.** The API is stateless apart from two things: the local file driver above (a
non-issue on the Cloudinary driver) and the in-memory rate limiter. Running more than one
instance on the local driver means uploads are not shared, and rate limits are always
counted per instance — solved with a shared store when the time comes, and not a problem
for a single instance.

**Email.** With `EMAIL_DRIVER=console` the notifications are only written to the server log.
Adding a real provider is a small, contained change — see
[architecture.md](architecture.md#7-email).

**Logs.** Unexpected errors are logged server-side with `[unhandled error]`; clients only
receive a generic message. Watch for that prefix.
