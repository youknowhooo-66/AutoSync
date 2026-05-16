FROM node:22-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS builder
# Check https://turbo.build/repo/docs/handbook/deploying-with-docker
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
COPY . .
RUN turbo prune front --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install

# Build the project
COPY --from=builder /app/out/full/ .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm turbo run build --filter=front...

FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

# Copy custom nginx config
COPY --from=installer /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=installer /app/apps/web/dist .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
