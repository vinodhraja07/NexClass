# Changes Report — Milestone 1: Backend Recording & Signaling (R1)

## Executive Summary
Milestone 1 implements the complete server-side recording pipeline and realtime recording signaling for NexClass virtual classrooms, fulfilling Requirement R1 and optimizing WebRTC signaling relay to O(1) for R5 mesh scalability.

---

## Files Created & Modified

### 1. `apps/api/src/models/recording.ts` (Created)
- Implemented `RecordingDoc` interface with fields: `id`, `meetingId`, `meetingCode`, `fileName`, `filePath`, `mimeType`, `sizeBytes`, `fileSize`, `durationSeconds`, `recordedBy`, `recordedByName`, `createdAt`, `updatedAt`.
- Implemented `RecordingPublic` interface and `toRecordingPublic(recording: RecordingDoc)` helper mapping storage records to API contract representation with `downloadUrl` and `streamUrl`.
- Registered `RecordingModel` with `registerModel<RecordingDoc>` supporting dual-mode persistence: Mongoose schema when MongoDB is connected, and seamless `createMemoryModel` fallback store when running keyless/in-memory.

### 2. `apps/api/src/models/index.ts` (Modified)
- Exported `RecordingDoc`, `RecordingPublic`, `toRecordingPublic`, and `RecordingModel` to maintain clean central access across backend modules.

### 3. `apps/api/src/services/recordings.ts` (Created)
- **Directory Manager**: Auto-creates storage directory configurable via `process.env.RECORDINGS_DIR`, `/app/recordings` (Docker), or `recordings/` fallback.
- **Stream Writer (`saveRecordingStream`)**: Directly pipes raw incoming binary stream to disk, bypassing Express JSON body limits. Generates unique filenames (`recording_${meetingCode}_${timestamp}_${random}.${ext}`) and creates database record with computed file size.
- **Range Streamer (`streamRecording`)**: Implements HTTP 206 Partial Content Range streaming. Accurately parses `Range: bytes=start-end` and suffix formats, emits `Content-Range: bytes start-end/fileSize`, `Accept-Ranges: bytes`, `Content-Length`, and pipes stream with `{ start, end }`. Safely returns HTTP 416 for out-of-bounds requests and HTTP 200 for full file requests.
- **Download Helper (`downloadRecording`)**: Sets `Content-Disposition: attachment; filename="..."` and streams the media file.
- **Query Helpers**: `findRecordingsByMeeting`, `findRecordingById`, `deleteRecording`.

### 4. `apps/api/src/services/index.ts` (Created)
- Re-exported all recording service utilities alongside meetings, caption pipeline, and providers.

### 5. `apps/api/src/routes/recordings.ts` (Created)
- `POST /api/meetings/:code/recordings`: Accepts raw binary media stream (`video/webm` or `video/mp4`), reads `x-recording-duration`, `x-recording-size`, `x-recorded-by`, pipes to disk storage, and returns `{ ok: true, recording: RecordingPublic }` with status 201.
- `GET /api/meetings/:code/recordings`: Lists saved recordings for the meeting with status 200.
- `GET /api/meetings/:code/recordings/:id/stream`: Streams recording with HTTP 206 Partial Content Range support.
- `GET /api/meetings/:code/recordings/:id/download`: Provides attachment download.
- Direct fallback aliases: `GET /api/recordings/:id/stream` and `GET /api/recordings/:id/download`.

### 6. `apps/api/src/app.ts` (Modified)
- Mounted `recordingRoutes` under `/api` alongside `meetingRoutes`.

### 7. `apps/api/src/realtime/socket.ts` (Modified)
- **O(1) WebRTC Peer Lookup**: Replaced linear O(N) `peerSockets(socket).find(...)` scanning with `participantSockets` Map keyed by `participantId`. Registered on `meeting:join` and cleaned up on `meeting:leave` and `disconnect`.
- **Recording Signaling Handlers**:
  - `recording:start`: Sets active room state, broadcasts `recording:state` (`{ isRecording: true, isPaused: false, startedAt, elapsedSeconds: 0, recordedBy }`) and `recording:started`.
  - `recording:pause`: Accumulates elapsed segment seconds, sets `isPaused: true`, broadcasts `recording:state` and `recording:paused`.
  - `recording:resume`: Resets segment start timestamp, sets `isPaused: false`, broadcasts `recording:state` and `recording:resumed`.
  - `recording:stop`: Finalizes total elapsed time, resets recording state, broadcasts `recording:state` (`{ isRecording: false, isPaused: false, startedAt: null, elapsedSeconds, recordedBy: null }`) and `recording:stopped`.
- **Handshake Payload**: Injected initial `recordingState` into `meeting:joined` and emitted `recording:state` upon joining room.

### 8. `apps/api/tests/recording.test.ts` (Created)
- 8 comprehensive Vitest tests verifying:
  - Recording model creation, retrieval, and public format serialization.
  - Disk storage stream writing, byte size verification, and cleanup deletion.
  - HTTP 206 Partial Content Range streaming with `Content-Range`, `Content-Length`, `Accept-Ranges`.
  - HTTP 416 Range Not Satisfiable handling for invalid ranges.
  - REST API `POST` stream upload, `GET` list, `GET` range stream, `GET` download, and 404 error cases.
  - Socket `recording:start`, `recording:pause`, `recording:resume`, `recording:stop` state broadcast cycle.
  - O(1) WebRTC offer signaling relay and map cleanup on disconnect.

---

## Verification Results
- `npm test -w @nexclass/api`: **30 passed (30 tests across 2 files, 100% pass rate)**.
- `npm run typecheck -w @nexclass/api`: **Passed with 0 errors**.
