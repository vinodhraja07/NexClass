# ==============================================================================
# Stage 1: Build Static Web Application
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/terminology/package.json packages/terminology/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/

RUN npm ci

# Copy sources
COPY packages/shared/ packages/shared/
COPY packages/terminology/ packages/terminology/
COPY apps/web/ apps/web/

# Build static SPA bundle with Vite
RUN npm run build:shared && npm run build -w @nexclass/web

# ==============================================================================
# Stage 2: Production Nginx Server
# ==============================================================================
FROM nginx:1.27-alpine AS runner

# Remove default static html and placeholder configuration
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom Nginx gateway configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output into Nginx html root
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

# Health check verifying root HTTP response
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
