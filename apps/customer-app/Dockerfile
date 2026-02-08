FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/customer-app/package.json ./apps/customer-app/
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
RUN cd apps/customer-app && npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/customer-app/public ./apps/customer-app/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-app/.next/static ./apps/customer-app/.next/static

USER nextjs

EXPOSE 3001

ENV PORT 3001

CMD ["node", "apps/customer-app/server.js"]
