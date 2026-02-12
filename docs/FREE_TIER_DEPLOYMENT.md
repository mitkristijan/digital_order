# Free Tier Deployment Guide

Deploy Digital Order for **demo and testing** using 100% free services. When ready for production, switch to paid plans without code changes.

> **Note:** This setup requires `DIRECT_URL` in your database config (for Supabase connection pooling). Add it to `apps/api/.env` for local dev — see Step 6.

## Free Services Used

| Service      | Purpose         | Free Tier                           | URL Format       |
| ------------ | --------------- | ----------------------------------- | ---------------- |
| **Render**   | API (NestJS)    | 750 hrs/mo, spins down after 15 min | `*.onrender.com` |
| **Vercel**   | 3 Frontend apps | Hobby plan                          | `*.vercel.app`   |
| **Supabase** | PostgreSQL      | 500MB, 1GB storage                  | -                |
| **Upstash**  | Redis           | 256MB, 500K commands/mo             | -                |

## Step 1: Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → Sign up / Log in
2. **New Project** → Name: `digital-order-demo`
3. Set a strong database password (save it!)
4. Wait for project to provision (~2 min)

5. **Get connection string** — **Use Session pooler (required for Render):**
   - Project Settings → Database
   - Under "Connection string", select **URI**
   - Choose **Session** mode (NOT Direct — Render doesn't support IPv6, Supabase direct uses IPv6)
   - Copy the connection string (format: `aws-0-[region].pooler.supabase.com:5432`)

**Use the SAME Session pooler URL for both variables** (Render needs IPv4-compatible pooler):

```
DATABASE_URL=postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
```

> **Important:** Do NOT use `db.[ref].supabase.co` (direct connection) — it uses IPv6 and fails from Render. Always use `aws-0-[region].pooler.supabase.com:5432` (Session pooler).

## Step 2: Upstash (Redis)

1. Go to [upstash.com](https://upstash.com) → Sign up / Log in
2. **Create Database** → Name: `digital-order`
   - Type: Regional (or Global for lower latency)
   - Region: Choose closest to your Render region

3. **Get Redis URL:**
   - Database → Details → "Redis Connect"
   - Copy the connection string (starts with `rediss://`)

## Step 3: Render (API)

1. Go to [render.com](https://render.com) → Sign up / Log in
2. **New** → **Web Service**
3. Connect your GitHub/GitLab repo
4. Configure:

   | Setting            | Value                                                                   |
   | ------------------ | ----------------------------------------------------------------------- |
   | **Name**           | `digital-order` (or `digital-order-api`) — URL will be `*.onrender.com` |
   | **Region**         | Oregon (or closest)                                                     |
   | **Branch**         | `main`                                                                  |
   | **Root Directory** | _(leave empty)_                                                         |
   | **Runtime**        | Node                                                                    |
   | **Build Command**  | See below                                                               |
   | **Start Command**  | See below                                                               |
   | **Instance Type**  | Free                                                                    |

   **Build Command:**

   ```bash
   npm install --include=dev && npm run build --workspace=@digital-order/types && npm run build --workspace=@digital-order/utils && npm run build --workspace=@digital-order/config && cd apps/api && npx prisma generate && npm run build
   ```

   > **Important:** `--include=dev` is required because Render sets NODE_ENV=production, which skips devDependencies. The NestJS CLI (`@nestjs/cli`) is needed for the build.

   **Start Command:** (migrations run automatically on every deploy)

   ```bash
   cd apps/api && npx prisma migrate deploy && node dist/apps/api/src/main.js
   ```

5. **Environment Variables** (Render Dashboard → Environment):

   | Key                  | Value                                                                                                                                                                     |
   | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `DATABASE_URL`       | From Supabase - pooler URL (port 6543)                                                                                                                                    |
   | `DIRECT_URL`         | From Supabase - direct URL (port 5432) for migrations                                                                                                                     |
   | `REDIS_URL`          | From Upstash (Step 2)                                                                                                                                                     |
   | `JWT_SECRET`         | `openssl rand -base64 32`                                                                                                                                                 |
   | `JWT_REFRESH_SECRET` | `openssl rand -base64 32`                                                                                                                                                 |
   | `NODE_ENV`           | `production`                                                                                                                                                              |
   | `CORS_ORIGIN`        | Comma-separated: `https://your-admin.vercel.app,https://your-customer.vercel.app,https://your-kitchen.vercel.app` — `*.vercel.app` preview URLs are allowed automatically |
   | `FRONTEND_URL`       | _(Add after deploying frontends)_                                                                                                                                         |
   | `ADMIN_URL`          | _(Add after deploying frontends)_                                                                                                                                         |
   | `API_URL`            | `https://YOUR-SERVICE-NAME.onrender.com` (match your Render service name)                                                                                                 |

6. **Deploy** → Wait for build (~5–10 min)

7. **Note your API URL:** `https://YOUR-SERVICE-NAME.onrender.com` (e.g. `digital-order.onrender.com`)

8. **Migrations and seed**:

   - **Blueprint (render.yaml):** Migrations run automatically on every deploy via the start command. No manual step needed.
   - **Manual Render setup:** Run migrations locally once before first deploy:

   ```bash
   cd apps/api

   # Apply migrations (creates User, Tenant, Order, etc. tables)
   DIRECT_URL="postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres" \
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
   npx prisma migrate deploy

   # Seed demo data (optional)
   DIRECT_URL="..." DATABASE_URL="..." npx prisma db seed
   ```

   > **Critical:** If you see "table User does not exist", migrations were never applied. Run the commands above with your Supabase credentials.

## Step 4: Vercel (Frontend Apps)

Deploy each app as a **separate Vercel project**.

### 4a. Customer App

1. Go to [vercel.com](https://vercel.com) → Sign up / Log in
2. **Add New** → **Project** → Import your repo
3. Configure:
   - **Project Name:** `digital-order-customer`
   - **Root Directory:** `apps/customer-app`
   - **Framework Preset:** Next.js (auto-detected)

4. **Environment Variables:**
   | Key | Value |
   |----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://YOUR-SERVICE.onrender.com/api` (must match your Render URL) |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://YOUR-SERVICE.onrender.com` |

   > **Important:** Set these for **Production** and **Preview** environments in Vercel (Settings → Environment Variables → check both).

5. **Deploy**

### 4b. Admin App

1. **Add New** → **Project** → Same repo
2. **Root Directory:** `apps/admin-app`
3. **Environment Variables:** Same as customer + `NEXT_PUBLIC_CUSTOMER_APP_URL`
4. **Deploy**

### 4c. Kitchen App

1. **Add New** → **Project** → Same repo
2. **Root Directory:** `apps/kitchen-app`
3. **Environment Variables:** Same as customer (API + Socket URLs)
4. **Deploy**

## Step 5: Update CORS on Render

After all frontends are deployed, add your **production** frontend URLs to CORS in Render (Vercel **preview** URLs like `*-xxx-*.vercel.app` are allowed automatically):

1. Render Dashboard → Your API → Environment
2. Set `CORS_ORIGIN` (comma-separated, no spaces):
   ```
   https://digital-order-customer.vercel.app,https://digital-order-admin.vercel.app,https://digital-order-kitchen.vercel.app
   ```
3. Set `FRONTEND_URL`: `https://digital-order-customer.vercel.app`
4. Set `ADMIN_URL`: `https://digital-order-admin.vercel.app`
5. **Save** → Render will auto-redeploy

## Step 6: Update Local .env (for migrations)

For local development, add `DIRECT_URL` to `apps/api/.env` (same as `DATABASE_URL` for local Postgres):

```env
DIRECT_URL="postgresql://digital_order:dev_password@localhost:5433/digital_order"
```

## Step 7: Seed Database (if not done)

Run locally with your production DATABASE_URL:

```bash
cd apps/api
DATABASE_URL="postgresql://..." npx prisma db seed
```

Or use Prisma Studio to verify data:

```bash
DATABASE_URL="postgresql://..." npx prisma studio
```

## Your Free URLs

| App          | URL                                          |
| ------------ | -------------------------------------------- |
| **Customer** | `https://digital-order-customer.vercel.app`  |
| **Admin**    | `https://digital-order-admin.vercel.app`     |
| **Kitchen**  | `https://digital-order-kitchen.vercel.app`   |
| **API**      | `https://YOUR-SERVICE.onrender.com`          |
| **API Docs** | `https://YOUR-SERVICE.onrender.com/api/docs` |

## Default Login Credentials

```
Super Admin: admin@digitalorder.com / Admin@123
Demo Tenant: admin@demo.com / Admin@123
Customer: customer@demo.com / Customer@123
```

## Troubleshooting

### 500 Internal Server Error on /api/auth/register

1. **See the error without Render logs** — Open browser DevTools (F12) → **Network** tab → trigger the failing request (e.g. register) → click the red failed request → **Response** tab. The `message` field shows the actual error.

2. **Optional:** Add `DEBUG_ERRORS=true` in Render Environment to include stack trace in the response.

3. **Common causes:**
   - **"table User does not exist"** — Migrations were never applied. Run `npx prisma migrate deploy` **locally** with your Supabase `DATABASE_URL` and `DIRECT_URL` (see Step 8 above). Supabase needs the direct connection for migrations.
   - **Database not seeded** — Run `npx prisma db seed` locally with your Supabase `DATABASE_URL`.
   - **Missing JWT_SECRET / JWT_REFRESH_SECRET** — Set both in Render Environment.
   - **Prisma schema mismatch** — Ensure all migrations are applied to Supabase.

4. **Verify in Render** — Environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`.

### P1001: Can't reach database server (Supabase)

Render **does not support IPv6**. Supabase's direct connection (`db.[ref].supabase.co`) uses IPv6 and will fail.

**Fix:** Use the **Session pooler** for BOTH DATABASE_URL and DIRECT_URL:

```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

Get it from: Supabase Dashboard → Project Settings → Database → Connection string → **Session** mode.

Also check:

- **Banned IPs** — Supabase bans after 2 wrong passwords. Check Database Settings → Banned IPs → Unban.
- **Password** — No spaces, special chars URL-encoded (e.g. `@` → `%40`).

### Redis ECONNRESET / MaxRetriesPerRequestError (Upstash)

The app is configured for Upstash resilience: unlimited retries, `enableOfflineQueue`, and explicit TLS for `rediss://` URLs. If you still see connection errors:

- Verify `REDIS_URL` starts with `rediss://` (double s for TLS)
- Check Upstash Dashboard → your database is active
- Free tier: 10K connections, 500K commands/month

### Cannot find module dist/main.js

The NestJS monorepo build outputs to `dist/apps/api/src/main.js`. Use this start command:

```bash
cd apps/api && npx prisma migrate deploy && node dist/apps/api/src/main.js
```

### Admin menu shows loader forever / never loads data

1. **Render cold start** — First request after 15 min idle can take 30–60 seconds. Wait up to 60 seconds; the app now retries with backoff.

2. **Wrong API URL in Vercel** — Ensure each Vercel project has:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-SERVICE.onrender.com/api` (include `/api`)
   - Set for **Production** and **Preview** in Settings → Environment Variables
   - Redeploy after changing env vars (Next.js bakes them at build time).

3. **CORS** — Add your Vercel production URLs to `CORS_ORIGIN` on Render, e.g.:
   ```
   https://digital-order-admin.vercel.app,https://digital-order-customer.vercel.app,https://digital-order-kitchen.vercel.app
   ```
   **Vercel preview URLs** (e.g. `https://digital-order-admin-xxx-mitrovics-projects.vercel.app`) are allowed automatically by the API — no need to list them. If you see CORS errors from a preview URL, redeploy the API on Render so it uses the latest CORS logic.

4. **Verify** — Open DevTools → Network tab, then visit the menu page. Check if requests to your Render API are sent and whether they succeed or fail.

### 404 on POST /api/orders when customer confirms order

1. **API URL must include /api** — In Vercel (customer app), set `NEXT_PUBLIC_API_URL` = `https://YOUR-SERVICE.onrender.com/api` (include `/api`). The customer app normalizes this, but the correct format is required.

2. **Tenant must exist** — The tenant slug in the URL (e.g. `nikodim1` in `/nikodim1/checkout`) must match a tenant in the production database with `subdomain` or `menuSlug` = that value. Use Prisma Studio or your DB UI to verify the tenant exists and is `ACTIVE`.

3. **Cold start** — On Render free tier, the first request after 15 min idle can fail or time out. Ask the customer to try again after 30–60 seconds.

### CORS: "No 'Access-Control-Allow-Origin' header" (e.g. on /api/auth/register)

1. **Vercel preview URLs** — The API allows any origin whose host contains `.vercel.app` (production and preview). Ensure the API on Render has been **redeployed** after the latest code so this behavior is active.

2. **Cold start** — On Render free tier, the first request after idle can be an OPTIONS preflight; if the service is still waking up, the response may not include CORS headers. **Retry once** after 30–60 seconds; the next request should succeed.

3. **Render env** — Set `CORS_ORIGIN` to your production Vercel URLs (comma-separated). Preview URLs do not need to be listed.

## Free Tier Limitations

| Limitation           | Impact                                                      |
| -------------------- | ----------------------------------------------------------- |
| **Render spin-down** | API sleeps after 15 min idle; first request may take 30–60s |
| **Vercel bandwidth** | 100GB/mo on Hobby                                           |
| **Supabase**         | 500MB DB, 1GB storage                                       |
| **Upstash**          | 500K commands/month                                         |

## Switching to Paid (Production)

When ready for production:

1. **Render** → Upgrade to Starter ($7/mo) for no spin-down
2. **Vercel** → Upgrade to Pro ($20/mo) if needed
3. **Supabase** → Pro ($25/mo) for more storage
4. **Upstash** → Pay-as-you-go or fixed plan

**No code changes required** — just update environment variables if you move to different URLs (e.g., custom domain).

## Custom Domain (Optional)

- **Vercel:** Add domain in Project Settings → Domains (free SSL)
- **Render:** Add custom domain in Service Settings (free SSL)
- Free subdomains: `*.vercel.app` and `*.onrender.com` work out of the box

admin panel - vercel: https://digital-order-admin-rnf4h68pc-mitrovics-projects.vercel.app/
customer app - vercel: https://digital-order-customer-app.vercel.app/
backend - render: https://digital-order.onrender.com/api/docs
