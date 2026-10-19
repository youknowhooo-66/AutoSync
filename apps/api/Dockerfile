FROM node:22-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS builder
# Check https://turbo.build/repo/docs/handbook/deploying-with-docker
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
COPY . .
RUN turbo prune back --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install

# Build the project
COPY --from=builder /app/out/full/ .
# Generate prisma client before build
RUN pnpm --filter back exec prisma generate
RUN pnpm turbo run build --filter=back...

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache openssl

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs
USER expressjs

# Copy Prisma schema and generated client (if not bundled)
COPY --from=installer --chown=expressjs:nodejs /app/apps/api/prisma ./apps/api/prisma
# Copy node_modules for production dependencies
COPY --from=installer --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=expressjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Copy dist
COPY --from=installer --chown=expressjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=installer --chown=expressjs:nodejs /app/apps/api/package.json ./apps/api/package.json
# ts-node needs it to run prisma/*.ts scripts (bootstrap-admin, seed) inside the image.
COPY --from=installer --chown=expressjs:nodejs /app/apps/api/tsconfig.json ./apps/api/tsconfig.json

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Migrations are applied on start (safe, forward-only). The demo seed
# (prisma/seed.ts) DELETES ALL DATA and must never run here.
# First admin: docker compose exec -w /app/apps/api api ./node_modules/.bin/ts-node prisma/bootstrap-admin.ts
CMD ["sh", "-c", "./apps/api/node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/server.js"]
