# BRIEFING — 2026-10-23T15:58:00Z

## Mission
Implement Milestone 5 (R5): Automated Multi-Peer Concurrency Stress Test Suite, in-flight promise deduplication for Odia TTS fallback adapter, bounded FIFO cache, standalone stress test runner, Vitest stress suite, and root test:stress script.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: E:\mnt\e\NexClass\.agents\teamwork\worker_m5_2
- Original parent: 9e5960ea-425e-42b2-ac85-94fd33a66831
- Milestone: Milestone 5 (Multi-Peer Concurrency Stress Test Suite - R5)

## 🔒 Key Constraints
- Exclusive file ownership:
  - `scripts/stress-concurrency.ts`
  - `apps/api/tests/stress.test.ts`
  - `apps/api/src/services/providers.ts`
  - `package.json`
- Do NOT modify any files in `apps/web/`.
- MANDATORY INTEGRITY: All implementations must be genuine. Real state, real behavior. No dummy/facade implementations.
- Verify `npx tsx scripts/stress-concurrency.ts` passes with exit code 0.
- Verify `npm test -w @nexclass/api` passes 100%.
- Verify `npm run typecheck` passes with 0 errors.

## Current Parent
- Conversation ID: 9e5960ea-425e-42b2-ac85-94fd33a66831
- Updated: 2026-10-23T15:58:00Z

## Task Summary
- **What to build**:
  1. In `apps/api/src/services/providers.ts`: In-flight promise deduplication for Odia fallback TTS in `GoogleTranslateTtsFallbackAdapter` (and verify bounded FIFO cache at 150 items).
  2. In `scripts/stress-concurrency.ts`: Standalone stress test simulating 8 concurrent participants joining room, 28 WebRTC mesh signaling pairs (112+ messages), 128 chat messages (16 sent, 128 received), caption streaming under load, and 50+ Odia TTS fallback requests with promise deduping and bounded cache verification.
  3. In `apps/api/tests/stress.test.ts`: Vitest suite integrating 8-peer concurrency test.
  4. In root `package.json`: Add `"test:stress": "npx tsx scripts/stress-concurrency.ts"`.
- **Success criteria**:
  - `npx tsx scripts/stress-concurrency.ts` exits 0 with complete metrics table.
  - `npm test -w @nexclass/api` passes 100%.
  - `npm run typecheck` passes with 0 errors.
- **Interface contracts**: `PROJECT.md` § Concurrency Stress Test Runner Interface

## Key Decisions Made
- [TBD]

## Change Tracker
- **Files modified**: None yet
- **Build status**: Pending baseline check
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Pending
- **Tests added/modified**: Pending

## Artifact Index
- `E:\mnt\e\NexClass\.agents\teamwork\worker_m5_2\DISPATCH.md` — assignment dispatch
- `E:\mnt\e\NexClass\.agents\teamwork\worker_m5_2\BRIEFING.md` — working memory
