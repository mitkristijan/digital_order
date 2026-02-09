# Free Tier Deployment Guide

Deploy Digital Order for **demo and testing** using 100% free services. When ready for production, switch to paid plans without code changes.

> **Note:** This setup requires `DIRECT_URL` in your database config (for Supabase connection pooling). Add it to `apps/api/.env` for local dev — see Step 6.

## Free Services Used

| Service | Purpose | Free Tier | URL Format |
|---------|---------|-----------|------------|
| **Render** | API (NestJS) | 750 hrs/mo, spins down after 15 min | `*.onrender.com` |
| **Vercel** | 3 Frontend apps | Hobby plan | `*.vercel.app` |
| **Supabase** | PostgreSQL | 500MB, 1GB storage | - |
| **Upstash** | Redis | 256MB, 500K commands/mo | - |

## Step 1: Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → Sign up / Log in
2. **New Project** → Name: `digital-order-demo`
3. Set a strong database password (save it!)
4. Wait for project to provision (~2 min)

5. **Get connection string:**
   - Project Settings → Database
   - Under "Connection string", select **URI**
   - Copy the connection string
   - **Important:** Add `?pgbouncer=true` if using the pooler URL (port 6543)

You need **two** connection strings:
- **DATABASE_URL** (pooler, port 6543): For app runtime — add `?pgbouncer=true`
- **DIRECT_URL** (direct, port 5432): For migrations — no pgbouncer

Example format:
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
```

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

   | Setting | Value |
   |--------|-------|
   | **Name** | `digital-order-api` |
   | **Region** | Oregon (or closest) |
   | **Branch** | `main` |
   | **Root Directory** | *(leave empty)* |
   | **Runtime** | Node |
   | **Build Command** | See below |
   | **Start Command** | See below |
   | **Instance Type** | Free |

   **Build Command:**
   ```bash
   npm install --include=dev && npm run build --workspace=@digital-order/types && npm run build --workspace=@digital-order/utils && npm run build --workspace=@digital-order/config && cd apps/api && npx prisma generate && npm run build
   ```
   
   > **Important:** `--include=dev` is required because Render sets NODE_ENV=production, which skips devDependencies. The NestJS CLI (`@nestjs/cli`) is needed for the build.

   **Start Command:**
   ```bash
   cd apps/api && npx prisma migrate deploy && node dist/apps/api/src/main.js
   ```

5. **Environment Variables** (Render Dashboard → Environment):

   | Key | Value |
   |----|-------|
   | `DATABASE_URL` | From Supabase - pooler URL (port 6543) |
   | `DIRECT_URL` | From Supabase - direct URL (port 5432) for migrations |
   | `REDIS_URL` | From Upstash (Step 2) |
   | `JWT_SECRET` | `openssl rand -base64 32` |
   | `JWT_REFRESH_SECRET` | `openssl rand -base64 32` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | *(Add after deploying frontends)* |
   | `FRONTEND_URL` | *(Add after deploying frontends)* |
   | `ADMIN_URL` | *(Add after deploying frontends)* |
   | `API_URL` | `https://digital-order-api.onrender.com` |

6. **Deploy** → Wait for build (~5–10 min)

7. **Note your API URL:** `https://digital-order-api.onrender.com` (or your custom name)

8. **Seed the database** (one-time):
   ```bash
   cd apps/api
   DATABASE_URL="your-supabase-url" npx prisma migrate deploy
   DATABASE_URL="your-supabase-url" npx prisma db seed
   ```

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
   | `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com/api` |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://your-api.onrender.com` |

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

After all frontends are deployed, add their URLs to CORS in Render:

1. Render Dashboard → Your API → Environment
2. Set `CORS_ORIGIN`:
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

| App | URL |
|-----|-----|
| **Customer** | `https://digital-order-customer.vercel.app` |
| **Admin** | `https://digital-order-admin.vercel.app` |
| **Kitchen** | `https://digital-order-kitchen.vercel.app` |
| **API** | `https://digital-order-api.onrender.com` |
| **API Docs** | `https://digital-order-api.onrender.com/api/docs` |

## Default Login Credentials

```
Super Admin: admin@digitalorder.com / Admin@123
Demo Tenant: admin@demo.com / Admin@123
Customer: customer@demo.com / Customer@123
```

## Troubleshooting

### P1001: Can't reach database server (Supabase)

If migrations fail with "Can't reach database server":

1. **Supabase bans IPs after failed attempts** — Supabase Fail2ban blocks IPs after 2 wrong passwords. Check Supabase Dashboard → Database Settings → **Banned IPs** and unban if needed. Bans clear after ~30 min.

2. **Use Session pooler for Render** — The direct connection (port 5432) can be blocked. Try the **Session** pooler instead of Direct:
   - Supabase → Project Settings → Database
   - Session pooler: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
   - Use this for **both** DATABASE_URL and DIRECT_URL if migrations fail with direct.

3. **Verify password** — No spaces, special chars properly URL-encoded in the connection string.

### Cannot find module dist/main.js

The NestJS monorepo build outputs to `dist/apps/api/src/main.js`. Use this start command:

```bash
cd apps/api && npx prisma migrate deploy && node dist/apps/api/src/main.js
```

## Free Tier Limitations

| Limitation | Impact |
|------------|--------|
| **Render spin-down** | API sleeps after 15 min idle; first request may take 30–60s |
| **Vercel bandwidth** | 100GB/mo on Hobby |
| **Supabase** | 500MB DB, 1GB storage |
| **Upstash** | 500K commands/month |

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
