# Orchestration Plan — NexClass

## Objectives
Deliver full production hardening, advanced UI/UX polish, and fluid animations for NexClass according to ORIGINAL_REQUEST.md:
1. R1 & R4: In-Meeting Recording Pipeline + Google Meet UI Integration & Notification Polish
2. R2: Docker Production Deployment Infrastructure
3. R3: Advanced Classroom UI/UX Polish & Fluid Animations (motion/react, equalizers, captions, reduced motion)
4. R5: Automated Multi-Peer Concurrency Stress Test Suite (8+ participants, WebRTC signaling, Odia speech synthesis fallback)

Quality Gates:
- 100% of existing Vitest tests pass (`npm test -w @nexclass/api`)
- TypeScript check passes with 0 errors (`npm run typecheck`)
- Vite build succeeds (`npm run build -w @nexclass/web`)
- Multi-container Docker configuration validated
- Concurrency stress test passes

## Phased Execution Strategy

### Phase 0: Survey & Codebase Baseline (3 Explorers)
- Explorer 1 (API & Backend Focus): Inspect `@nexclass/api`, meeting endpoints, room signaling, storage, speech synthesis fallback, existing tests and test coverage.
- Explorer 2 (Frontend & UI Focus): Inspect `@nexclass/web`, `ClassroomHeader.tsx`, `ClassroomToolbar.tsx`, `MeetSidePanel.tsx`, participant tile grid, animation libraries (`motion/react` or `framer-motion`), caption components.
- Explorer 3 (DevOps, Docker & Test Infra Focus): Inspect package.json scripts, build outputs, Docker configs if any, test configurations, vitest configs, and environment variables.

### Phase 1: PROJECT.md & Milestone Architecture
- Synthesize survey findings into `PROJECT.md` at project root with Feature Inventory, interface contracts, and module boundaries.
- Define subagent working directories and file ownership boundaries.

### Phase 2: Milestone Iterations (Explorer -> Worker -> Reviewer -> Challenger -> Auditor -> Gate)
- **Milestone 1 (Recording Pipeline & Meet Integration - R1 + R4)**:
  - Backend: Media upload endpoint / storage, `GET /api/meetings/:code/recordings` endpoint.
  - Frontend: `MediaRecorder` compositing (canvas + video + mic + translated audio), local download, server upload.
  - UI: Red pulsing REC indicator in `ClassroomHeader.tsx` with timer, record button in `ClassroomToolbar.tsx`, start/stop confirmation modal, Details tab recordings list in `MeetSidePanel.tsx`.
- **Milestone 2 (Advanced UI/UX Polish & Fluid Animations - R3)**:
  - Participant tile grid layout animations with `motion/react` (entering, exiting, re-ordering, pin-to-stage).
  - Smooth animated audio equalizer wave & subtle accent border transitions on active speaker.
  - Micro-interactions for bottom circular toolbar buttons (spring clicks, hover states, tooltip transitions).
  - Captions floating entry transitions and gloss popovers with Indic typography.
  - Strict compliance with `useReducedMotion()`.
- **Milestone 3 (Docker Deployment Infrastructure - R2)**:
  - Multi-stage Dockerfile for `@nexclass/api` (optimized Node Alpine).
  - Multi-stage Dockerfile for `@nexclass/web` (Nginx/Caddy static asset serving with gzip and SPA routing).
  - `docker-compose.yml` orchestrating MongoDB, Redis, API, and Web with healthchecks & persistent volumes.
  - `.env.example` and validation commands.
- **Milestone 4 (Multi-Peer Concurrency Stress Suite - R5)**:
  - Stress script simulating 8+ concurrent participants joining room simultaneously.
  - Validate WebRTC signaling stability, room event fanout, caption streaming under load.
  - Validate Odia speech synthesis fallback concurrency without memory leaks or race conditions.
- **Milestone 5 (Final Hardening, Gating & Delivery)**:
  - Run all Vitest tests, typecheck, Vite build, docker-compose syntax validation, and stress test execution.
  - Final Reviewers, Challengers, and Forensic Auditor verification.
  - Final human report and completion handoff.
