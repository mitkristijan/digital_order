FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/kitchen-app/package.json ./apps/kitchen-app/
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
RUN cd apps/kitchen-app && npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/kitchen-app/public ./apps/kitchen-app/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/kitchen-app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/kitchen-app/.next/static ./apps/kitchen-app/.next/static

USER nextjs

EXPOSE 3003

ENV PORT 3003

CMD ["node", "apps/kitchen-app/server.js"]
