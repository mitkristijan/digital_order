FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/admin-app/package.json ./apps/admin-app/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/

RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build --workspace=@digital-order/types
RUN npm run build --workspace=@digital-order/utils
RUN npm run build --workspace=@digital-order/config
RUN npm run build --workspace=@digital-order/ui
RUN cd apps/admin-app && npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/admin-app/public ./apps/admin-app/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-app/.next/static ./apps/admin-app/.next/static

USER nextjs

EXPOSE 3002

ENV PORT 3002

CMD ["node", "apps/admin-app/server.js"]
