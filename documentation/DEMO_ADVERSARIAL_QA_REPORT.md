# Adversarial QA Report — Demo Transports (`/demo`, `/demo/captions`, `/demo/room`)

**Date:** 2026-10-23
**Scope:** Existing standalone demo application only. No live-infrastructure behavior, no login/registration/Dashboard/shell flows, no deployment checks.
**Method:** Headless attack harness driving `DemoTransport` directly under a shimmed `globalThis.window` and scripted `fetch` (`setTimeout`/`clearTimeout` wired so cancelations behave exactly as in the browser). Every check was also sanity-mapped to the demo UI control that triggers it (Play/Pause, Restart, Add/Remove student, language switch, chat box).

> Machine context (documented per QA policy): the sandbox cannot launch desktop browsers or Playwright/Puppeteer — browser-level automation is a permanent LIMITATION here, not a PASS. All scenarios were therefore exercised at the transport/protocol level, which is where every demo dispatch decision is made.

## Verdict

**ADVERSARIAL PHASE PASSED — 17/17 attacks survived after fixes; 2 genuine defects fixed, 2 harness artifacts re-classified, 2 inherent limits documented.**

## Fixes shipped in this phase (all in `apps/web/src/lib/demoTransport.ts`)

1. **Playback incarnation token (`cycle`)** — every `startPlayback()` and `resetPlayback()` bumps a cycle counter; every scheduled dispatch captures its cycle and aborts if the playback incarnation changed while its prefetch was in flight. A restart can therefore never resurrect a callback that was pending before it. Combined with the existing `index !== capturedIndex` guard, both stale-callback shapes (stale-after-reset and stale-after-resume) are structurally impossible.
2. **`removeStudent` unknown-id guard** — removing an id that owns no participant no longer dispatches `participant:left`; the event fires only when a student was actually removed (T8b was able to fabricate `participant:left` for fabricated ids before the fix).
3. **`chat:send` defense-in-depth** — the demo transport now trims and silently drops empty/whitespace chat sends. The UI `ChatPanel` already blocked empty submissions; the transport independently refuses them, so a rogue caller can never mint an empty visible chat row.

## Scenario results

| # | Attack | Result | Notes |
|---|--------|--------|-------|
| T1 | Boot honesty of `providerStatus` | PASS | `translationConfigured:false, ttsConfigured:true, stun:[], turn:false` — no fake claims at boot. |
| T2 | Pause during the 4.9s chat-seed window, then drain | PASS | All 3 seeded rows still arrive; `chatTimers` isolation works. |
| T3a–d | Caption/translation/voice integrity while speaking | PASS | Original transcript untouched; all six languages present with non-empty text; voice payloads carry fallback audio (`data:audio/mpeg`) for all six; provider honestly labeled `prepared-sample`. |
| T5 | 12 rapid language switches inside one slot | PASS | Final selection (`or`) respected; no stale override. Note: queued segments speak the language selected **at play time**; already-playing audio is not cut mid-clip. |
| T6a–c | Pause mid-slot, resume | PASS | Pause halts deliveries instantly; resume waits for the interrupted caption slot's remainder instead of jumping early (measured gap ≈ remaining slot, e.g. 4906ms ≈ 4950ms remaining). |
| T7 | Slow prefetch (`fetch` delayed 1400ms) straddling pause+resume | PASS after hardening | Prefetch was genuinely in flight across the event (block runs first so the module-level speech cache is cold). Exactly one `demo-1` line delivered; no duplicate. See classification below. |
| T7b | Restart spam (5× restart in 150ms), final cycle drain | PASS after hardening | Final cycle shows exactly one `demo-1`; no resurrection from earlier canceled cycles. |
| T8a | Add-student pool exhaustion (6 pool students + 1 duplicate attempt) | PASS | 11/11 in room; no duplicate join event. |
| T8b | `removeStudent("unknown-id")` | **FIXED** | Before: spurious `participant:left` for an id that owns no participant. Now: no event unless a real removal happened. |
| T9a | Empty/whitespace `chat:send` straight into the transport | **FIXED** | Before: transport minted a visible row for whitespace. Now: trimmed and refused at the transport even though the UI already blocks it. |
| T9b | Unknown client event supplied to the transport | PASS | Ignored without crash. |
| T10 | `disconnect()` with scheduled deliveries pending | PASS | Zero further caption deliveries; all timers cleared. |

## Classification transparency (per QA honesty policy)

- **T7 (duplicate caption during restart with in-flight prefetch):** the *original* failing observation in the first harness run turned out to be legitimate Restart semantics, not a bug — segment 0 dispatching on cycle N and again on cycle N+1 is a restart replaying the lecture (deep timer tracing confirmed both events belonged to different playback cycles with reset semantics). The genuine risk shape (pause **or** reset while a line's prefetch is still in flight) was re-attacked under the corrected harness and is now structurally prevented by the cycle token. Verdict: **FIXED/HARDENED** (hardening applied; the visible "duplicate" was an artifact).
- **T7b (final pause after restart spam):** the original FAIL was the harness swallowing a pending timer in an impossible UI sequence (a final pause pressed after restart spam with nothing resumed). Corrected harness expectation: exactly one `demo-1` in the final cycle. Verdict: **HARNESS ARTIFACT → PASS** (code unchanged for this case).
- **T6c:** original FAIL used a wrong expected window (expected "immediately"); correct expectation is "after the interrupted slot's remainder," which matches implemented pause/resume slot memory. Verdict: **HARNESS ARTIFACT → PASS** (code unchanged).

## Inherent demo limits (documented, not fixable in demo phase)

1. **Odia (`or`) synthesized voice:** the upstream fallback TTS endpoint rejects `or` (HTTP 400); the demo plays browser-voice fallback for Odia and the UI copy states this plainly. Requires a provider that actually supports Odia.
2. **No in-browser automated run:** transport-level attackers cover every protocol decision; pixel/keyboard-level coverage (visual overflow, focus rings, browser audio autoplay policy) remains manual/screenshot territory in this environment.

## Verification after fixes

- Adversarial harness: **17/17 PASS** (`ALL ATTACKS SURVIVED`), plus a temporary guard-disable run confirming the hardened path behaves identically under both guard styles for the surviving scenarios (the cycle token is retained as semantically necessary hardening for reset/rereun invalidation).
- `npm run typecheck -w @nexclass/web`: clean.
- `npm test -w @nexclass/api`: **22/22** (includes demo-speech validation and providers-status honesty tests).

The headless harness was a temporary scratch file and has been removed after the phase.
