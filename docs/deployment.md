# Deployment

CeonHub is two ordinary Node applications and one PostgreSQL database. That is the whole
infrastructure: no Kubernetes, no Swarm, no broker, no cache tier.

```
   Vercel (or any Node host)        Render / Railway / Fly.io        Managed PostgreSQL
   ┌──────────────────────┐         ┌──────────────────────┐         ┌────────────────┐
   │  frontend  (Next.js) │ ──────► │  backend  (Express)  │ ──────► │   PostgreSQL   │
   └──────────────────────┘  HTTPS  └──────────────────────┘         └────────────────┘
```

Deploy in this order: **database → backend → frontend**. The frontend bakes the API URL in
at build time, so the API should exist first.

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
it on a second free web service using the same settings as section 3, with build `npm ci &&
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
(section 5), not here.

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

## 2. Database

Any managed PostgreSQL 14+ works (Neon, Supabase, Render, Railway, RDS, …). Create the
database and copy its connection string into the backend's `DATABASE_URL`.

Most managed providers require TLS; if the connection is refused, append `?sslmode=require`
to the URL.

---

## 3. Backend

Any platform that can run a Node service. Settings:

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Release / pre-deploy command | `npm run db:deploy` |
| Health check path | `/health` |
| Node version | 20.19+, 22.12+ or 24+ |

`npm run build` runs `prisma generate` and then `tsc`. The Prisma CLI is a runtime
dependency on purpose, so `npm run db:deploy` (i.e. `prisma migrate deploy`) can run as a
release step on the host.

**Environment variables** (see the README for the full table):

```ini
NODE_ENV=production
PORT=4000                      # or whatever the platform injects
DATABASE_URL=postgresql://…
JWT_SECRET=<48 random bytes>   # node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
FRONTEND_URL=https://ceonhub.example.com
CORS_ORIGIN=https://ceonhub.example.com
API_URL=https://api.ceonhub.example.com
EMAIL_DRIVER=console           # until a real provider is implemented

# Resumes. Without this the files land on the container's disk and are lost
# on the next deploy — see "File storage" below.
STORAGE_DRIVER=cloudinary
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Required — candidates and employers can only sign in with LinkedIn.
LINKEDIN_CLIENT_ID=…
LINKEDIN_CLIENT_SECRET=…
LINKEDIN_CALLBACK_URL=https://api.ceonhub.example.com/api/auth/linkedin/callback
```

**Without these, nobody but an administrator can sign in.** Register that exact callback URL
on the app's **Auth** tab in the
[LinkedIn developer portal](https://www.linkedin.com/developers/apps) — each environment
needs its own entry, and the value must match character for character. Keep the client
secret in the platform's secret store, never in the repository.

Never reuse the development `JWT_SECRET`: changing it invalidates every existing session,
which is exactly what you want if it ever leaks.

### Cookies across two domains — the part that catches people

The site and the API normally live on different domains (`ceonhub.example.com` and
`api.ceonhub.example.com`). A cookie sent from one to the other is a cross-site cookie, so:

* `COOKIE_SAMESITE` must be `none` — the default when `NODE_ENV=production`;
* `SameSite=None` requires `Secure`, so **both** ends must be served over HTTPS;
* `CORS_ORIGIN` must contain the site's exact origin, including scheme (and port, if any).

If both ends share a parent domain, you can tighten this: set `COOKIE_DOMAIN=.example.com`
and `COOKIE_SAMESITE=lax`.

Symptom of getting this wrong: sign-in appears to succeed, but every following request comes
back `401`.

### File storage (Cloudinary)

Resumes must not live on the API's disk in production: Render, Railway and Fly all rebuild
the filesystem on every deploy, and the uploads go with it. Set `STORAGE_DRIVER=cloudinary`
and the API uploads each resume to Cloudinary instead, storing **only the resulting URL and
public id** in Postgres — no file bytes ever reach the database, so a free database tier is
enough.

1. Create a free account at [cloudinary.com](https://cloudinary.com) (25 GB storage and
   25 GB monthly bandwidth on the free plan; a resume is a few hundred kilobytes).
2. Copy **API environment variable** from the dashboard — Programmable Media > API Keys.
   It already has the `cloudinary://<api_key>:<api_secret>@<cloud_name>` form.
3. Set it as `CLOUDINARY_URL` in the platform's secret store, together with
   `STORAGE_DRIVER=cloudinary`. Keep `MAX_UPLOAD_MB` at 10 or below: the free plan rejects
   raw files above 10 MB.
4. Optionally set `CLOUDINARY_FOLDER` (default `ceonhub`) to keep staging and production
   apart inside one account.

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

## 4. Frontend

| Setting | Value |
| --- | --- |
| Root directory | `frontend` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Start command | `npm start` (not needed on Vercel) |
| Node version | 20.19+ |

```ini
NEXT_PUBLIC_API_URL=https://api.ceonhub.example.com
NEXT_PUBLIC_SITE_URL=https://ceonhub.example.com
```

Both are **build-time** values inlined into the browser bundle — changing them requires a
rebuild, not just a restart. Neither may contain a secret.

On Vercel, set the root directory to `frontend`; the framework is detected automatically.
Any other Node host works too: `npm run build && npm start`.

---

## 5. Custom domain

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

## 6. Docker

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

## 7. Post-deployment checklist

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

## 8. Operating notes

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
