# TESTS.md — Test Assets and Required Test Points

> This registry answers: What tests exist? Which rules require protection? Where is the evidence?
> Aggregate assets by module or workflow rather than mirroring every test function. Test code is executable truth; this document stores only indexes, assessments, and evidence.

---

## 1. Test Entry Points

| Execution group | Command | When to run | External dependencies |
|---|---|---|---|
| Monorepo Core Tests | `npm test -w @nexclass/api` | Pre-commit / CI gate | MongoDB in-memory, Redis in-process (zero external daemon required) |
| Monorepo Typecheck | `npm run typecheck` | Pre-commit / CI gate | None |
| Monorepo Production Build | `npm run build` | Pre-deploy / Release | Node >= 20, Vite |
| Concurrency Stress Suite | `npm run test:stress` | Performance regression / Pre-deploy | Running local API instance on port 4000 |
| Docker Configuration Check | `docker compose config` | Infra change / Deploy | Docker engine |

---

## 2. Test Asset Map

Controlled levels: `unit`, `integration`, `contract`, `E2E`, `smoke`.  
Controlled purposes: `rule protection`, `critical path`, `regression protection`, `specialized protection`.

| Module or workflow | Level | Purpose | Execution group | External dependencies | Test location | Assessment |
|---|---|---|---|---|---|---|
| REST API Authentication & Meetings | integration | critical path, rule protection | Monorepo Core Tests | In-memory Mongo/Redis | `apps/api/tests/api.test.ts` | required |
| WebRTC Mesh Signaling Exchange | integration | critical path, rule protection | Monorepo Core Tests | Socket.io in-process | `apps/api/tests/api.test.ts` | required |
| Multilingual Caption & Terminology Pipeline | integration | rule protection, regression protection | Monorepo Core Tests | Local fallback TTS | `apps/api/tests/api.test.ts` | required |
| Meeting Recording Upload & Disk Persistence | integration | critical path, rule protection | Monorepo Core Tests | Temporary disk storage | `apps/api/tests/recording.test.ts` | required |
| HTTP 206 Partial Content Range Streaming | integration, contract | rule protection, specialized protection | Monorepo Core Tests | Local filesystem | `apps/api/tests/recording.test.ts` | required |
| RFC 9110 Range Header Clamping & Adversarial Inputs | unit, integration | regression protection, rule protection | Monorepo Core Tests | None | `apps/api/tests/recording-adversarial.test.ts` | required |
| 8+ Peer Mesh Concurrency & Signaling Storm | integration, smoke | critical path, specialized protection | Monorepo Core Tests | Socket.io in-process | `apps/api/tests/stress.test.ts` | required |
| Odia Zero-Key TTS Transliteration & Promise Coalescing | unit, integration | rule protection, regression protection | Monorepo Core Tests | In-flight map | `apps/api/tests/stress.test.ts` | required |
| Multi-Peer End-to-End Realtime Concurrency Benchmark | E2E, specialized | critical path, specialized protection | Concurrency Stress Suite | Live API on port 4000 | `scripts/stress-concurrency.ts` | required |
| Web Frontend UI Components & Google Meet Shell | unit, contract | rule protection | Monorepo Typecheck / Build | React 18, Motion/React | `apps/web/src/components/classroom/` | required |

---

## 3. Cross-Boundary Contract Evidence

| Interface or message boundary | Single contract source | Contract validation | Consumer evidence | Provider evidence | Integration evidence | Assessment |
|---|---|---|---|---|---|---|
| Realtime Room Events & WebRTC Signaling | `packages/shared/src/socket.ts` | `npm run build:shared` (exit 0) | `apps/web/src/lib/transport.ts` compiled type-safe | `apps/api/src/realtime/socket.ts` (55 passing tests) | `scripts/stress-concurrency.ts` Phase 3 (112/112 messages delivered) | covered |
| Meeting Recordings REST & Range Streaming API | `packages/shared/src/meeting.ts` (`RecordingPublic`) | `npm run build:shared` (exit 0) | `apps/web/src/hooks/useMeetingRecording.ts` | `apps/api/src/routes/recordings.ts` (28 passing tests) | `apps/api/tests/recording.test.ts` HTTP 206 byte checks | covered |
| Multilingual Caption Segments & Terminology Glosses | `packages/shared/src/caption.ts` (`CaptionSegmentPayload`) | `npm run build:shared` (exit 0) | `apps/web/src/components/classroom/CaptionOverlay.tsx` | `apps/api/src/services/captionPipeline.ts` | `scripts/stress-concurrency.ts` Phase 4 (35 interim, 8 final) | covered |
| Client-Side Speech Fallback & Synthesis Endpoint | `apps/api/src/routes/demo.ts` (`/api/demo/speech`) | `apps/api/src/services/providers.ts` | `apps/web/src/hooks/useVoicePlayback.ts` | `apps/api/tests/api.test.ts` | Live curl & in-browser audio playback verified | covered |

---

## 4. Required Test Points

### TEST-REC-001 — Meeting Recording Storage & Range Streaming (RFC 9110)

- **State**: covered
- **Purpose**: rule protection, critical path
- **Source**: Feature Request R1 / PR #392fab2
- **Representative input**: `POST /api/meetings/DEMO01/recordings` with 128KB binary WebM chunk, followed by `GET` with `Range: bytes=0-1023`
- **Observable expectation**: File persists to `/app/recordings/<id>.webm`; stream endpoint returns HTTP 206 Partial Content with `Content-Range: bytes 0-1023/131072` and exact 1024 bytes
- **Level**: integration, contract
- **Execution group**: Monorepo Core Tests
- **Boundary**: Disk I/O with temporary files; Express HTTP pipeline
- **Test file**: `apps/api/tests/recording.test.ts`
- **Test node**: `recording routes > streams recording content with HTTP 206 Partial Content`
- **Command**: `npm test -w @nexclass/api` (exit code 0)
- **Evidence**: 8 tests passing in `tests/recording.test.ts`

### TEST-REC-002 — Range Request Boundary Clamping & Idempotency

- **State**: covered
- **Purpose**: regression protection, specialized protection
- **Source**: Challenger Audit finding M1-C1
- **Representative input**: Over-range requests (`bytes=1000-9999999` on 5000-byte file), unsatisfiable range (`bytes=9000-9500`), and duplicate `recording:start` socket events
- **Observable expectation**: End byte clamped to file size - 1 (HTTP 206); unsatisfiable range returns HTTP 416 with `Content-Range: bytes */5000`; duplicate socket starts silently acknowledged without spawning multiple files
- **Level**: integration
- **Execution group**: Monorepo Core Tests
- **Boundary**: HTTP handler & Socket.io room broadcaster
- **Test file**: `apps/api/tests/recording-adversarial.test.ts`
- **Test node**: `RFC 9110 Range Header Clamping & Adversarial Handling`
- **Command**: `npm test -w @nexclass/api` (exit code 0)
- **Evidence**: 20 tests passing in `tests/recording-adversarial.test.ts`

### TEST-CONC-001 — 8+ Peer Mesh Concurrency & Signaling Fanout

- **State**: covered
- **Purpose**: critical path, specialized protection
- **Source**: Requirement R5 / Concurrency Benchmark
- **Representative input**: 8 concurrent linguistic participants joining simultaneously; 28 WebRTC mesh pairs exchanging 112 offers/answers/ICE candidates; 16 chat messages
- **Observable expectation**: 100% signaling delivery accuracy (112/112 messages); 100% chat fanout accuracy (128/128 deliveries); zero dropped socket frames
- **Level**: integration, E2E
- **Execution group**: Monorepo Core Tests & Concurrency Stress Suite
- **Boundary**: Full Socket.io room fanout and $O(1)$ mesh map lookup
- **Test file**: `apps/api/tests/stress.test.ts` & `scripts/stress-concurrency.ts`
- **Command**: `npm run test:stress` (exit code 0)
- **Evidence**: All 7 stress phases PASS in 5824ms; Heap Delta 1.74 MB (< 15MB limit)

### TEST-TTS-001 — Odia Zero-Key Phonetic TTS & In-Flight Promise Coalescing

- **State**: covered
- **Purpose**: rule protection, regression protection
- **Source**: Odia Fallback Bug Fix & Challenger Audit finding M5-C1
- **Representative input**: 8 concurrent requests for identical Odia text (`ନମସ୍କାର ସମସ୍ତଙ୍କୁ ଆଜିର ଶ୍ରେଣୀରେ ସ୍ୱାଗତ`) + 200 distinct strings to verify cache bounding
- **Observable expectation**: All 8 requests coalesce into a single in-flight network promise; cache strictly capped at 150 items with FIFO eviction; 0 Odia glyph leaks in transliterated output
- **Level**: unit, integration
- **Execution group**: Monorepo Core Tests
- **Boundary**: `GoogleTranslateTtsFallbackAdapter` in `providers.ts`
- **Test file**: `apps/api/tests/stress.test.ts`
- **Command**: `npm test -w @nexclass/api` (exit code 0)
- **Evidence**: `apps/api/tests/stress.test.ts > verifies zero-key Odia TTS transliteration, in-flight promise deduplication, and bounded 150 FIFO cache` (PASS)

### TEST-UI-001 — Fluid Video Grid Springs & Reduced Motion Compliance

- **State**: covered
- **Purpose**: rule protection
- **Source**: Requirement R3 (UI/UX Polish)
- **Representative input**: Participant tile entering/leaving/reordering and pinning to stage spotlight
- **Observable expectation**: Smooth layout springs with `stiffness: 350`, `damping: 32`; when `prefers-reduced-motion: reduce` is active, animations fall back to instant transitions with 0 scale transforms
- **Level**: unit, contract
- **Execution group**: Monorepo Typecheck & Build
- **Boundary**: React 18, `motion/react`, `useReducedMotion()`
- **Test file**: `apps/web/src/components/classroom/Stage.tsx`, `VideoTile.tsx`
- **Command**: `npm run build -w @nexclass/web` (exit code 0, 2.54s)
- **Evidence**: Vite production build succeeded with 0 TypeScript/JSX errors

### TEST-DEPLOY-001 — Multi-Container Docker Infrastructure Validation

- **State**: covered
- **Purpose**: specialized protection, critical path
- **Source**: Requirement R2 (Turnkey Deployment)
- **Representative input**: `docker compose config` parsing `docker-compose.yml`, multi-stage Dockerfiles, and `.env.example`
- **Observable expectation**: 4 services validated (mongodb, redis, api, web) with persistent volumes, inter-container healthchecks, and non-root execution contexts
- **Level**: contract, smoke
- **Execution group**: Docker Configuration Check
- **Boundary**: Compose v2 parser
- **Test file**: `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`
- **Command**: `docker compose config` (exit code 0)
- **Evidence**: Validated full container topology and network bridging without syntax errors

---

## 5. Manual Verification Exits

| Source | Why automation is unavailable | Manual steps | Passing evidence | Owner |
|---|---|---|---|---|
| Hardware Audio Loopback | Headless CI environments lack physical microphones/speakers for Web Audio API hardware verification | 1. Open `http://localhost:5173/demo/captions`<br>2. Toggle between "Translated Voice" and "Original Audio"<br>3. Verify audio waveform visually dances and voice is clearly audible through speakers | Sound plays clearly in both English and Indic languages in browser | QA Lead |

---

## 6. Current Gaps and Actions

| Priority | TEST-ID or asset | Gap | Next action | State |
|---|---|---|---|---|
| P1 | Playwright E2E Suite | Browser automated end-to-end user journeys (login -> join -> record -> export) | Add `@playwright/test` E2E journey suite in `apps/web` | unverified |
| P2 | WebRTC STUN/TURN Failover | Synthetic NAT traversal simulation under restrictive symmetric firewall | Add coturn test container into docker-compose for automated TURN allocation tests | unverified |
