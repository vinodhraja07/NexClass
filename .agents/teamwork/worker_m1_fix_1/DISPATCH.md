# Dispatch Task for Worker 2 (Milestone 1 Hardening & Fixes)

- **Identity**: teamwork_preview_worker
- **Role**: Backend Recording & Signaling Fix Worker
- **Working Directory**: E:\mnt\e\NexClass\.agents\teamwork\worker_m1_fix_1
- **Project Root**: E:\mnt\e\NexClass
- **Authoritative Request**: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
- **Project Scope Document**: E:\mnt\e\NexClass\PROJECT.md
- **Parent Conversation ID**: 9e5960ea-425e-42b2-ac85-94fd33a66831

## File Ownership
- `apps/api/src/services/recordings.ts`
- `apps/api/src/realtime/socket.ts`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Context & Concrete Fixes Required
Challengers identified 2 edge cases during empirical stress testing:
1. **RFC Range End-Clamping (`apps/api/src/services/recordings.ts:154`)**:
   In `streamRecording()`:
   Currently `if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end)` rejects `end >= fileSize` with HTTP 416.
   Per RFC 9110 / RFC 7233, when a client requests `end >= fileSize` (common for browser media players requesting large chunk buffers), the server MUST clamp `end` to `fileSize - 1` rather than rejecting with 416:
   ```ts
   if (isNaN(start) || start >= fileSize || start > end) {
     res.setHeader("Content-Range", `bytes */${fileSize}`);
     res.sendStatus(416);
     return;
   }
   end = Math.min(end, fileSize - 1);
   ```
2. **Socket `recording:start` Idempotency (`apps/api/src/realtime/socket.ts:419-440`)**:
   Currently, calling `recording:start` on an already active recording room unconditionally resets `startedAt` and `accumulatedElapsedSeconds` to 0.
   Add an idempotency guard:
   ```ts
   const existing = roomRecordingStates.get(code);
   if (existing && existing.isRecording) {
     const current = getRoomRecordingState(code);
     ack?.({ ok: true, alreadyActive: true, state: current });
     return;
   }
   ```
3. **Verification**:
   Run the full API test suite:
   `npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api`
   Ensure 100% of tests pass across `api.test.ts`, `recording.test.ts`, and `recording-adversarial.test.ts`.
   Run typecheck:
   `npm run typecheck --prefix "E:\mnt\e\NexClass" -w @nexclass/api`
   Write your completion report in `handoff.md`.

## 2026-10-23T14:40:18Z
You are Worker 2 implementing targeted hardening fixes for Milestone 1.
Working directory: E:\mnt\e\NexClass\.agents\teamwork\worker_m1_fix_1
Project root: E:\mnt\e\NexClass
Read ORIGINAL_REQUEST.md at: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
Read PROJECT.md at: E:\mnt\e\NexClass\PROJECT.md
Read DISPATCH.md at: E:\mnt\e\NexClass\.agents\teamwork\worker_m1_fix_1\DISPATCH.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
- apps/api/src/services/recordings.ts
- apps/api/src/realtime/socket.ts

Tasks:
1. Fix RFC range end-clamping in apps/api/src/services/recordings.ts:154 so end >= fileSize clamps to fileSize - 1 instead of returning 416.
2. Fix socket recording:start idempotency in apps/api/src/realtime/socket.ts:419-440 so calling start on an already active recording returns { ok: true, alreadyActive: true, state: current } without resetting elapsedSeconds or re-broadcasting.
3. Run npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api and ensure 100% of all tests pass (including tests/recording-adversarial.test.ts).
4. Run npm run typecheck --prefix "E:\mnt\e\NexClass" -w @nexclass/api.
5. Write your handoff.md and send message when complete.
