# NexClass DevOps, Docker Deployment & Concurrency Testing Architecture Survey

**Explorer**: Explorer 3 (DevOps & Concurrency Test Explorer)  
**Date**: 2026-10-23  
**Project Root**: `E:\mnt\e\NexClass`  
**Working Directory**: `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_3`  
**Authoritative Request**: `E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md`

---

## 1. Executive Summary

NexClass is a multilingual real-time virtual classroom monorepo structured using npm workspaces (`apps/api`, `apps/web`, `packages/shared`, `packages/terminology`). The core application provides WebRTC mesh video/audio conferencing, real-time speech-to-text with terminology protection, machine translation into Indic languages (Hindi, Tamil, Bengali, Marathi, Odia), and text-to-speech with a zero-key Odia phonetic fallback engine.

This survey establishes the complete, production-grade DevOps and concurrency testing infrastructure to support the production hardening requirements:
1. **Multi-Stage Containerization**:
   - `@nexclass/api`: 3-stage Node 20 Alpine container (`builder` -> `deps` -> `runner`) running as non-root `node` user with healthcheck against `/api/health`.
   - `@nexclass/web`: 2-stage container (`builder` -> `runner` using `nginx:1.27-alpine`) providing gzip compression, aggressive static asset caching, SPA routing fallback, and reverse proxying for `/api/` (supporting 250MB+ meeting recording uploads) and `/socket.io/` (WebSocket upgrades).
2. **Container Orchestration**:
   - `docker-compose.yml` orchestrating MongoDB 7.0, Redis 7 Alpine, API server, and Web frontend with container healthchecks, network segmentation, and 3 persistent named volumes (`mongodb_data`, `redis_data`, `recordings_data`).
   - `.env.example` capturing all environment variables with strict production security validations (e.g., rejecting default `JWT_SECRET`).
3. **Multi-Peer Concurrency Stress Suite**:
   - Architecture for simulating 8+ concurrent participants (1 Teacher + 7 Students across Hindi, Tamil, Bengali, Marathi, Odia, English).
   - Verifying WebRTC mesh signaling stability (28 peer pairs, 112+ messages exchanged concurrently), room event fanout, interim and finalized caption streaming, multi-user chat fanout (64 deliveries), and Odia speech synthesis fallback concurrency without race conditions or memory leaks.

---

## 2. Codebase Baseline & Workspace Audit

### 2.1 Workspace Structure & Scripts
From `package.json`:
- **Workspaces**: `apps/*`, `packages/*`
- **Engine**: Node `>=20`
- **Internal Packages**:
  - `@nexclass/shared` (`packages/shared/src/index.ts`): Type definitions, shared constants (`LANGUAGES`), translation dictionaries. Consumed directly as TypeScript source.
  - `@nexclass/terminology` (`packages/terminology/src/index.ts`): Technical term extraction, Unicode Private Use Area marker protection (`protectTerms`), and restoration (`restoreTerms`).
- **Applications**:
  - `@nexclass/api` (`apps/api`): Node.js + Express + Socket.IO API server. Bundled with `esbuild src/server.ts --bundle --platform=node --format=esm --target=node20 --packages=external --outfile=dist/server.js`.
  - `@nexclass/web` (`apps/web`): React 18 + Vite + TailwindCSS + Motion virtual classroom web client. Built with `vite build` to `apps/web/dist`.

### 2.2 Baseline Verification Results
- **Vitest Unit/Integration Tests**:  
  `npm test --prefix E:\mnt\e\NexClass -w @nexclass/api`
  - Result: **100% Passed** (22 tests passed across 1 test file in 1.17s).
- **TypeScript Typecheck**:  
  `npm run typecheck --prefix E:\mnt\e\NexClass`
  - Result: **0 errors** across `@nexclass/api` (`tsc --noEmit`) and `@nexclass/web` (`tsc --noEmit`).
- **Production Build**:  
  `npm run build --prefix E:\mnt\e\NexClass`
  - Result: **0 errors**. Bundled `apps/api/dist/server.js` (164.1 kB) and `apps/web/dist` (Vite production bundle in 2.66s).

### 2.3 Dependency Analysis for Dockerization
- In `apps/api/package.json`: All dependencies are pure JavaScript (`bcryptjs`, `cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `ioredis`, `jsonwebtoken`, `mongoose`, `socket.io`, `zod`). There are **no native C/C++ addons** requiring `python3`, `make`, or `gcc`. This enables using lightweight `node:20-alpine` directly.
- In `apps/api/dist/server.js`: `@nexclass/shared` and `@nexclass/terminology` are inlined into the bundle by esbuild, while external npm packages remain imported. Hence, the runtime container only requires hoisted production `node_modules`.

---

## 3. Database, Storage, and Infrastructure Requirements

### 3.1 MongoDB 7.0
- **Purpose**: Persistent storage for users, meetings, participants, transcripts (`TranscriptSegmentModel`), translations (`TranslationSegmentModel`), voices (`VoiceSegmentModel`), and chat messages (`ChatMessageModel`).
- **Connection Configuration**: In `apps/api/src/db/mongo.ts`, connects via `MONGODB_URI` with fallback to in-memory store if absent.
- **Production Container**: `mongo:7.0`
- **Default Port**: `27017`
- **Volume Mount**: `mongodb_data:/data/db`
- **Healthcheck Command**:  
  `echo 'db.runCommand({ping: 1}).ok' | mongosh --quiet mongodb://localhost:27017/nexclass | grep 1`

### 3.2 Redis 7 Alpine
- **Purpose**: Real-time room caching, participant presence state, session invalidation, and rate limiting.
- **Connection Configuration**: In `apps/api/src/db/redis.ts`, connects via `REDIS_URL` with fallback to in-process memory cache if absent.
- **Production Container**: `redis:7-alpine`
- **Default Port**: `6379`
- **Volume Mount**: `redis_data:/data`
- **Startup Command**: `redis-server --appendonly yes` (AOF persistence enabled)
- **Healthcheck Command**: `redis-cli ping`

### 3.3 Meeting Recording Archive Storage (R1 / R2 Integration)
- **Storage Requirement**: Browser MediaRecorder records composited meeting audio/video canvas and uploads completed `.webm` or `.mp4` archives to the server on call completion.
- **API Endpoint**: `POST /api/meetings/:code/recordings` (upload) and `GET /api/meetings/:code/recordings` (list and stream).
- **Filesystem Path**: Configured via `RECORDINGS_PATH` (defaults to `/app/recordings` in container, `./recordings` in local dev).
- **Container Volume Mount**: `recordings_data:/app/recordings`
- **Permissions**: Owned by non-root user `node` (`uid: 1000, gid: 1000`).
- **Nginx Upload Limit**: `client_max_body_size 250M;` must be configured in Nginx to prevent `HTTP 413 Payload Too Large` errors during recording uploads.

### 3.4 Security Guardrail (JWT_SECRET)
In `apps/api/src/config/env.ts` (lines 116-120):
```ts
if (env.isProduction && env.jwtSecret === "nexclass-development-secret-change-me") {
  console.error("Refusing to start: JWT_SECRET must be changed in production.");
  process.exit(1);
}
```
In production (`NODE_ENV=production`), the container will immediately exit with code 1 if `JWT_SECRET` is left as the default. The Docker Compose file and `.env.example` must specify a valid production secret.

---

## 4. Multi-Stage Dockerfile Specifications

### 4.1 `@nexclass/api` Dockerfile (`apps/api/Dockerfile`)

```dockerfile
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

# Create recording archive directory and assign ownership to node user
RUN mkdir -p /app/recordings && chown -R node:node /app

# Copy production node_modules from deps stage
COPY --from=deps --chown=node:node /app/node_modules /app/node_modules
COPY --from=deps --chown=node:node /app/package.json /app/package.json

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
```

---

### 4.2 `@nexclass/web` Dockerfile (`apps/web/Dockerfile`)

```dockerfile
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
```

---

### 4.3 Nginx Reverse Proxy Configuration (`apps/web/nginx.conf`)

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/x-javascript
        application/json
        application/xml
        application/rss+xml
        image/svg+xml;

    # Maximum file upload size for meeting video recordings
    client_max_body_size 250M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static assets with 1-year immutable caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # API Gateway Reverse Proxy
    location /api/ {
        proxy_pass http://api:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Socket.IO Realtime WebSocket Gateway
    location /socket.io/ {
        proxy_pass http://api:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # SPA routing fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Disable caching for index.html to prevent stale SPA versions
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }
}
```

---

### 4.4 `.dockerignore`

```
node_modules
dist
.git
.agents
.claude
documentation
*.log
dev-server.log
test-output.txt
.env
.env.local
.DS_Store
Thumbs.db
```

---

## 5. Production `docker-compose.yml` Specification

```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: nexclass-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: nexclass
    ports:
      - "${MONGO_PORT:-27017}:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: ["CMD-SHELL", "echo 'db.runCommand({ping: 1}).ok' | mongosh --quiet mongodb://localhost:27017/nexclass | grep 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - nexclass_network

  redis:
    image: redis:7-alpine
    container_name: nexclass-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s
    networks:
      - nexclass_network

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: nexclass-api
    restart: unless-stopped
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 4000
      CLIENT_ORIGIN: ${CLIENT_ORIGIN:-http://localhost:3000,http://localhost:80,http://localhost:5173}
      MONGODB_URI: mongodb://mongodb:27017/nexclass
      MONGODB_DB_NAME: nexclass
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-nexclass_production_secret_key_change_in_env_2026}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      RECORDINGS_PATH: /app/recordings
      STUN_SERVERS: ${STUN_SERVERS:-stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302}
      TURN_SERVER_URL: ${TURN_SERVER_URL:-}
      TURN_USERNAME: ${TURN_USERNAME:-}
      TURN_PASSWORD: ${TURN_PASSWORD:-}
      ASR_PROVIDER: ${ASR_PROVIDER:-browser}
      TRANSLATION_PROVIDER: ${TRANSLATION_PROVIDER:-none}
      TTS_PROVIDER: ${TTS_PROVIDER:-google-translate-tts-fallback}
      TERM_ASSIST_PROVIDER: ${TERM_ASSIST_PROVIDER:-none}
      ALLOW_GUEST_JOIN: ${ALLOW_GUEST_JOIN:-true}
      RATE_LIMIT_WINDOW_MS: ${RATE_LIMIT_WINDOW_MS:-60000}
      RATE_LIMIT_MAX: ${RATE_LIMIT_MAX:-300}
    ports:
      - "${API_PORT:-4000}:4000"
    volumes:
      - recordings_data:/app/recordings
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:4000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 15s
    networks:
      - nexclass_network

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: nexclass-web
    restart: unless-stopped
    depends_on:
      api:
        condition: service_healthy
    ports:
      - "${WEB_PORT:-3000}:80"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:80/ || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - nexclass_network

volumes:
  mongodb_data:
    name: nexclass_mongodb_data
  redis_data:
    name: nexclass_redis_data
  recordings_data:
    name: nexclass_recordings_data

networks:
  nexclass_network:
    name: nexclass_network
    driver: bridge
```

---

## 6. Environment Specification (`.env.example`)

```env
# ==============================================================================
# NexClass Production Configuration Template
# ==============================================================================

# Node Environment
NODE_ENV=production

# Exposed Ports
WEB_PORT=3000
API_PORT=4000
MONGO_PORT=27017
REDIS_PORT=6379

# Allowed Client Origins for CORS (comma-separated)
CLIENT_ORIGIN=http://localhost:3000,http://localhost:80,http://localhost:5173

# Database & Cache URIs (Inside Docker network)
MONGODB_URI=mongodb://mongodb:27017/nexclass
MONGODB_DB_NAME=nexclass
REDIS_URL=redis://redis:6379

# Authentication & Security
# WARNING: Must be replaced with a secure random key (at least 32 characters)
JWT_SECRET=nexclass_production_jwt_secret_replace_with_strong_key_32chars
JWT_EXPIRES_IN=7d

# Meeting Recordings Archive Directory (Inside API container)
RECORDINGS_PATH=/app/recordings

# WebRTC STUN/TURN ICE Servers
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_SERVER_URL=
TURN_USERNAME=
TURN_PASSWORD=

# Automatic Speech Recognition (ASR)
# Options: browser (Web Speech API in participant browser), remote-asr
ASR_PROVIDER=browser
ASR_API_KEY=
ASR_API_URL=

# Multilingual Translation
# Options: none, google, deepl, indictrans2, generic-http
TRANSLATION_PROVIDER=none
TRANSLATION_API_KEY=
TRANSLATION_API_URL=
TRANSLATION_MODEL=indic-trans2

# Text-to-Speech (TTS)
# Options: google-translate-tts-fallback (zero-key with Odia phonetic alignment), google-tts, azure-tts, generic-tts, none
TTS_PROVIDER=google-translate-tts-fallback
TTS_API_KEY=
TTS_API_URL=

# Technical Terminology Engine
TERM_ASSIST_PROVIDER=none
TERM_ASSIST_API_KEY=

# Classroom Access & Rate Limiting
ALLOW_GUEST_JOIN=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=300
```

---

## 7. Automated Multi-Peer Concurrency Stress Test Suite (R5)

### 7.1 Architecture of `scripts/stress-concurrency.ts`

The stress test suite is designed as an automated, deterministic Node/TypeScript script (`scripts/stress-concurrency.ts`) executable via:
`npm run test:stress` or `npx tsx scripts/stress-concurrency.ts`

It implements an 8-phase execution pipeline:

```
[Phase 1: Environment Bootstrap]
       │
       ▼
[Phase 2: Meeting Creation via REST]
       │
       ▼
[Phase 3: Concurrent 8-Participant Join (REST + Socket.IO)]
       │
       ▼
[Phase 4: WebRTC Mesh Signaling Storm (28 Peer Pairs = 112+ Messages)]
       │
       ▼
[Phase 5: Caption Streaming & Terminology Protection Concurrency]
       │
       ▼
[Phase 6: Multi-Participant Chat Fanout Stress (128 Messages Delivered)]
       │
       ▼
[Phase 7: Odia TTS Fallback Concurrency & Heap Leak Check]
       │
       ▼
[Phase 8: Clean Tear-Down & Benchmark Report Generation]
```

### 7.2 Detailed Phase Breakdown

#### Phase 1: Environment Bootstrap & Dual-Mode Connection
- Check if external server is running (`process.env.API_URL` or `http://localhost:4000`).
- If not running, dynamically bootstrap the in-process server via `bootstrap({ port: 0 })` using ephemeral port. This ensures the stress test can run in CI without requiring pre-started Docker containers or external daemons.

#### Phase 2: Meeting Initialization
- Host registers (`POST /api/auth/register`) or logs in (`POST /api/auth/login`).
- Host creates meeting (`POST /api/meetings`) with title `"Stress Test Meeting"` and language `"en"`.

#### Phase 3: 8+ Concurrent Participant Join
Simulate 8 distinct participants with diverse linguistic configurations:
1. Teacher (`en`, Host)
2. Priya (`hi`, Hindi)
3. Karthi (`ta`, Tamil)
4. Subhash (`bn`, Bengali)
5. Sneha (`mr`, Marathi)
6. Biswajit (`or`, Odia)
7. Ananya (`hi`, Hindi)
8. Rohan (`en`, English)

- Execute `POST /api/meetings/:code/join` concurrently via `Promise.all` to fetch guest tokens.
- Open 8 concurrent `socket.io-client` connections with auth tokens.
- Emit `meeting:join` on all 8 sockets simultaneously.
- Verify:
  - All 8 receive `meeting:joined` with complete participant roster.
  - Room fanout: Sockets receive `participant:joined` broadcasts from subsequently joining peers ($0+1+2+3+4+5+6+7 = 28$ broadcast events).
  - 0 connection drops or timeouts.

#### Phase 4: WebRTC Mesh Signaling Storm
- In an 8-peer mesh, total bidirectional pairs = $8 \times 7 / 2 = 28$ pairs.
- For every pair $(P_i, P_j)$ with $P_i.\text{id} < P_j.\text{id}$:
  - $P_i$ emits `webrtc:offer` targeting $P_j$.
  - $P_j$ verifies receipt of `webrtc:offer` with `fromId === Pi.id` and emits `webrtc:answer` targeting $P_i$.
  - $P_i$ verifies receipt of `webrtc:answer` with `fromId === Pj.id`.
  - Both emit `webrtc:ice` candidate messages.
- Total signaling messages relayed through Socket.IO:
  - 28 offers + 28 answers + 56 ICE candidates = **112 signaling messages** sent concurrently.
- Metrics verified:
  - 100% signaling delivery rate (112/112).
  - Average and 95th percentile signaling latency.
  - 0 misrouted messages or dropped sockets.

#### Phase 5: Caption Streaming & Terminology Concurrency
- Teacher socket emits rapid interim updates (`caption:interim`).
- All 7 students verify receipt of interim captions.
- Teacher emits finalized caption segment (`caption:original`):
  `"The eigenvalue and angular velocity determine system stability."`
- Verify pipeline execution:
  - Server emits broadcast `caption:segment` with `status: "processing"`.
  - Terminology engine protects `"eigenvalue"` and `"angular velocity"`.
  - Server emits broadcast `caption:segment` with `status: "complete"`.
  - All 8 participants receive both processing and complete envelopes.

#### Phase 6: Multi-Participant Chat Fanout Stress
- All 8 participants send 2 chat messages simultaneously (`chat:send`) in parallel.
- Total messages sent = 16.
- Total received broadcasts across all 8 participants = $16 \times 8 = \mathbf{128\text{ deliveries}}$.
- Verify 100% delivery without message loss, order corruption, or socket stalls.

#### Phase 7: Zero-Key Odia Speech Synthesis Fallback Concurrency
- **Phonetic Alignment Stress**: Run 50 complex Odia strings through `odiaToDevanagariPhonetic` concurrently; verify Unicode character bounds (U+0B00..U+0B7F translated to U+0900..U+097F with special handling for Odia `ୱ` to Devanagari `व`).
- **Concurrent Synthesis & In-Flight Deduping**:
  - Send 8 concurrent synthesis requests for identical Odia text. Verify that cache lookups or coalescing resolve cleanly without race conditions.
- **Cache Boundary Stress**:
  - Run 200 distinct synthesis requests to exercise `FALLBACK_TTS_CACHE_MAX = 150`.
  - Verify that `fallbackTtsCache.size <= 150` (FIFO eviction functions properly).
- **Memory Leak Check**:
  - Record `process.memoryUsage().heapUsed` before and after test loop.
  - Verify heap growth delta is bounded (< 5MB) and zero circular reference leaks.

#### Phase 8: Clean Tear-Down
- All participants emit `meeting:leave` and disconnect.
- Server updates participant records with `leftAt`.
- Print formatted benchmark summary table.

---

### 7.3 Reference Implementation Outline for `scripts/stress-concurrency.ts`

```ts
import { io, Socket } from "socket.io-client";
import { odiaToDevanagariPhonetic, synthesizeFallbackSpeech } from "../apps/api/src/services/providers";

interface ParticipantSession {
  name: string;
  language: string;
  token?: string;
  participantId?: string;
  socket?: Socket;
  receivedSignals: { offers: number; answers: number; ice: number };
  receivedChats: number;
  receivedCaptions: number;
}

export async function runConcurrencyStressTest(targetUrl?: string) {
  console.log("=== NexClass Concurrency & Stress Test Suite (8+ Peers) ===");
  const startTime = Date.now();
  
  // 1. Setup Server & Meeting
  // 2. Concurrently join 8 participants
  // 3. Fire 28-pair WebRTC mesh signaling storm
  // 4. Stream interim and final captions
  // 5. Broadcast multi-user chat messages
  // 6. Test Odia TTS fallback concurrency & memory delta
  // 7. Tear down cleanly & print results table
}
```

---

## 8. Verification & Validation Commands

### 8.1 Docker & Deployment Verification
```powershell
# 1. Validate Docker Compose syntax and variable interpolation
docker compose -f docker-compose.yml config

# 2. Build multi-stage images
docker compose -f docker-compose.yml build

# 3. Start containers in detached mode
docker compose -f docker-compose.yml up -d

# 4. Verify container statuses and healthchecks
docker compose -f docker-compose.yml ps

# 5. Verify API healthcheck endpoint
curl -f http://localhost:4000/api/health
# Expected output: {"ok":true,"service":"nexclass-api","time":"..."}

# 6. Verify Web static asset serving & reverse proxy
curl -I http://localhost:3000/
# Expected output: HTTP/1.1 200 OK

curl -f http://localhost:3000/api/health
# Expected output: {"ok":true,"service":"nexclass-api","time":"..."}

# 7. Check volume persistence
docker volume ls | grep nexclass
```

### 8.2 Concurrency & Test Suite Verification
```powershell
# 1. Run full unit and integration test suite
npm test --prefix E:\mnt\e\NexClass -w @nexclass/api

# 2. Run TypeScript checks across monorepo
npm run typecheck --prefix E:\mnt\e\NexClass

# 3. Run production build across monorepo
npm run build --prefix E:\mnt\e\NexClass

# 4. Run automated 8-peer concurrency stress test
npx --prefix E:\mnt\e\NexClass tsx scripts/stress-concurrency.ts
```

---

## 9. Implementation Checklist for Subsequent Engineers

| Target Component | File Path | Status | Key Specification |
|---|---|---|---|
| API Dockerfile | `apps/api/Dockerfile` | Designed | 3-stage Node 20 Alpine, non-root user `node`, healthcheck `/api/health`, `/app/recordings` |
| Web Dockerfile | `apps/web/Dockerfile` | Designed | 2-stage build + `nginx:1.27-alpine` |
| Nginx Config | `apps/web/nginx.conf` | Designed | Gzip, SPA routing, asset caching, `/api` proxy (250MB limit), `/socket.io` proxy |
| Compose File | `docker-compose.yml` | Designed | MongoDB 7, Redis 7, API, Web, 3 volumes, 4 healthchecks |
| Environment | `.env.example` | Designed | All production vars, JWT secret validation warning |
| Stress Suite | `scripts/stress-concurrency.ts` | Designed | 8 peers, 28 mesh pairs, 112 signals, 128 chats, Odia TTS concurrency |
| Root Script | `package.json` | Designed | Add `"test:stress": "tsx scripts/stress-concurrency.ts"` |
