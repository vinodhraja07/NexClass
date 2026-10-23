# ==============================================================================
# Stage 1: Build & Bundle
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations and package manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/terminology/package.json packages/terminology/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# Install full dependencies including devDependencies (esbuild, typescript)
RUN npm ci

# Copy source code for API and internal shared libraries
COPY packages/shared/ packages/shared/
COPY packages/terminology/ packages/terminology/
COPY apps/api/ apps/api/

# Build internal packages and bundle API server
RUN npm run build:shared && npm run build -w @nexclass/api

# ==============================================================================
# Stage 2: Production Dependencies Prune
# ==============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/terminology/package.json packages/terminology/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# Install strictly production dependencies
RUN npm ci --omit=dev --ignore-scripts

# ==============================================================================
# Stage 3: Minimal Production Runtime
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV RECORDINGS_PATH=/app/recordings
ENV RECORDINGS_DIR=/app/recordings

# Create recording archive directory and assign ownership to node user
RUN mkdir -p /app/recordings && chown -R node:node /app

# Copy production node_modules from deps stage
COPY --from=deps --chown=node:node /app/node_modules /app/node_modules
COPY --from=deps --chown=node:node /app/package.json /app/package.json
COPY --from=deps --chown=node:node /app/packages /app/packages

# Copy bundled application artifact from builder stage
COPY --from=builder --chown=node:node /app/apps/api/dist /app/apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json /app/apps/api/package.json

# Switch to non-root security context
USER node

EXPOSE 4000

# Native healthcheck using Node 20 built-in fetch
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 4000) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "apps/api/dist/server.js"]
