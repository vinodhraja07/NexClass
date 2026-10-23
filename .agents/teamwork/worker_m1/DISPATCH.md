# Dispatch for Worker 1 — Milestone 1: Backend Recording & Signaling (R1)

- **Identity**: teamwork_preview_worker
- **Role**: Backend Recording & Signaling Implementation Worker
- **Working Directory**: E:\mnt\e\NexClass\.agents\teamwork\worker_m1
- **Project Root**: E:\mnt\e\NexClass
- **Authoritative Request**: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
- **Project Scope Document**: E:\mnt\e\NexClass\PROJECT.md
- **Explorer Survey Reference**: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_1\survey_backend_report.md
- **Parent Conversation ID**: 9e5960ea-425e-42b2-ac85-94fd33a66831

## File Ownership (Strict & Exclusive)
You exclusively own and may edit or create these files:
- `apps/api/src/models/recording.ts` (create Mongoose schema & memory fallback store for recordings)
- `apps/api/src/models/index.ts` (export Recording models & types)
- `apps/api/src/services/recordings.ts` (create disk storage manager, binary stream writer, range streamer)
- `apps/api/src/services/index.ts` (export recordings service)
- `apps/api/src/routes/recordings.ts` (create recording routes: POST upload stream, GET list, GET stream with HTTP 206, GET download)
- `apps/api/src/routes/meetings.ts` or `apps/api/src/app.ts` (mount `/api/meetings/:code/recordings` or `/api/recordings` endpoints as specified in interface contracts)
- `apps/api/src/realtime/socket.ts` (add `recording:start`, `recording:stop`, `recording:pause`, `recording:resume`, broadcast `recording:state`, and optimize `peerSockets` lookup map)
- `apps/api/tests/recording.test.ts` (new Vitest tests verifying upload, list, stream, and socket events)

Do NOT modify files in `apps/web/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks & Detailed Requirements
1. **Recording Model & Storage**:
   - Create `apps/api/src/models/recording.ts`:
     - Fields: `id`, `meetingCode`, `fileName`, `filePath`, `mimeType`, `sizeBytes`, `durationSeconds`, `recordedBy` (participantId), `createdAt`, `updatedAt`.
     - Support both MongoDB (`Mongoose`) and in-memory store fallback when MongoDB is not connected.
     - Storage directory: `/app/recordings` or `apps/api/recordings/` (configurable via `env.recordingsDir` defaulting to `path.resolve(process.cwd(), "recordings")` or `apps/api/recordings`). Ensure directory is auto-created.
2. **Recording Stream Upload & API Endpoints**:
   - `POST /api/meetings/:code/recordings`:
     - Handle raw binary stream (`video/webm` or `video/mp4`) directly piped to file on disk to bypass the 1MB Express JSON body limit.
     - Accept optional headers: `x-recording-duration`, `x-recorded-by`, `x-recording-size`.
     - Persist record in database / memory store.
     - Return `{ ok: true, recording: { id, meetingCode, fileName, sizeBytes, durationSeconds, createdAt, downloadUrl, streamUrl } }`.
   - `GET /api/meetings/:code/recordings`:
     - Return list of recordings for the meeting: `{ ok: true, recordings: [...] }`.
   - `GET /api/meetings/:code/recordings/:id/stream`:
     - Implement HTTP 206 Partial Content Range streaming with `Content-Range`, `Accept-Ranges: bytes`, `Content-Length`, `Content-Type: video/webm`.
   - `GET /api/meetings/:code/recordings/:id/download`:
     - Stream file with `Content-Disposition: attachment; filename="..."`.
3. **Realtime Recording Signaling & WebRTC Map Optimization**:
   - In `apps/api/src/realtime/socket.ts`:
     - Add socket event listeners for room recording:
       - `recording:start` -> updates room state, broadcasts `recording:state` (`{ isRecording: true, isPaused: false, startedAt: Date.now(), elapsedSeconds: 0, recordedBy }`).
       - `recording:pause` -> broadcasts `recording:state` (`{ isRecording: true, isPaused: true, ... }`).
       - `recording:resume` -> broadcasts `recording:state` (`{ isRecording: true, isPaused: false, ... }`).
       - `recording:stop` -> broadcasts `recording:state` (`{ isRecording: false, isPaused: false, startedAt: null, elapsedSeconds, recordedBy: null }`).
     - On `meeting:join`, send the current `recording:state` in the initial handshake payload.
     - Replace linear `peerSockets(socket).find(...)` with `Map<string, MeetingSocket>` or room-scoped participant lookup for `O(1)` WebRTC offer/answer/ICE routing.
4. **Verification**:
   - Run Vitest tests: `npm test -w @nexclass/api`. Ensure ALL 22 existing tests pass, plus your new recording tests pass.
   - Run typecheck: `npm run typecheck -w @nexclass/api` (or root `npm run typecheck`).
   - Write your implementation report to `E:\mnt\e\NexClass\.agents\teamwork\worker_m1\changes.md` and complete `handoff.md`.


## 2026-10-23T13:46:19Z
[Message] timestamp=2026-10-23T13:46:19Z sender=9e5960ea-425e-42b2-ac85-94fd33a66831 priority=MESSAGE_PRIORITY_HIGH content=You are Worker 1 implementing Milestone 1: Backend Recording & Signaling (R1).
Your working directory is: E:\mnt\e\NexClass\.agents\teamwork\worker_m1
Project root: E:\mnt\e\NexClass
Read the authoritative user request at: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project scope and contracts at: E:\mnt\e\NexClass\PROJECT.md
Read your dispatch details at: E:\mnt\e\NexClass\.agents\teamwork\worker_m1\DISPATCH.md
Read the survey findings at: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_1\survey_backend_report.md
