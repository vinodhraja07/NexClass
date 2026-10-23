# BRIEFING — 2026-10-23T15:44:00Z

## Mission
Implement Milestone 5: Automated Multi-Peer Concurrency Stress Test Suite (R5) for NexClass.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: E:\mnt\e\NexClass\.agents\teamwork\worker_m5
- Original parent: 9e5960ea-425e-42b2-ac85-94fd33a66831
- Milestone: Milestone 5 (R5 - Automated Multi-Peer Concurrency Stress Test Suite)

## 🔒 Key Constraints
- File Ownership (Strict & Exclusive):
  - `scripts/stress-concurrency.ts` (create standalone automated 8+ peer stress test runner)
  - `apps/api/tests/stress.test.ts` (create Vitest stress test suite integrating into CI)
  - `apps/api/src/services/providers.ts` (add in-flight promise deduplication for Odia TTS fallback to prevent race conditions; bounded FIFO cache at 150 items)
  - `package.json` (add `"test:stress": "npx tsx scripts/stress-concurrency.ts"`)
- Do NOT modify any files in `apps/web/`.
- Integrity Mandate: Genuine implementation, real state, no hardcoded results, no dummy facades.

## Current Parent
- Conversation ID: 9e5960ea-425e-42b2-ac85-94fd33a66831
- Updated: 2026-10-23T15:44:00Z

## Task Summary
- **What to build**:
  1. In `apps/api/src/services/providers.ts`, add in-flight promise deduplication (`inflightTtsRequests = new Map<string, Promise<TtsResult>>()`) for Odia fallback TTS to prevent thundering herd race conditions, and verify FIFO cache bounded at 150 items.
  2. Create `scripts/stress-concurrency.ts`: simulates 8 concurrent participants joining room, 28 WebRTC mesh signaling pairs (112+ messages), 128 chat messages, and caption streaming under load.
  3. Create `apps/api/tests/stress.test.ts`: Vitest test suite integrating 8-peer concurrency test into CI.
  4. Add `"test:stress"` script to root `package.json`.
  5. Verify `npx tsx scripts/stress-concurrency.ts` passes, `npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api` passes 100%, and `npm run typecheck --prefix "E:\mnt\e\NexClass"` passes with 0 errors.
  6. Write `handoff.md` and notify orchestrator when done.
- **Success criteria**:
  - 8 peers join concurrently without drops.
  - 28 mesh signaling pairs exchange offer/answer/ICE (112+ messages) with 100% delivery.
  - 128 chat messages received across 8 peers.
  - Caption streaming and terminology protection verified under load.
  - Odia fallback TTS deduplicates in-flight promises and enforces 150-item cache boundary.
  - Vitest test suite and standalone runner exit code 0.
  - Monorepo typecheck 0 errors.
- **Interface contracts**: `E:\mnt\e\NexClass\PROJECT.md`
- **Code layout**: `E:\mnt\e\NexClass\PROJECT.md` § Code Layout

## Key Decisions Made
- Server bootstrap: Dual-mode connection supporting either an already-running server (via `API_URL` / `http://localhost:4000`) or dynamically bootstrapping an in-process server on an ephemeral port (`bootstrap({ port: 0 })`) for deterministic CI runs without pre-running background processes.
- Socket.IO clients: Real `socket.io-client` instances connected over localhost HTTP to exercise true network and serialization paths.
- Odia TTS In-flight coalescing: Map `cacheKey -> Promise<TtsResult>` in `GoogleTranslateTtsFallbackAdapter.synthesize` with `finally` cleanup to prevent memory leaks and thundering-herd duplicate requests.

## Change Tracker
- **Files modified**: None yet
- **Build status**: Initial baseline check running
- **Pending issues**: None

## Quality Status
- **Build/test result**: In progress
- **Lint status**: Pending
- **Tests added/modified**: `apps/api/tests/stress.test.ts` planned

## Loaded Skills
- None explicitly assigned
