# Dispatch for Worker 6 (Replacement) — Milestone 5: Automated Multi-Peer Concurrency Stress Test Suite (R5)

- **Identity**: teamwork_preview_worker
- **Role**: Concurrency & Stress Testing Worker
- **Working Directory**: E:\mnt\e\NexClass\.agents\teamwork\worker_m5_2
- **Project Root**: E:\mnt\e\NexClass
- **Authoritative Request**: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
- **Project Scope Document**: E:\mnt\e\NexClass\PROJECT.md
- **Explorer Survey Reference**: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_3\survey_devops_report.md
- **Previous Partial Progress**: E:\mnt\e\NexClass\.agents\teamwork\worker_m5\progress.md
- **Parent Conversation ID**: 9e5960ea-425e-42b2-ac85-94fd33a66831

## File Ownership (Strict & Exclusive)
You exclusively own and may edit or create these files:
- `scripts/stress-concurrency.ts` (create standalone automated 8+ peer stress test runner)
- `apps/api/tests/stress.test.ts` (create Vitest stress test suite integrating into CI)
- `apps/api/src/services/providers.ts` (add in-flight promise deduplication for Odia TTS fallback to prevent race conditions under concurrent load)
- `package.json` (add `"test:stress": "npx tsx scripts/stress-concurrency.ts"`)

Do NOT modify any files in `apps/web/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Requirements (R5)
1. **In-Flight Promise Coalescing & Cache Guard in `apps/api/src/services/providers.ts`**:
   - In `GoogleTranslateTtsFallbackAdapter`:
     - Add `private inflightPromises = new Map<string, Promise<TtsResult>>();`
     - When synthesizing Odia text (or any fallback language), check if an identical request is already in-flight. If so, return the existing promise so concurrent queries share the single network round-trip.
     - Ensure the FIFO cache strictly remains bounded at 150 entries (`FALLBACK_TTS_CACHE_MAX = 150`) with no memory leaks.
2. **Automated Multi-Peer Concurrency Stress Test Suite (`scripts/stress-concurrency.ts`)**:
   - Spin up a test server or connect to local API server.
   - Register 1 teacher and 7 students (8 total concurrent participants) and authenticate them.
   - Establish 8 concurrent Socket.io client connections to the same meeting room.
   - WebRTC mesh signaling: For all 28 peer pairs, exchange `webrtc:offer`, `webrtc:answer`, and multiple `webrtc:ice` candidates (112+ messages). Verify 100% signaling delivery accuracy through `participantSockets`.
   - Event fanout: Broadcast 128 chat messages (`chat:send`) across participants and verify all peers receive them.
   - Stream concurrent live captions (`caption:interim` bursts followed by `caption:original` segments) verifying room broadcast without packet drops.
   - Stress test Odia speech synthesis fallback under 50+ concurrent queries verifying phonetic alignment, promise deduplication, and cache bounds.
3. **Vitest Integration (`apps/api/tests/stress.test.ts`)**:
   - Create Vitest test suite executing the 8-peer concurrency test in CI.
4. **Root `package.json`**:
   - Add `"test:stress": "npx tsx scripts/stress-concurrency.ts"` to scripts.
5. **Verification**:
   - Run `npx tsx scripts/stress-concurrency.ts` -> exits with code 0 and prints full metric summary.
   - Run `npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api` -> 100% pass across all test files.
   - Run `npm run typecheck --prefix "E:\mnt\e\NexClass"` -> 0 errors.
   - Write handoff report in `handoff.md`.


## 2026-10-23T15:55:08Z
[Message] timestamp=2026-10-23T15:55:08Z sender=9e5960ea-425e-42b2-ac85-94fd33a66831 priority=MESSAGE_PRIORITY_HIGH content=You are Worker 6 (Replacement) implementing Milestone 5: Automated Multi-Peer Concurrency Stress Test Suite (R5).
Working directory: E:\mnt\e\NexClass\.agents\teamwork\worker_m5_2
Project root: E:\mnt\e\NexClass
Read ORIGINAL_REQUEST.md at: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
Read PROJECT.md at: E:\mnt\e\NexClass\PROJECT.md
Read DISPATCH.md at: E:\mnt\e\NexClass\.agents\teamwork\worker_m5_2\DISPATCH.md
Read survey findings at: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_3\survey_devops_report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
- scripts/stress-concurrency.ts
- apps/api/tests/stress.test.ts
- apps/api/src/services/providers.ts
- package.json

Tasks:
1. In apps/api/src/services/providers.ts, add in-flight promise deduplication for Odia fallback TTS to prevent race conditions under concurrent load, and verify FIFO cache bounded at 150 items.
2. Create scripts/stress-concurrency.ts: simulates 8 concurrent participants joining room, 28 WebRTC mesh signaling pairs (112+ messages), 128 chat messages, and caption streaming under load.
3. Create apps/api/tests/stress.test.ts: Vitest suite integrating 8-peer concurrency test.
4. Add "test:stress" script to root package.json.
5. Verify npx tsx scripts/stress-concurrency.ts passes, npm test -w @nexclass/api passes 100%, and npm run typecheck passes with 0 errors.
6. Write handoff.md and notify orchestrator when done.
