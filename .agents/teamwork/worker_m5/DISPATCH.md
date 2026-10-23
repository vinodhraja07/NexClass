# Dispatch for Worker 6 — Milestone 5: Automated Multi-Peer Concurrency Stress Test Suite (R5)

- **Identity**: teamwork_preview_worker
- **Role**: Concurrency & Stress Testing Worker
- **Working Directory**: E:\mnt\e\NexClass\.agents\teamwork\worker_m5
- **Project Root**: E:\mnt\e\NexClass
- **Authoritative Request**: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
- **Project Scope Document**: E:\mnt\e\NexClass\PROJECT.md
- **Explorer Survey Reference**: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_3\survey_devops_report.md
- **Parent Conversation ID**: 9e5960ea-425e-42b2-ac85-94fd33a66831

## File Ownership (Strict & Exclusive)
You exclusively own and may edit or create these files:
- `scripts/stress-concurrency.ts` (create standalone automated 8+ peer stress test runner)
- `apps/api/tests/stress.test.ts` (create Vitest stress test suite integrating into CI)
- `apps/api/src/services/providers.ts` (add in-flight promise deduplication for Odia TTS fallback to prevent thundering herd race conditions)
- `package.json` (add `"test:stress": "npx tsx scripts/stress-concurrency.ts"`)

Do NOT modify any files in `apps/web/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Requirements (R5)
1. **8+ Concurrent Participant Simulation (`scripts/stress-concurrency.ts`)**:
   - Spin up a test server or connect to local API server.
   - Register 1 teacher and 7 students (8 total participants) and generate JWT tokens.
   - Establish 8 concurrent Socket.io client connections to the same meeting room.
   - Verify room join and handshake acknowledgment across all 8 peers.
2. **WebRTC Mesh Signaling Stability Under Load**:
   - For 8 peers in full mesh, there are N*(N-1)/2 = 28 peer pairs.
   - Simulate WebRTC signaling for all 28 pairs: exchange `webrtc:offer`, `webrtc:answer`, and multiple `webrtc:ice` candidates (112+ messages total).
   - Assert 100% signaling delivery accuracy through the server's $O(1)$ `participantSockets` map without drops or timeouts.
3. **Room Event Fanout Under Load**:
   - Burst 128 chat messages (`chat:send`) across participants and verify all peers receive them.
   - Stream concurrent live captions: each participant sends rapid `caption:interim` bursts followed by `caption:original` segments, verifying room broadcast without packet drops.
4. **Zero-Key Odia Speech Synthesis Fallback Concurrency & Caching**:
   - Inspect `apps/api/src/services/providers.ts`:
     - Implement in-flight promise coalescing (`inflightTtsRequests = new Map<string, Promise<TtsResult>>()`) so concurrent identical Odia synthesis requests share the single in-flight resolution.
     - Stress test Odia phonetic Unicode transliteration (`odiaToDevanagariPhonetic`, U+0B00..U+0B7F to U+0900..U+097F) under 50+ concurrent requests.
     - Verify cache eviction boundary (FIFO cache strictly capped at 150 items without memory leaks).
5. **Vitest Integration (`apps/api/tests/stress.test.ts`)**:
   - Create Vitest test suite executing the 8-peer concurrency test in CI.
   - Ensure all tests pass cleanly within timeout limits.
6. **Verification**:
   - Run `npx tsx scripts/stress-concurrency.ts` -> exits code 0 with detailed performance metrics.
   - Run `npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api` -> all test files pass 100%.
   - Run `npm run typecheck --prefix "E:\mnt\e\NexClass"` -> 0 errors.
   - Write handoff report in `handoff.md`.
