# Dispatch for Worker 4 — Milestone 4: Docker Production Infrastructure (R2)

- **Identity**: teamwork_preview_worker
- **Role**: DevOps & Docker Infrastructure Worker
- **Working Directory**: E:\mnt\e\NexClass\.agents\teamwork\worker_m4
- **Project Root**: E:\mnt\e\NexClass
- **Authoritative Request**: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
- **Project Scope Document**: E:\mnt\e\NexClass\PROJECT.md
- **Explorer Survey Reference**: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_3\survey_devops_report.md
- **Parent Conversation ID**: 9e5960ea-425e-42b2-ac85-94fd33a66831

## File Ownership (Strict & Exclusive)
You exclusively own and may edit or create these files:
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `apps/web/nginx.conf`
- `docker-compose.yml`
- `.env.example`

Do NOT touch any source files in `apps/api/src/` or `apps/web/src/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Requirements (R2)
1. **`apps/api/Dockerfile`**:
   - Multi-stage build with `node:20-alpine`:
     - Stage 1 `builder`: Copies workspace package files, installs dependencies, builds `dist/server.js` via `npm run build -w @nexclass/api`.
     - Stage 2 `deps`: Installs production dependencies only (`npm ci --omit=dev --ignore-scripts`).
     - Stage 3 `runner`: Minimal `node:20-alpine`, runs as non-root user `node`, copies production `node_modules` and `apps/api/dist`, creates `/app/recordings` directory with proper ownership `chown -R node:node /app`, exposes port 4000.
     - Healthcheck: Native Node fetch command verifying `http://localhost:4000/api/health` returns ok.
2. **`apps/web/Dockerfile`**:
   - Multi-stage build:
     - Stage 1 `builder`: Node Alpine container installing dependencies and building production Vite static bundle (`npm run build -w @nexclass/web`).
     - Stage 2 `runner`: Lightweight `nginx:1.27-alpine` copying static assets from builder to `/usr/share/nginx/html`, copies custom `apps/web/nginx.conf` to `/etc/nginx/conf.d/default.conf`.
     - Healthcheck: `wget -qO- http://localhost:80/ || exit 1`. Exposes port 80.
3. **`apps/web/nginx.conf`**:
   - Single-Page Application (SPA) routing with `try_files $uri $uri/ /index.html`.
   - Gzip compression for html, css, js, json, svg.
   - Long-term caching for immutable assets (`/assets/` cache-control 1y immutable).
   - High upload limit: `client_max_body_size 250M;` to support large meeting video recording uploads.
   - Reverse proxy for `/api/` and `/socket.io/` to backend `http://api:4000` with WebSocket upgrade headers (`Upgrade $http_upgrade`, `Connection "upgrade"`), and proxy timeouts (300s).
4. **`docker-compose.yml`**:
   - Multi-container orchestration:
     - `mongodb`: image `mongo:7.0`, port 27017, volume `mongodb_data:/data/db`, healthcheck using `mongosh --eval 'db.adminCommand("ping")'`.
     - `redis`: image `redis:7-alpine`, port 6379, volume `redis_data:/data`, healthcheck using `redis-cli ping`.
     - `api`: builds `apps/api/Dockerfile`, port 4000, environment config, depends on `mongodb` and `redis` with `condition: service_healthy`, volume `recordings_data:/app/recordings`, healthcheck on `/api/health`.
     - `web`: builds `apps/web/Dockerfile`, port 3000 (mapped to container port 80), depends on `api` with `condition: service_healthy`.
   - Named persistent volumes: `mongodb_data`, `redis_data`, `recordings_data`.
5. **`.env.example`**:
   - Comprehensive environment template with production configurations, warnings about changing `JWT_SECRET` in production, port settings, and database URIs.
6. **Verification**:
   - Validate docker-compose syntax: `docker compose -f docker-compose.yml config` passes without errors.
   - Write your handoff report to `handoff.md`.

## 2026-10-23T14:53:19Z
You are Worker 4 implementing Milestone 4: Docker Production Infrastructure (R2).
Working directory: E:\mnt\e\NexClass\.agents\teamwork\worker_m4
Project root: E:\mnt\e\NexClass
Read ORIGINAL_REQUEST.md at: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
Read PROJECT.md at: E:\mnt\e\NexClass\PROJECT.md
Read DISPATCH.md at: E:\mnt\e\NexClass\.agents\teamwork\worker_m4\DISPATCH.md
Read survey findings at: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_3\survey_devops_report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
- apps/api/Dockerfile
- apps/web/Dockerfile
- apps/web/nginx.conf
- docker-compose.yml
- .env.example

Tasks:
1. Create apps/api/Dockerfile: 3-stage Node 20 Alpine container with builder, deps, runner (non-root user node, /app/recordings volume, native Node fetch healthcheck on /api/health).
2. Create apps/web/Dockerfile: 2-stage build + Nginx Alpine runner with healthcheck.
3. Create apps/web/nginx.conf: SPA routing, gzip, 250MB client_max_body_size, proxy pass for /api/ and /socket.io/ to backend.
4. Create docker-compose.yml: orchestrating MongoDB 7.0, Redis 7 Alpine, API, and Web with healthchecks, environment variables, and 3 named persistent volumes (mongodb_data, redis_data, recordings_data).
5. Create .env.example with comprehensive production environment settings and JWT secret warnings.
6. Verify docker compose -f docker-compose.yml config passes validation without errors.
7. Write handoff.md and notify orchestrator via send_message when complete.

