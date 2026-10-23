# Handoff Report — Explorer 1 (Backend & WebRTC Architecture)

## 1. Observation
1. **Repository Structure & Workspace Layout**:
   - Monorepo root at `E:\mnt\e\NexClass` (`package.json`) defines workspaces `apps/*` and `packages/*`.
   - Backend package is `@nexclass/api` located at `apps/api/` (`apps/api/package.json`).
   - Shared packages: `packages/shared` (`@nexclass/shared`) and `packages/terminology` (`@nexclass/terminology`).
2. **Server Entrypoints & Middleware**:
   - Entrypoint is `apps/api/src/server.ts` which calls `bootstrap()` in `apps/api/src/bootstrap.ts`.
   - `bootstrap.ts` connects MongoDB (`apps/api/src/db/mongo.ts`) and Redis (`apps/api/src/db/redis.ts`), then dynamically imports `createApp()` (`apps/api/src/app.ts`) and `attachRealtime()` (`apps/api/src/realtime/socket.ts`).
   - `apps/api/src/app.ts` configures helmet, cors, json parser with `limit: "1mb"`, rate limiting (60s, 300 requests), `/api/health`, `/api/languages`, and mounts routes `/api/auth`, `/api` (meetings), `/api/providers`, `/api/demo`.
3. **Meeting Management & Routes**:
   - `apps/api/src/routes/meetings.ts` exposes `/api/meetings` (CRUD, join, leave, end, participants, chat, transcripts, translations, voices, preferences).
   - `apps/api/src/services/meetings.ts` provides `createUniqueMeetingCode()` (6-character alphanumeric code), password hashing/verification, and public document projection helpers.
4. **Signaling & Realtime Architecture**:
   - `apps/api/src/realtime/socket.ts` attaches Socket.io with JWT token handshake authentication.
   - Handlers implement `meeting:join`, `meeting:leave`, `media:state`, `preferences:set`, `caption:interim`, `caption:original`, `chat:send`, `room:resource:set`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice`, `disconnect`.
   - WebRTC signaling (`webrtc:offer`, `webrtc:answer`, `webrtc:ice`) routes directly by participant ID using `peerSockets(socket).find((c) => c.data.participantId === payload?.toId)`.
   - `peerSockets` constructs an array of all sockets across the entire server on every event:
     `function peerSockets(socket: MeetingSocket): MeetingSocket[] { return [...socket.server.sockets.sockets.values()]; }` (line 39).
5. **Odia Speech Synthesis Fallback**:
   - `apps/api/src/services/providers.ts` defines `odiaToDevanagariPhonetic(text: string)` (line 333), translating Odia Unicode (`U+0B00..U+0B7F`) to Devanagari Unicode (`U+0900..U+097F`) by subtracting offset `0x0200`, with special handling for Odia WA (`U+0B71` -> `\u0935`).
   - `GoogleTranslateTtsFallbackAdapter` (line 349) maps Odia (`"or"`) to `odiaToDevanagariPhonetic(request.text)` and requests Hindi (`"hi"`) on `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob`, bypassing the upstream HTTP 400 error.
   - Caches responses in `fallbackTtsCache = new Map<string, TtsResult>()` capped at `FALLBACK_TTS_CACHE_MAX = 150` with FIFO eviction (line 305).
6. **Existing Recording Functionality**:
   - Grep search for `recording` across `E:\mnt\e\NexClass` returned zero server models, storage paths, upload endpoints, or socket events.
7. **Vitest Test Suite Status**:
   - `apps/api/tests/api.test.ts` contains 22 tests across terminology, meeting codes, REST API, and realtime meeting handlers.
   - Verified execution command: `powershell -Command "Set-Location 'E:\mnt\e\NexClass'; npm test -w @nexclass/api"`. Result:
     `Test Files 1 passed (1), Tests 22 passed (22), Duration 13.92s (tests 1.03s)`.

## 2. Logic Chain
1. From Observation 6, neither database models, storage directories, nor API endpoints for recording exist in `@nexclass/api`. Requirement R1 specifically demands: (a) saving completed client recordings to server archive storage, and (b) providing `GET /api/meetings/:code/recordings` to list and stream recordings.
2. From Observation 2, `app.use(express.json({ limit: "1mb" }))` enforces a 1MB payload ceiling for standard JSON endpoints. Recording blobs from MediaRecorder are typically 5MB to 100MB+. Therefore, recording uploads cannot use standard JSON POST payloads; they must be handled either as raw binary streams (`req.pipe(fs.createWriteStream(...))`) or multipart form streams.
3. From Observation 4, WebRTC signaling currently scans all server sockets linearly via `peerSockets(socket)` for every `webrtc:offer`, `webrtc:answer`, and `webrtc:ice` candidate. Under Requirement R5 (8+ concurrent participants in mesh topology = 56 peer links, ~672 signaling events simultaneously), this linear scan introduces unnecessary CPU latency spikes. Replacing it with a `Map<participantId, MeetingSocket>` yields an `O(1)` routing mechanism.
4. From Observation 4, Socket.io currently does not handle recording lifecycle events. To satisfy R1 and R4 (pulsing red "REC" pill badge and participant notification when recording starts/stops), socket events (`recording:start`, `recording:stop`, `recording:pause`, `recording:resume`, and broadcast `recording:state`) must be added to `realtime/socket.ts`.
5. From Observation 5, Odia fallback TTS is memory-bounded by `FALLBACK_TTS_CACHE_MAX = 150`. To satisfy R5 concurrent load testing without race conditions or duplicate upstream requests, inflight promise tracking (`Map<string, Promise<TtsResult>>`) should be added to prevent thundering herd requests.
6. From Observation 7, the existing 22 tests in `api.test.ts` pass cleanly and verify core REST and mock-socket flows. A dedicated stress test file `apps/api/tests/stress.test.ts` can be added to verify R5 without altering the baseline 22 tests.

## 3. Caveats
- Outbound network requests to `translate.google.com` may be blocked or rate-limited depending on the sandbox network environment. In tests, `process.env.TTS_PROVIDER = "none"` is used.
- Web frontend typecheck currently fails due to two missing methods on `DemoTransport` in `apps/web/src/pages/Demo.tsx` (lines 52, 57). This is isolated to `@nexclass/web` and does not affect `@nexclass/api` (`tsc --noEmit` in `apps/api` passes cleanly).

## 4. Conclusion
The backend architecture of `@nexclass/api` is robust, modular, and well-structured, with a working dual-mode in-memory/MongoDB persistence model and 100% passing tests. The path to fulfilling the user's requirements is clear:
1. **Recording Storage & API**: Implement `RecordingDoc` in `apps/api/src/models/index.ts`, add disk storage management under `apps/api/recordings/` (configurable via `RECORDINGS_DIR`), add binary stream upload at `POST /api/meetings/:code/recordings`, add listing and HTTP 206 Range streaming at `GET /api/meetings/:code/recordings` & `/api/meetings/:code/recordings/:id/stream`.
2. **Recording Signaling**: Add `recording:*` socket handlers to `apps/api/src/realtime/socket.ts` to fan out recording state to all room participants.
3. **WebRTC Optimization**: Optimize peer lookup in `apps/api/src/realtime/socket.ts` using an `O(1)` participant ID map.
4. **Stress Testing**: Implement `apps/api/tests/stress.test.ts` simulating 8+ concurrent participants, full mesh WebRTC signaling, rapid caption streaming, and concurrent Odia TTS.

Comprehensive details, schema specifications, and architectural diagrams are provided in:
`E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_1\survey_backend_report.md`.

## 5. Verification Method
1. **Run Vitest Tests**:
   ```powershell
   powershell -Command "Set-Location 'E:\mnt\e\NexClass'; npm test -w @nexclass/api"
   ```
   *Expected Result*: 22 of 22 tests pass in `apps/api/tests/api.test.ts`.
2. **Run TypeScript Check on Backend**:
   ```powershell
   powershell -Command "Set-Location 'E:\mnt\e\NexClass'; npm run typecheck -w @nexclass/api"
   ```
   *Expected Result*: Exits with code 0.
3. **Verify Report Files**:
   - Inspect `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_1\survey_backend_report.md`
   - Inspect `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_1\handoff.md`
   - Invalidation conditions: If `npm test -w @nexclass/api` fails or if paths to models/routes differ from documented lines.
