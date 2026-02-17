# Production Readiness Checklist

Senior fullstack consultant analysis of the Digital Order codebase. Items marked **CRITICAL** must be fixed before production. **HIGH** and **MEDIUM** should be addressed for a robust launch.

---

## Table of Contents

1. [Security](#1-security)
2. [Database & Migrations](#2-database--migrations)
3. [Configuration & Environment](#3-configuration--environment)
4. [API & Backend](#4-api--backend)
5. [Frontend](#5-frontend)
6. [Infrastructure & Deployment](#6-infrastructure--deployment)
7. [Monitoring & Observability](#7-monitoring--observability)
8. [Testing](#8-testing)
9. [Data Validation & Business Logic](#9-data-validation--business-logic)
10. [Missing Features](#10-missing-features)

---

## 1. Security

### CRITICAL

| Issue | Location | Fix |
|-------|----------|-----|
| **JWT fallback secrets** | `auth.service.ts` lines 231, 393 | Remove `\|\| 'your-refresh-secret'`. Throw if `JWT_SECRET` or `JWT_REFRESH_SECRET` are not set in production. |
| **Generic Error on auth refresh** | `auth.controller.ts` line 86 | Replace `throw new Error(...)` with `throw new UnauthorizedException('Refresh token not found')` for proper HTTP status. |
| **Swagger exposed without auth** | `main.ts` | Disable Swagger in production (`NODE_ENV === 'production'`) or protect with auth. `/api/docs` exposes full API surface. |
| **CORS allows localhost in prod** | `main.ts` lines 20–21 | Remove `localhost`/`127.0.0.1` from allowed origins when `NODE_ENV === 'production'`. |

### HIGH

| Issue | Location | Fix |
|-------|----------|-----|
| **Rate limiting not applied** | `app.module.ts` | `ThrottlerModule` is configured but `ThrottlerGuard` is never applied. Add `app.useGlobalGuards(new ThrottlerGuard(...))` or `@UseGuards(ThrottlerGuard)` on sensitive routes. |
| **Auth endpoints unthrottled** | `/auth/login`, `/auth/register`, `/auth/otp/*` | Add stricter rate limits (e.g. 5 req/min) to prevent brute force and credential stuffing. |
| **Body size 50MB** | `main.ts` | Reduce to 1–2MB for JSON. Use pre-signed URLs for large uploads. |
| **OTP logged to console** | `auth.service.ts` line 193 | Remove or gate behind `NODE_ENV !== 'production'`. |
| **No CSRF protection** | Forms / APIs | Add CSRF tokens for state-changing requests if using cookie-based auth. |

### MEDIUM

| Issue | Location | Fix |
|-------|----------|-----|
| **Helmet defaults** | `main.ts` | Review and tune helmet config (CSP, X-Frame-Options, etc.) for your frontend origins. |
| **Order creation public** | `order.controller.ts` | Consider reCAPTCHA or honeypot for anonymous order creation to reduce spam. |

---

## 2. Database & Migrations

### CRITICAL

| Issue | Location | Fix |
|-------|----------|-----|
| **No migrations** | `prisma/migrations/` | Folder is empty (only `.gitkeep`). Run `npx prisma migrate dev --name init` to create initial migration. `prisma migrate deploy` will otherwise apply nothing. |
| **Schema drift risk** | Production DB | Without migrations, schema changes require manual `db push` or scripts. Establish migration workflow. |

### HIGH

| Issue | Location | Fix |
|-------|----------|-----|
| **Seed contains demo creds** | `seed.ts` | Super admin `Admin@123` is hardcoded. Remove or use env vars; never ship default passwords. |
| **Connection pooling** | Supabase, Render | Use Session pooler for app, Direct for migrations. Ensure `DIRECT_URL` is set for `prisma migrate`. |

---

## 3. Configuration & Environment

### CRITICAL

| Issue | Location | Fix |
|-------|----------|-----|
| **Startup validation** | `main.ts` | Validate required env vars at startup (e.g. `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`) and exit with clear error if missing. |
| **Customer tenant fallback** | `customer-app/config/tenant.ts` | Default `'testera'` is unsafe for multi-tenant production. Require `NEXT_PUBLIC_TENANT_ID` or derive from domain. |

### HIGH

| Issue | Location | Fix |
|-------|----------|-----|
| **Image domains** | `next.config.js` (all apps) | `domains: ['localhost']` only. Add production domains (e.g. Vercel, custom domain, S3/CloudFront). |
| **API URL fallbacks** | `apiClient.ts`, hooks | All fall back to `localhost:3000`. Ensure `NEXT_PUBLIC_API_URL` is set in production builds. |

---

## 4. API & Backend

### CRITICAL

| Issue | Location | Fix |
|-------|----------|-----|
| **Order creation DTOs** | `order.controller.ts` | `CreateOrderRequest` is not validated with class-validator. Add DTO with `@IsArray()`, `@ValidateNested()`, `@IsUUID()`, `@Min(1)`, etc. |
| **Redis required** | Auth, OTP, optional cache | OTP and refresh token flows depend on Redis. Add graceful degradation or fail-fast if Redis is down. |

### HIGH

| Issue | Location | Fix |
|-------|----------|-----|
| **Order item limits** | `order.service.ts` | No max on `items.length` or `quantity`. Add limits (e.g. max 50 items, max quantity 10 per item). |
| **`specialInstructions` length** | Order, menu items | No max length. Add validation (e.g. 500 chars) to avoid abuse. |
| **Menu controller `data: any`** | `menu.controller.ts` | Replace with proper DTOs for create/update category, menu item, modifier group. |
| **Tenant resolution** | `TenantGuard` | SUPER_ADMIN uses `status: 'ACTIVE'`; order service uses `ACTIVE` or `TRIAL`. Align behavior. |

### MEDIUM

| Issue | Location | Fix |
|-------|----------|-----|
| **Error stack traces** | `http-exception.filter.ts` | `DEBUG_ERRORS` exposes stack in response. Ensure it is never `true` in production. |
| **WebSocket CORS** | `websocket.gateway.ts` | `origin: '*'` when `CORS_ORIGIN` unset. Restrict to known origins in production. |

---

## 5. Frontend

### HIGH

| Issue | Location | Fix |
|-------|----------|-----|
| **Tokens in localStorage** | `apiClient.ts` (admin, customer) | JWT in localStorage is XSS-vulnerable. Prefer httpOnly cookies (already used for refresh). |
| **Admin refresh flow** | `admin-app/apiClient.ts` | No token refresh on 401. Add refresh logic like customer-app or redirect to login. |
| **Customer app refresh** | `customer-app/apiClient.ts` | Reads `refreshToken` from localStorage, but auth sets it in cookie. Ensure consistency. |
| **`alert()` for errors** | Checkout, settings, etc. | Replace with proper toast/notification component. |

### MEDIUM

| Issue | Location | Fix |
|-------|----------|-----|
| **Timeout 120s** | Admin apiClient | Very long timeout for cold starts. Consider retry with exponential backoff instead. |
| **PWA/offline** | `manifest.json`, service-worker | Review if offline behavior is acceptable for production. |

---

## 6. Infrastructure & Deployment

### CRITICAL

| Issue | Location | Fix |
|-------|----------|-----|
| **CI type-check** | `.github/workflows/ci-cd.yml` | Runs `npm run type-check` but root `package.json` has no `type-check` script. Add script or remove step. |
| **Deploy steps placeholder** | `ci-cd.yml` | Staging/production deploy jobs only echo. Implement actual deploy (e.g. Vercel, Render). |

### HIGH

| Issue | Location | Fix |
|-------|----------|-----|
| **Bull/Redis for jobs** | `app.module.ts` | Bull depends on Redis. If Redis is down, queue jobs may fail. Document and test. |
| **Render cold start** | Free tier | 15 min spin-down causes long first request. Add health-check pinging or consider paid tier. |
| **Single-region** | Render, Supabase, Upstash | No multi-region. Document RTO/RPO expectations. |

### MEDIUM

| Issue | Location | Fix |
|-------|----------|-----|
| **Build artifacts** | CI | Uploads `apps/*/dist` and `apps/*/.next`. Verify paths match actual build outputs. |
| **Docker** | Dockerfiles | Ensure production Docker images use `node:*-alpine` and non-root user. |

---

## 7. Monitoring & Observability

### HIGH

| Issue | Location | Fix |
|-------|----------|-----|
| **No health endpoint** | API | Add `/api/health` (or `/health`) returning DB + Redis status for load balancers and Render. |
| **No APM/error tracking** | Global | MONITORING.md describes Sentry but it is not integrated. Add Sentry (or similar) for API and frontends. |
| **Console logging** | Multiple services | Replace with structured logger (e.g. Pino) and JSON output for log aggregation. |
| **No metrics** | API | Add Prometheus metrics or equivalent for request count, latency, errors. |

### MEDIUM

| Issue | Location | Fix |
|-------|----------|-----|
| **Prisma query logging** | Development | Ensure `log` is disabled or minimal in production. |
| **WebSocket logs** | `websocket.gateway.ts` | Reduce verbosity in production. |

---

## 8. Testing

### HIGH

| Issue | Location | Fix |
|-------|----------|-----|
| **Limited E2E coverage** | `apps/api/test/` | Only `auth.e2e-spec.ts`. Add E2E for orders, menu, tenant flows. |
| **No E2E for frontends** | `e2e/customer.spec.ts` | Single Playwright spec. Expand customer and admin flows. |
| **Test env isolation** | Jest, Playwright | Ensure tests use separate DB/Redis, never hit production. |

### MEDIUM

| Issue | Location | Fix |
|-------|----------|-----|
| **Unit test coverage** | Services | Many services lack unit tests. Prioritize order, auth, menu. |
| **Mock Redis** | E2E | E2E may require Redis. Use testcontainers or mock. |

---

## 9. Data Validation & Business Logic

### HIGH

| Issue | Location | Fix |
|-------|----------|-----|
| **Modifier validation** | `order.service.ts` | Modifiers checked by ID but not tenant-scoped. Ensure modifiers belong to tenant. |
| **Category/menu tenant** | Menu service | Verify all create/update/delete operations enforce tenantId. |
| **Price manipulation** | Order creation | Server recalculates prices from DB (good). Ensure no client-sent prices are trusted. |

### MEDIUM

| Issue | Location | Fix |
|-------|----------|-----|
| **Order status transitions** | `order.service.ts` | No guard against invalid transitions (e.g. PENDING → COMPLETED). Add state machine validation. |
| **Idempotency** | Order creation | No idempotency key. Risk of duplicate orders on retries. |

---

## 10. Missing Features

### Storage

| Issue | Location | Fix |
|-------|----------|-----|
| **Storage module empty** | `storage.module.ts` | TODO only. Images stored as base64 in DB (branding, menu). Implement S3/MinIO upload and store URLs. |
| **Image size limits** | Settings, menu forms | Client-side compression exists but no server-side validation. Reject oversized uploads. |

### Auth

| Issue | Location | Fix |
|-------|----------|-----|
| **OTP not sent** | `auth.service.ts` | "TODO: Send SMS" — OTP only in DB/Redis. Integrate Twilio or equivalent. |
| **No password reset** | Auth | Missing "Forgot password" flow. |
| **No email verification** | User model | `emailVerified` exists but no verification flow. |

### Other

| Issue | Location | Fix |
|-------|----------|-----|
| **Register wide open** | `/auth/register` | No captcha, invite-only, or approval. Consider restricting or adding captcha. |
| **No audit log** | Tenant, order, menu | No record of who changed what. Add audit table for sensitive operations. |

---

## Prioritized Action Plan

### Phase 1: Blockers (Before any production traffic)

1. Remove JWT secret fallbacks; validate env at startup.
2. Create and apply Prisma migrations.
3. Add order creation DTOs and validation.
4. Fix auth refresh to throw `UnauthorizedException`.
5. Disable or protect Swagger in production.
6. Add `type-check` script to root package.json (or fix CI).
7. Add health endpoint.

### Phase 2: Security hardening

1. Apply ThrottlerGuard globally; add stricter limits on auth.
2. Restrict CORS in production.
3. Reduce body size limit.
4. Add rate limiting to auth endpoints.
5. Remove OTP console logging.

### Phase 3: Production readiness

1. Implement storage (S3) for images.
2. Add Sentry (or similar) for errors.
3. Add structured logging.
4. Expand E2E tests.
5. Fix token storage (cookies vs localStorage).
6. Add production image domains to Next.js config.

### Phase 4: Resilience & scale

1. Add Redis fallback/graceful degradation.
2. Add order idempotency.
3. Add audit logging.
4. Implement OTP SMS delivery.
5. Add password reset flow.

---

## Quick Reference: Required Env Vars

**API (production):**

```
DATABASE_URL=       # Required
DIRECT_URL=         # Required for migrations
REDIS_URL=          # Required (OTP, optional cache)
JWT_SECRET=         # Required, no default
JWT_REFRESH_SECRET= # Required, no default
CORS_ORIGIN=        # Comma-separated production origins
NODE_ENV=production
```

**Frontend (production):**

```
NEXT_PUBLIC_API_URL=           # e.g. https://api.yourdomain.com/api
NEXT_PUBLIC_CUSTOMER_APP_URL=  # For admin menu link
NEXT_PUBLIC_TENANT_ID=         # For single-tenant customer app
```

---

*Document generated from codebase analysis. Revisit after each major release.*
