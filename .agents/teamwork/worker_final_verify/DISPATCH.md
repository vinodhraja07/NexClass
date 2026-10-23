# Dispatch for Final Verification Worker (Milestone 5 & Milestone 6 Gating)

- **Identity**: teamwork_preview_worker
- **Role**: Final Verification & Quality Assurance Worker
- **Working Directory**: E:\mnt\e\NexClass\.agents\teamwork\worker_final_verify
- **Project Root**: E:\mnt\e\NexClass
- **Authoritative Request**: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
- **Project Scope Document**: E:\mnt\e\NexClass\PROJECT.md
- **Parent Conversation ID**: 9e5960ea-425e-42b2-ac85-94fd33a66831

## Verification Mandate & Tasks
You are the Final QA & Verification Worker responsible for verifying all requirements across Milestones 1 through 5:
1. **Vitest Test Suite Verification**:
   - Run: `npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api`
   - Verify 100% pass across all test files (`api.test.ts`, `recording.test.ts`, `recording-adversarial.test.ts`, `stress.test.ts`).
2. **TypeScript Compilation Check**:
   - Run: `npm run typecheck --prefix "E:\mnt\e\NexClass"`
   - Verify exit code 0 and 0 errors across `@nexclass/api` and `@nexclass/web`.
3. **Web Production Build**:
   - Run: `npm run build -w @nexclass/web --prefix "E:\mnt\e\NexClass"`
   - Verify clean Vite production bundle in `apps/web/dist`.
4. **Docker Compose Configuration Validation**:
   - Run: `docker compose -f docker-compose.yml config`
   - Verify exit code 0 with valid service orchestration for MongoDB, Redis, API, and Web.
5. **Standalone 8-Peer Concurrency Stress Test Suite**:
   - Run: `npx tsx scripts/stress-concurrency.ts` (or `npm run test:stress --prefix "E:\mnt\e\NexClass"`)
   - Verify 8 concurrent peers, 28 WebRTC mesh signaling pairs (112+ messages), 128 chat deliveries, caption streaming, and Odia TTS fallback concurrency without drops or memory leaks.
6. **Deliver Full Verification Evidence in `handoff.md`**:
   - Document all command outputs, test counts, durations, and artifact locations.
   - Deliver clear confirmation of all Acceptance Criteria from `ORIGINAL_REQUEST.md`.
   - Notify orchestrator with `send_message`.


## 2026-10-23T16:52:52Z
You are the Final QA & Verification Worker for NexClass.
Working directory: E:\mnt\e\NexClass\.agents\teamwork\worker_final_verify
Project root: E:\mnt\e\NexClass
Read ORIGINAL_REQUEST.md at: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
Read PROJECT.md at: E:\mnt\e\NexClass\PROJECT.md
Read DISPATCH.md at: E:\mnt\e\NexClass\.agents\teamwork\worker_final_verify\DISPATCH.md

Execute and verify all criteria:
1. Run: npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api
   Confirm 100% of Vitest tests pass across all test files.
2. Run: npm run typecheck --prefix "E:\mnt\e\NexClass"
   Confirm 0 errors across api and web.
3. Run: npm run build -w @nexclass/web --prefix "E:\mnt\e\NexClass"
   Confirm Vite production build succeeds.
4. Run: docker compose -f docker-compose.yml config
   Confirm docker compose validation passes with code 0.
5. Run: npx tsx scripts/stress-concurrency.ts
   Confirm 8-peer concurrency test runs through room join, 28 WebRTC mesh pairs, 128 chat deliveries, captions, and Odia TTS fallback concurrency without drops.
6. Write your comprehensive verification handoff.md and send message when done.
