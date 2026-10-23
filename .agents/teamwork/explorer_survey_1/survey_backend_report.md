# NexClass Backend Architecture Survey Report
**Target**: `@nexclass/api` (Backend, WebRTC Signaling, Fallback Services, Recording Storage, Vitest Suite)  
**Author**: Explorer 1 (Backend & WebRTC Architecture Explorer)  
**Date**: 2026-10-23  
**Project Root**: `E:\mnt\e\NexClass`  
**Working Directory**: `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_1`  

---

## 1. Executive Summary

NexClass is a real-time multilingual virtual classroom platform built as a TypeScript monorepo (`apps/api`, `apps/web`, `packages/shared`, `packages/terminology`). The backend (`@nexclass/api`) is an Express 4 and Socket.io 4 service providing:
1. **Hybrid Document Persistence**: Dual-mode MongoDB/Mongoose with a zero-dependency in-memory document store (`createMemoryModel`) that automatically activates when `MONGODB_URI` is not provided.
2. **Hybrid In-Process / Redis Caching**: Redis client with a transparent fallback `MemoryCache` (`Map` based with TTL and sets/hashes).
3. **WebRTC Mesh Signaling**: Full mesh WebRTC signaling over Socket.io (`webrtc:offer`, `webrtc:answer`, `webrtc:ice`) with peer routing by `participantId`.
4. **Multilingual Caption & Terminology Pipeline**: Live speaker captions protected with Unicode private-use markers (`\uE000`...) via `@nexclass/terminology`, translated per target language, and synthesized into voice.
5. **Zero-Key Odia Speech Synthesis Fallback**: Ingenious phonetic Unicode transliteration (`odiaToDevanagariPhonetic`) mapping Odia script (`U+0B00..U+0B7F`) to Devanagari (`U+0900..U+097F`) by exact `0x0200` offset, synthesized over the public Google Translate speech endpoint using Hindi acoustic models to bypass upstream HTTP 400 rejection.
6. **Current Test Health**: 22 out of 22 Vitest tests pass 100% cleanly in `apps/api/tests/api.test.ts`.

**Key Architectural Gaps Identified for Requirements R1, R2, and R5**:
- **Meeting Recording Pipeline (R1)**: No recording database schema, filesystem storage directory, upload endpoint, or `GET /api/meetings/:code/recordings` endpoint currently exist. The default Express JSON body parser limit is set to `1mb`, requiring dedicated streaming / multipart upload handling.
- **Recording Signaling (R1/R4)**: Socket.io currently lacks recording status events (`recording:start`, `recording:stop`, `recording:pause`, `recording:resume`, and broadcast `recording:state`) needed to drive the pulsing red "REC" indicator and notification modals across all peers.
- **WebRTC Relay Scalability Bottleneck (R5)**: The current signaling relay in `realtime/socket.ts` performs linear array searches over `socket.server.sockets.sockets.values()` for every WebRTC offer, answer, and ICE candidate. In an 8+ peer mesh (56 peer connections, ~600 signaling messages), this causes O(N*M) CPU overhead. Adding a `Map<participantId, MeetingSocket>` lookup will optimize this to O(1).

---

## 2. Package Structure, Server Entrypoints & Middleware Pipeline

### 2.1 Package & Workspace Configuration
- **Location**: `apps/api/package.json`
- **Module Type**: `"type": "module"` (ESM native)
- **Workspaces Referenced**:
  - `@nexclass/shared` -> resolved via `tsconfig.json` paths and `vitest.config.ts` alias to `../../packages/shared/src/index.ts`
  - `@nexclass/terminology` -> resolved to `../../packages/terminology/src/index.ts`
- **Build System**:
  - `npm run dev`: `tsx watch src/server.ts`
  - `npm run build`: `esbuild src/server.ts --bundle --platform=node --format=esm --target=node20 --packages=external --outfile=dist/server.js --banner:js="import{createRequire}from'module';const require=createRequire(import.meta.url);"`
  - `npm run typecheck`: `tsc --noEmit` (passes with 0 errors)
  - `npm test`: `vitest run` (22/22 tests passing)

### 2.2 Environment Configuration (`src/config/env.ts`)
Uses `dotenv` and `zod` to validate environment variables:
- `NODE_ENV`: `"development" | "test" | "production"` (default `"development"`)
- `PORT`: default `4000`
- `CLIENT_ORIGIN`: default `"http://localhost:5173"`
- `MONGODB_URI`: optional; if omitted, falls back to in-memory store
- `MONGODB_DB_NAME`: default `"nexclass"`
- `REDIS_URL`: optional; if omitted, falls back to `MemoryCache`
- `JWT_SECRET`: default `"nexclass-development-secret-change-me"` (refuses to start in production if unchanged)
- `JWT_EXPIRES_IN`: default `"7d"`
- `STUN_SERVERS`: default `"stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302"`
- `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_PASSWORD`: optional TURN relay
- `ASR_PROVIDER`: `"browser" | "remote-asr"` (default `"browser"`)
- `TRANSLATION_PROVIDER`: `"none" | "google" | "deepl" | "indictrans2" | "generic-http"` (default `"none"`)
- `TTS_PROVIDER`: `"browser" | "google-tts" | "azure-tts" | "generic-tts" | "none"` (default `"browser"`, defaults to keyless fallback when unset)
- `ALLOW_GUEST_JOIN`: boolean, default `true`
- `RATE_LIMIT_WINDOW_MS`: `60000`, `RATE_LIMIT_MAX`: `300`

### 2.3 Server Entrypoint & Bootstrap Flow
```
server.ts
  └─> bootstrap() (src/bootstrap.ts)
        ├─> connectMongo() (src/db/mongo.ts)
        ├─> connectRedis() (src/db/redis.ts)
        ├─> dynamic import createApp() (src/app.ts)
        ├─> http.createServer(app)
        ├─> dynamic import attachRealtime() (src/realtime/socket.ts)
        ├─> io = attachRealtime(httpServer)
        └─> httpServer.listen(port)
```
- **Graceful Shutdown**: `server.ts` hooks `SIGINT` and `SIGTERM` calling `shutdown(server)`, which closes `io`, `httpServer`, and runs `Promise.allSettled([disconnectMongo(), disconnectRedis()])`.

### 2.4 Express Middleware Stack (`src/app.ts`)
- `app.set("trust proxy", 1);`
- `helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })`
- `cors({ origin: env.clientOrigin.split(","), credentials: true })`
- `express.json({ limit: "1mb" })` -> *Note: Must bypass or extend for video recording uploads!*
- `express.urlencoded({ extended: true })`
- `rateLimit({ windowMs: 60000, max: 300 })` on `/api`
- Routes mounted:
  - `GET /api/health` -> `{ ok: true, service: "nexclass-api", time: ISO }`
  - `GET /api/languages` -> `{ languages: LANGUAGES }`
  - `/api/auth` -> `authRoutes`
  - `/api` -> `meetingRoutes`
  - `/api/providers` -> `providerRoutes`
  - `/api/demo` -> `demoRoutes`
  - Static SPA fallback serving `../../web/dist` if folder exists
- Error handling: `notFoundHandler` (404 JSON) and `errorHandler` (maps `HttpError`, `ZodError`, 500 JSON).

---

## 3. Data Persistence Layer & Hybrid Document Store

### 3.1 Dual-Mode Model Architecture (`src/db/model.ts`)
NexClass implements a transparent abstraction: `registerModel<T>(name, mongooseSchema, defaults)`:
- **MongoDB Connected Mode**: If `mongoose.connection.readyState === 1`, wraps Mongoose's `Model<T>` with standard `ModelLike<T>` interface (`create`, `find`, `findById`, `findOne`, `findOneAndUpdate`, `updateMany`, `deleteMany`, `countDocuments`).
- **In-Memory Fallback Mode**: If MongoDB is unavailable or unconfigured, instantiates `createMemoryModel<T>(name, defaults)`:
  - Uses `Map<string, T>` storage.
  - Implements dot-notation path matching, `$or` expressions, `$in`, `$ne`, `$exists`, and nested updates via `applyUpdate`.
  - Supports query chain: `.sort(spec).limit(n).skip(n).select().lean().exec()`.
- **Registered Collections (`src/models/index.ts`)**:
  1. `UserModel` (`"User"`): User accounts with password hash, role (`teacher` | `student`), preferred language.
  2. `MeetingModel` (`"Meeting"`): Virtual classrooms with unique code, hostId, status, settings.
  3. `ParticipantModel` (`"Participant"`): Participant sessions with audio/video/screen/hand states and language preferences.
  4. `TranscriptSegmentModel` (`"TranscriptSegment"`): Raw speaker transcripts with protected terms and timestamps.
  5. `TranslationSegmentModel` (`"TranslationSegment"`): Target translations per language.
  6. `VoiceSegmentModel` (`"VoiceSegment"`): Audio assets / TTS segment results.
  7. `ChatMessageModel` (`"ChatMessage"`): In-meeting chat history.

### 3.2 Dual-Mode Caching (`src/db/redis.ts`)
- Returns `CacheClient` interface (`get`, `set`, `del`, `sadd`, `srem`, `smembers`, `hset`, `hgetall`, `hdel`, `expire`, `keys`, `ping`).
- Connects to `REDIS_URL` with 3s timeout and retry limit.
- If unavailable, falls back to `MemoryCache` with internal expiration checking.

---

## 4. Meeting Lifecycle & REST API Routes

### 4.1 Meeting Endpoints (`src/routes/meetings.ts`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/meetings` | Required | List user's hosted and joined meetings (last 25) |
| `POST` | `/api/meetings` | Teacher Only | Create meeting, generates 6-char alphanumeric code (e.g. `ABCDEF`), status `"scheduled"` |
| `GET` | `/api/meetings/:code` | Optional | Fetch meeting details |
| `PATCH` | `/api/meetings/:code` | Host Only | Update title, speakerLanguage, availableLanguages, permissions |
| `POST` | `/api/meetings/:code/join` | Optional / Guest | Join meeting. If password protected, checks hash. If status was `"scheduled"`, promotes to `"live"`. Returns JWT token. |
| `POST` | `/api/meetings/:code/leave` | Required | Sets participant `leftAt = new Date()` |
| `POST` | `/api/meetings/:code/end` | Host Only | Sets meeting status to `"ended"` and sets `leftAt` for all active participants |
| `GET` | `/api/meetings/:code/participants` | Participant | Lists active participants |
| `GET` | `/api/meetings/:code/chat` | Participant | Get last 300 chat messages |
| `POST` | `/api/meetings/:code/chat` | Participant | Send chat message (validates `canChat` permission) |
| `GET` | `/api/meetings/:code/transcripts` | Participant | Get meeting transcript segments |
| `GET` | `/api/meetings/:code/translations` | Participant | Get translation segments |
| `GET` | `/api/meetings/:code/voices` | Participant | Get TTS voice segments |
| `PATCH` | `/api/meetings/:code/preferences` | Participant | Update participant's caption/voice/interface language |

---

## 5. Realtime WebRTC Signaling & Socket.io Architecture

### 5.1 Connection & Handshake (`src/realtime/socket.ts`)
1. **Authentication Gate**: Handshake middleware extracts token from `socket.handshake.auth?.token` or query param `token`.
2. **Identity Tracking**: Verifies JWT and stores identity in `WeakMap<Socket, SocketIdentity>({ userId, participantId, name, role, meetingCode })`.
3. **Room Grouping**: Socket joins room `meeting:${code}`.

### 5.2 Event Fanout & Handlers
```
Client Sockets                   Socket.io Server (/realtime/socket.ts)
  │                                           │
  ├────── meeting:join (code, name, lang) ───>│ Check meeting, register ParticipantDoc
  │<───── meeting:joined (participant, room) ─┤ Socket joins room `meeting:${code}`
  │                                           ├─ Broadcast to room: `participant:joined`
  │                                           │
  ├────── media:state (audio, video, screen) ─>│ Updates ParticipantModel
  │<───── participant:updated ────────────────┤ Broadcasts to room
  │                                           │
  ├────── webrtc:offer (toId, sdp) ──────────>│ Finds toId socket
  │                                           ├─ Routes directly: target.emit("webrtc:offer", { fromId, sdp })
  ├────── webrtc:answer (toId, sdp) ─────────>│ Routes directly: target.emit("webrtc:answer", { fromId, sdp })
  ├────── webrtc:ice (toId, candidate) ──────>│ Routes directly: target.emit("webrtc:ice", { fromId, candidate })
  │                                           │
  ├────── caption:interim (text) ────────────>│ Broadcasts `caption:interim` to peers
  ├────── caption:original (text, lang) ─────>│ Creates TranscriptSegmentModel
  │                                           ├─ Broadcasts `caption:segment` (status: "processing")
  │                                           ├─ Runs processSegment() (Terminology + Translation + TTS)
  │<───── caption:segment (status: "complete")┴─ Broadcasts enriched segment with translations & audio
  │                                           │
  ├────── chat:send (message) ───────────────>│ Saves ChatMessageModel, broadcasts `chat:message`
  └────── disconnect / meeting:leave ────────>│ Sets leftAt, broadcasts `participant:left`
```

### 5.3 WebRTC Relay Scalability Bottleneck (Critical for R5 Concurrency Stress Testing)
In `apps/api/src/realtime/socket.ts`:
```ts
function peerSockets(socket: MeetingSocket): MeetingSocket[] {
  return [...socket.server.sockets.sockets.values()];
}
```
And inside `webrtc:offer`, `webrtc:answer`, `webrtc:ice`:
```ts
const target = peerSockets(socket).find(
  (candidate) => candidate.data.participantId === payload?.toId,
);
```
**Problem Analysis**:
- `socket.server.sockets.sockets` holds every connected socket on the Node.js server.
- For each WebRTC ICE candidate, offer, and answer, `peerSockets(socket)` allocates an array of all sockets on the server and performs an `Array.find()` linear scan.
- In an 8-peer mesh:
  - 8 participants = 28 peer links (56 directional peer connections).
  - Each connection emits 1 offer, 1 answer, and an average of 8-12 trickle ICE candidates.
  - Total signaling messages during simultaneous room entry: 56 * 12 ≈ **672 messages**.
  - 672 array allocations and linear searches within a few hundred milliseconds.
- **Optimization Recommendation**:
  Maintain a room-level or server-level lookup map:
  `participantSocketMap = new Map<string, MeetingSocket>()` (keyed by `participantId`), updated upon `meeting:join` and cleaned up upon `meeting:leave` / `disconnect`.
  This turns the lookup into an instant `O(1)` pointer retrieval, eliminating latency spikes during concurrent room joins!

---

## 6. Odia Speech Synthesis Fallback & Zero-Key Architecture

### 6.1 The Problem
The public keyless Google Translate speech endpoint:
`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={lang}&...`
Supports Indian languages Hindi (`hi`), Tamil (`ta`), Bengali (`bn`), Marathi (`mr`), but explicitly rejects Odia (`or`) with **HTTP 400**. Previously, this caused Odia audio playback to fail.

### 6.2 The Zero-Key Solution (`src/services/providers.ts` lines 328-415)
1. **Phonetic Script Mapping (`odiaToDevanagariPhonetic`)**:
   - In the Unicode standard, Indian scripts share identical logical positions within their respective 128-byte blocks.
   - Odia code block: `U+0B00..U+0B7F`
   - Devanagari code block: `U+0900..U+097F`
   - Difference: exactly `0x0200` (512 decimal).
   - Special letter mapping: Odia letter WA (`U+0B71`, ୱ) is phonetically mapped to Devanagari VA/WA (`U+0935`, व).
   - For all other Odia characters: `String.fromCharCode(code - 0x0200)`.
2. **Audio Synthesis Routing**:
   ```ts
   const isOdia = request.language === "or";
   const textToSynthesize = isOdia ? odiaToDevanagariPhonetic(request.text) : request.text;
   const ttsLang = isOdia ? "hi" : request.language;
   ```
   When `language === "or"`, the text is transliterated into Devanagari and requested from Google tw-ob with `tl=hi`. The Hindi acoustic model speaks the phonetically aligned Odia words with authentic Indian pronunciation.
3. **Text Chunking**:
   Google Translate tw-ob rejects query strings longer than ~200 characters. `splitForFallbackTts(text)` splits into space-separated word chunks of max 180 chars (`FALLBACK_TTS_CHUNK`).
4. **Data Delivery**:
   Audio chunks are fetched, concatenated via `Buffer.concat(parts)`, and returned as a base64 Data URL: `data:audio/mpeg;base64,...`.
5. **Memory & Concurrency Bounds**:
   - `fallbackTtsCache = new Map<string, TtsResult>()`
   - Maximum cache size: `FALLBACK_TTS_CACHE_MAX = 150`
   - Eviction: FIFO deletion (`fallbackTtsCache.delete(fallbackTtsCache.keys().next().value)`).
   - Prevents memory leaks: The Map never exceeds 150 entries.
   - For R5 concurrent stress testing: Under rapid concurrent requests for the same text, multiple upstream requests may fire simultaneously before caching. Adding an in-flight promise map (`inflightTts = new Map<string, Promise<TtsResult>>()`) prevents duplicate upstream requests and thundering-herd spikes.

---

## 7. Meeting Recording Pipeline Design & Specification (R1)

### 7.1 Gap Analysis
Currently, there is **zero recording infrastructure** in `@nexclass/api`:
- No recording model in `src/models/index.ts`.
- No recordings storage directory.
- Express body parser is limited to `1mb` (`app.use(express.json({ limit: "1mb" }))`).
- No upload route or streaming route.
- No socket events for recording state notification.

### 7.2 Storage Directory Architecture
- Directory: `apps/api/recordings/` (configurable via `process.env.RECORDINGS_DIR || path.resolve(process.cwd(), "recordings")`).
- Auto-creation: `fs.mkdirSync(RECORDINGS_DIR, { recursive: true })` on startup.
- Docker persistence: Volume mount `recordings_data:/app/apps/api/recordings`.

### 7.3 Database Model Schema (`RecordingModel`)
In `src/models/index.ts`:
```ts
export interface RecordingDoc {
  id?: string;
  meetingId: string;
  meetingCode: string;
  recordedBy: string; // userId or participantId
  recordedByName: string;
  fileName: string; // e.g. "recording_ABCDEF_1730000000000.webm"
  filePath: string;
  fileSize: number; // in bytes
  mimeType: string; // "video/webm" or "video/mp4"
  durationSeconds?: number;
  createdAt: Date;
}
```

### 7.4 API Endpoints Specification

#### 1. Upload Recording: `POST /api/meetings/:code/recordings`
- **Auth**: `requireAuth` (Host or verified participant).
- **Body / Protocol**:
  Stream the raw binary file (`Content-Type: video/webm` or `application/octet-stream` or `multipart/form-data`) directly to disk using `req.pipe(fs.createWriteStream(targetPath))` to avoid buffering large recordings into memory.
  Query parameters or custom headers provide metadata:
  - `x-recording-duration`: duration in seconds
  - `x-recording-filename`: client-suggested filename
- **Response**: `201 Created` with recording public record.

#### 2. List Recordings: `GET /api/meetings/:code/recordings`
- **Auth**: `optionalAuth` / `requireAuth` (participants in meeting).
- **Response**:
  ```json
  {
    "recordings": [
      {
        "id": "rec_xyz",
        "meetingCode": "ABCDEF",
        "fileName": "lecture_ABCDEF_20261023.webm",
        "fileSize": 15420120,
        "durationSeconds": 185,
        "recordedByName": "Prof. Meera",
        "downloadUrl": "/api/meetings/ABCDEF/recordings/rec_xyz/download",
        "streamUrl": "/api/meetings/ABCDEF/recordings/rec_xyz/stream",
        "createdAt": "2026-10-23T14:00:00.000Z"
      }
    ]
  }
  ```

#### 3. Stream / Download Recording: `GET /api/meetings/:code/recordings/:id/stream`
- **HTTP 206 Partial Content Support**:
  Must handle `Range: bytes=start-end` header:
  ```ts
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": recording.mimeType,
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": recording.mimeType,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  }
  ```

### 7.5 Realtime Socket Signaling for Recording State
Add socket handlers in `apps/api/src/realtime/socket.ts`:
- `recording:start`: Host starts recording -> broadcast `recording:started` `{ startedAt, startedBy: identity.name }`
- `recording:pause`: Host pauses recording -> broadcast `recording:paused`
- `recording:resume`: Host resumes recording -> broadcast `recording:resumed`
- `recording:stop`: Host stops recording -> broadcast `recording:stopped`
This enables all participants to immediately see the top header red REC pill badge and show the "Recording has started / stopped" notification modal!

---

## 8. Vitest Test Suite, Harnesses & Concurrency Stress Testing Plan (R5)

### 8.1 Current Vitest Suite (`apps/api/tests/api.test.ts`)
- **Total Tests**: 22 tests across 4 suites.
- **Execution Command**: `npm test -w @nexclass/api`
- **Pass Rate**: 100% (22 passed, 0 failed, duration ~1.03s test time).
- **Suites**:
  1. `terminology engine`: 4 tests validating placeholder injection, restoration, fallback, and language glosses.
  2. `meeting codes`: 1 test verifying 200 random codes conform to `^[A-HJ-NP-Z2-9]{6}$` without ambiguous chars.
  3. `nexclass REST API`: 16 tests covering registration, login, validation, role authorization, guest join, chat, preferences, demo segments, speech validation, and meeting termination.
  4. `realtime meeting handlers`: 1 full-lifecycle test using `makeFakeSocket` to exercise room join, meeting promotion to live, terminology protection, caption pipeline fanout, chat, and WebRTC relay.

### 8.2 Automated Multi-Peer Concurrency Stress Test Suite Design (R5)
To satisfy R5:
> "Script simulating 8+ concurrent participants joining a meeting room simultaneously.  
> Verify WebRTC mesh signaling stability, room event fanout, and caption streaming under load.  
> Verify zero-key Odia speech synthesis fallback under concurrent requests without memory leaks or race conditions."

We should implement a dedicated test suite `apps/api/tests/stress.test.ts`:
1. **8+ Concurrent Peers Setup**:
   - Spin up `bootstrap({ port: 0 })` on an ephemeral port.
   - Create 1 Teacher + 7 Students (total 8 peers).
   - Use `Promise.all` to simultaneously fire `meeting:join` across all 8 sockets.
   - Assert all 8 receive `meeting:joined` and receive `participant:joined` events for all other peers.
2. **WebRTC Mesh Signaling Stress**:
   - Simulate mesh connection establishment: 8 peers establish pairwise connections (28 bidirectional pairs = 56 directional links).
   - Each peer transmits `webrtc:offer`, receives `webrtc:offer`, sends `webrtc:answer`, and fires 5 `webrtc:ice` candidate packets simultaneously (total ~392 signaling events).
   - Verify 0 dropped packets and 100% arrival rate at the designated target peer.
3. **Caption Streaming Under Load**:
   - Host fires rapid successive captions (e.g., 10 captions in 1 second).
   - Verify every student receives `caption:segment` events without corrupted order or race conditions.
4. **Concurrent Odia Zero-Key TTS Stress**:
   - Fire 20 simultaneous concurrent calls to `synthesizeFallbackSpeech` with Odia text (`language: "or"`).
   - Verify phonetic conversion (`odiaToDevanagariPhonetic`) succeeds 100%.
   - Verify cache size never exceeds `FALLBACK_TTS_CACHE_MAX` (150).
   - Verify no unhandled promise rejections, memory growth, or race conditions.

---

## 9. Concrete Implementation Roadmap & Recommendations

1. **Implement Recording Model & Storage (`apps/api/src/models/index.ts`, `apps/api/src/routes/meetings.ts`)**:
   - Register `RecordingModel` with `RecordingDoc` schema.
   - Create recordings disk directory with environment override `RECORDINGS_DIR`.
   - Add `POST /api/meetings/:code/recordings` (stream-to-disk upload).
   - Add `GET /api/meetings/:code/recordings` (metadata listing).
   - Add `GET /api/meetings/:code/recordings/:id/stream` (HTTP 206 Partial Content Range streaming).
2. **Implement Realtime Recording Signaling (`apps/api/src/realtime/socket.ts`)**:
   - Add `recording:start`, `recording:pause`, `recording:resume`, and `recording:stop` handlers.
   - Broadcast state changes to all room participants.
3. **Optimize WebRTC Peer Lookup (`apps/api/src/realtime/socket.ts`)**:
   - Replace linear scan of `socket.server.sockets.sockets` with `participantSocketMap = new Map<string, MeetingSocket>()`.
4. **Implement Multi-Peer Concurrency Stress Suite (`apps/api/tests/stress.test.ts`)**:
   - Implement automated test simulating 8+ concurrent participants, full mesh WebRTC signaling, rapid caption fanout, and concurrent Odia TTS.
   - Add npm script `"test:stress": "vitest run tests/stress.test.ts"` in `apps/api/package.json`.
5. **Docker Infrastructure Alignment (R2)**:
   - Ensure the API Dockerfile exposes port 4000 and defines a volume at `/app/recordings`.
   - Healthcheck: `CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1`.
