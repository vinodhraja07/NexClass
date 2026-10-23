# Project: NexClass Production Hardening & Feature Hardening

## Architecture
NexClass is an AI-powered multilingual virtual classroom platform architected as a TypeScript monorepo with `@nexclass/api` (Express, Socket.io, Mongoose, ioredis, WebRTC mesh signaling) and `@nexclass/web` (React 18, Vite, Tailwind CSS, Motion/React, Web Audio API, MediaRecorder).

- **Data Flow**:
  - Web client connects to API via REST (JSON & binary stream endpoints) and Socket.io realtime transport.
  - Realtime state: room events, participant state, WebRTC offer/answer/ICE candidate routing, multilingual live captions, chat messages, and recording state broadcast.
  - Speech synthesis: Multilingual translation pipeline with zero-key phonetic Unicode fallback for Odia (`odiaToDevanagariPhonetic` mapped to Devanagari Hindi Google TTS with in-memory caching).
  - Recording: Client-side MediaRecorder compositing audio (local mic + remote peer audio + translated TTS audio via Web Audio API) and video (1280x720 canvas stage / screen share with burned-in subtitles), offering instant local download and uploading binary stream to `@nexclass/api` storage.
  - Deployment: Multi-container production deployment orchestrated via Docker Compose (MongoDB, Redis, API, Nginx Web frontend) with persistent volumes and healthchecks.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Recording Data Model & Storage | Mongoose `Recording` model, disk storage manager in `/app/recordings` with unique IDs | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Recording Stream Upload Endpoint | `POST /api/meetings/:code/recordings` streaming raw binary WebM/MP4 payload directly to disk | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Recording List & Stream API | `GET /api/meetings/:code/recordings` and HTTP 206 Partial Content Range streaming | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Recording Realtime Signaling | Socket.io events `recording:start`, `recording:stop`, `recording:pause`, `recording:resume`, and broadcast `recording:state` | M1 | ORIGINAL_REQUEST §R1, §R4 |
| 5 | WebRTC Peer Lookup Map | Optimize `peerSockets()` in `realtime/socket.ts` to `O(1)` map lookup for mesh scalability | M1 | Survey Report 1 |
| 6 | MediaRecorder Compositor Hook | `useMeetingRecording.ts` mixing mic, peer audio, translated TTS audio via Web Audio API, compositing canvas/video stream | M2 | ORIGINAL_REQUEST §R1 |
| 7 | Instant Local Recording Download | Automatic client-side `.webm` file download upon stopping recording | M2 | ORIGINAL_REQUEST §R1 |
| 8 | Red REC Header Pill Badge | Animated pulsing red REC pill with elapsed time counter in `ClassroomHeader.tsx` | M2 | ORIGINAL_REQUEST §R4 |
| 9 | Toolbar Record Button & Modals | Circular Record button in `ClassroomToolbar.tsx` with active indicator and confirmation dialogs | M2 | ORIGINAL_REQUEST §R4 |
| 10 | MeetSidePanel Recordings Tab | Recordings list in `MeetSidePanel.tsx` Details tab showing completed recording links & downloads | M2 | ORIGINAL_REQUEST §R4 |
| 11 | Tile Grid Layout Animations | `motion/react` layout springs for tile join, leave, reorder, and pin-to-stage expansion | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Smooth Active Speaker Cues | Smooth animated audio equalizer wave and subtle accent border transitions without jarring pulse jumps | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Toolbar Micro-Interactions | Tactile spring clicks (`whileTap`), hover states, and smooth tooltip transitions for circular bottom buttons | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Floating Captions & Indic Typography | Smooth caption entry transitions, terminology gloss popovers, and Noto Sans Indic font stacks | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Reduced Motion Compliance | Strict `useReducedMotion()` support across all components disabling spring/scale transformations | M3 | ORIGINAL_REQUEST §R3 |
| 16 | API Multi-Stage Dockerfile | 3-stage Node 20 Alpine Dockerfile with non-root user `node` and native healthcheck | M4 | ORIGINAL_REQUEST §R2 |
| 17 | Web Multi-Stage Dockerfile | 2-stage build + Nginx Alpine runner with gzip, SPA routing, 250MB upload limit, and proxy pass | M4 | ORIGINAL_REQUEST §R2 |
| 18 | Production Docker Compose | Orchestrating MongoDB 7, Redis 7, API, Web with 3 named volumes and healthcheck dependencies | M4 | ORIGINAL_REQUEST §R2 |
| 19 | Environment Template | Production-ready `.env.example` with security warnings for `JWT_SECRET` and service URLs | M4 | ORIGINAL_REQUEST §R2 |
| 20 | Multi-Peer Concurrency Simulation | Automated script simulating 8+ concurrent participants joining room, mesh signaling (28 pairs), and 128 chat messages | M5 | ORIGINAL_REQUEST §R5 |
| 21 | Caption Streaming Fanout Under Load | Verify rapid interim and finalized caption broadcast across 8 concurrent participants without drops | M5 | ORIGINAL_REQUEST §R5 |
| 22 | Odia TTS Fallback Concurrency & Caching | Stress test zero-key Odia speech synthesis fallback, in-flight promise deduplication, and 150-item FIFO cache boundary | M5 | ORIGINAL_REQUEST §R5 |
| 23 | Full Vitest & Typecheck Compliance | 100% of Vitest tests pass (`npm test -w @nexclass/api`), `npm run typecheck` passes with 0 errors, `npm run build` succeeds | M6 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Recording & Signaling | Features 1, 2, 3, 4, 5 | none | DONE |
| M2 | Frontend Recording & Meet UI Polish | Features 6, 7, 8, 9, 10 | M1 | DONE |
| M3 | Advanced UI/UX Animations & Indic Typography | Features 11, 12, 13, 14, 15 | none | DONE |
| M4 | Docker Production Infrastructure | Features 16, 17, 18, 19 | none | DONE |
| M5 | Multi-Peer Concurrency Stress Test Suite | Features 20, 21, 22 | M1 | DONE |
| M6 | Final Verification, Gating & Hardening | Feature 23, full E2E & forensic audit | M1, M2, M3, M4, M5 | IN_PROGRESS |

## Interface Contracts

### Backend ↔ Frontend Recording API
- `POST /api/meetings/:code/recordings`:
  - Request headers: `Content-Type: video/webm` (or `video/mp4`), `x-recording-duration: <seconds>`, `x-recording-size: <bytes>`, `x-recorded-by: <participantId>`, `Authorization: Bearer <jwt>`.
  - Request body: Raw binary media stream.
  - Response: `{ ok: true, recording: { id: string, meetingCode: string, fileName: string, sizeBytes: number, durationSeconds: number, createdAt: string, downloadUrl: string, streamUrl: string } }`.
- `GET /api/meetings/:code/recordings`:
  - Response: `{ ok: true, recordings: RecordingSummary[] }`.
- `GET /api/meetings/:code/recordings/:id/stream`:
  - Headers supported: `Range: bytes=start-end`.
  - Response: HTTP 206 Partial Content (or HTTP 200) with `Content-Range`, `Accept-Ranges: bytes`, `Content-Type: video/webm`.
- `GET /api/meetings/:code/recordings/:id/download`:
  - Response: HTTP 200 with `Content-Disposition: attachment; filename="nexclass-recording-..."`.

### Realtime Recording Socket Events
- Client -> Server:
  - `recording:start`: `{ meetingCode: string, participantId: string }`
  - `recording:pause`: `{ meetingCode: string, participantId: string }`
  - `recording:resume`: `{ meetingCode: string, participantId: string }`
  - `recording:stop`: `{ meetingCode: string, participantId: string }`
- Server -> Room Broadcast:
  - `recording:state`: `{ isRecording: boolean, isPaused: boolean, startedAt: number | null, elapsedSeconds: number, recordedBy: string | null }`

### Concurrency Stress Test Runner Interface
- Script entrypoint: `scripts/stress-concurrency.ts` (runnable via `npx tsx scripts/stress-concurrency.ts` or `npm run test:stress`).
- Output: Structured JSON report + console summary reporting peer connection latency, message delivery count, signaling pair count, Odia fallback latency, and memory stability.

## Code Layout
- `apps/api/src/models/recording.ts`: Mongoose schema & memory store for recordings.
- `apps/api/src/services/recordings.ts`: Storage file system manager, disk stream writer, HTTP 206 range streamer.
- `apps/api/src/routes/recordings.ts`: Express routes for recording upload, list, stream, download.
- `apps/api/src/realtime/socket.ts`: Socket.io handlers for `recording:*` and optimized WebRTC peer map.
- `apps/web/src/hooks/useMeetingRecording.ts`: MediaRecorder hook with Web Audio API mixer & canvas compositor.
- `apps/web/src/components/classroom/ClassroomHeader.tsx`: Red REC pill badge with elapsed timer.
- `apps/web/src/components/classroom/ClassroomToolbar.tsx`: Circular Record button with active state.
- `apps/web/src/components/classroom/MeetSidePanel.tsx`: Recordings card in Details (`info`) tab.
- `apps/web/src/components/classroom/Stage.tsx` & `VideoTile.tsx`: Motion layout springs & smooth equalizer.
- `apps/api/Dockerfile`: 3-stage Node 20 Alpine container.
- `apps/web/Dockerfile`: 2-stage Vite build + Nginx Alpine container.
- `apps/web/nginx.conf`: Nginx SPA routing, gzip, 250MB client_max_body_size, proxy pass for `/api` and `/socket.io`.
- `docker-compose.yml`: Root production Docker Compose service orchestration.
- `.env.example`: Root environment configuration template.
- `scripts/stress-concurrency.ts`: Multi-peer concurrency stress testing suite.
- `apps/api/tests/stress.test.ts`: Vitest test suite integrating stress checks into CI.
