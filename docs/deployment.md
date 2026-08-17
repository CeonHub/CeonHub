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

---

## 1. Database

Any managed PostgreSQL 14+ works (Neon, Supabase, Render, Railway, RDS, …). Create the
database and copy its connection string into the backend's `DATABASE_URL`.

Most managed providers require TLS; if the connection is refused, append `?sslmode=require`
to the URL.

---

## 2. Backend

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

---

## 3. Frontend

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

## 4. Docker

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

## 5. Post-deployment checklist

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
8. `https://…/robots.txt` and `https://…/sitemap.xml` resolve and contain your domain.
9. Create your first admin. There is no sign-up for one, by design — insert the row
   directly, with a bcrypt hash of the password you want:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
   ```
   An admin promoted this way from a LinkedIn account has no password and keeps signing in
   with LinkedIn. To use the `/admin/login` page instead, set `passwordHash` to a bcrypt
   hash you generate yourself. Then check `/admin`.

---

## 6. Operating notes

**Migrations.** Always `npm run db:deploy` in production (never `db:migrate`, which is
interactive and can reset data). Run it as a release step so it completes before the new
version serves traffic.

**Backups.** Use the managed database's snapshots. The application stores nothing else that
matters except uploaded files.

**Uploaded files.** The local storage driver writes to the container's disk. On a platform
with an ephemeral filesystem, mount a persistent volume — or implement the S3-compatible
driver described in [architecture.md](architecture.md#6-storage), which is what the storage
abstraction exists for.

**Scaling.** The API is stateless apart from two things: the local file driver above, and
the in-memory rate limiter. Running more than one instance means uploads are not shared and
rate limits are counted per instance. Both are solved with a shared store when the time
comes; neither is a problem for a single instance.

**Email.** With `EMAIL_DRIVER=console` the notifications are only written to the server log.
Adding a real provider is a small, contained change — see
[architecture.md](architecture.md#7-email).

**Logs.** Unexpected errors are logged server-side with `[unhandled error]`; clients only
receive a generic message. Watch for that prefix.
