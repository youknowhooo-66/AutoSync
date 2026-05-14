# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies for the workspace
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm install

# Copy source
COPY . .

# Build Vite App
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w apps/web

# Stage 2: Production with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
