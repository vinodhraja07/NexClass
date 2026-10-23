# NexClass — Demo-Only QA Report

Date: 2026-10-23
Scope: the **existing** in-product Demo experience only (`/demo`, `/demo/captions`, `/demo/room`).
Mission rule honored: no demo rebuild, no backend rework, no feature removal; every shared component change preserves non-demo behavior.

Final result: **DEMO VERIFIED WITH LIMITATIONS** (see sections H/F for the exact limits — no browser automation in this environment, and Odia fallback voice is genuinely unsupported by the speech endpoint).

---

## A. Scope — files inspected and modified

### Demo-specific implementation (discovered, not created)

| File | Role |
| --- | --- |
| `apps/web/src/pages/DemoIndex.tsx` | Demo hub: two cards, one concept each |
| `apps/web/src/pages/Demo.tsx` | Demo 1 — captions & voice translation classroom |
| `apps/web/src/pages/DemoRoom.tsx` | Demo 2 — shared-room label translation |
| `apps/web/src/components/demo/DemoObjectStage.tsx` | Stylized SVG object stage with per-language labels |
| `apps/web/src/lib/demoTransport.ts` | Local simulation transport (same contract as SocketTransport) |
| `packages/shared/src/demo.ts` | Prepared segments, student seeds, chat seeds |
| `apps/api/src/routes/demo.ts` | `/api/demo/segments`, `/api/demo/speech` |

Entry points (all verified present): TopNav "Try demo", landing hero, Footer, Final CTA, Login ("Explore the demo classroom instead" at `Login.tsx:240`), Register (`Register.tsx:372`), Dashboard ("Open demo" at `Dashboard.tsx:356`).

### Files modified in this mission (all demo-relevant)

1. `apps/web/src/lib/demoTransport.ts`
   - **Honesty fix:** boot `providerStatus` claimed `translationConfigured: true` although the real environment has `TRANSLATION_PROVIDER=none`. Now `translationConfigured: false, ttsConfigured: true` (the TTS chip is genuinely the live keyless fallback voice).
   - **Timing fix:** demo chat seed timers shared the playback timer pool, so pausing within ~4 seconds of load silently cancelled pending chat messages. Chat timers now live in their own pool and only `disconnect()` clears them.
2. `apps/web/src/components/classroom/SettingsPanel.tsx` *(shared component; additive, regression-safe)*
   - Added a strictly `simulated`-scoped paragraph under the provider chips explaining that demo captions are hand-authored samples, so the "Translation ✗" chip is truthful and the "Voice ✓" chip is the real fallback voice. Non-demo renders byte-identical output.
3. `apps/web/src/pages/Demo.tsx`
   - Removed a dead no-op `useEffect` (leftover hook that did nothing).
   - "Add student" previously went dead once all simulated learners had joined. It now disables itself and relabels to "Room full" — no more silent-dead control.
   - Banner copy corrected for voice availability (Odia honestly excluded; see C/E).
4. `apps/web/src/pages/DemoIndex.tsx`
   - Card bullet corrected: the claim "translated voice in all six languages, including Odia" was false (live-checked); it now states that Odia reports honestly when no voice exists.
5. `apps/api/src/services/providers.ts` *(message-only change; behavior unchanged)*
   - Fixed a factually wrong doc comment ("including Odia") and improved the 400 error message to name the unsupported language.

## B. Human testing

No browser automation tool exists in this repo or environment (no Playwright/Puppeteer dependency; the sandbox cannot launch a desktop browser). The strongest available substitutes were used and are reported honestly:

- Server state and every REST/voice endpoint exercised with live HTTP requests (real network calls, not mocks).
- Every demo journey traced and verified at the code level against running dev servers, with HMR logs clean of errors (`dev-server.log` only shows normal hmr updates; API restarts clean after each change).
- Cross-checked against the user's own browser feedback during this session (screenshots at each step confirmed the visible result of each fix: dropdown behavior, pause/play voice, caption resume, student-language ownership, toolbar design, stage gaps).

| Journey | Steps verified | Result |
| --- | --- | --- |
| Entry points | `/`, `/login`, `/register`, `/dashboard`, footer, CTA → `/demo` | PASS (code + routes verified) |
| Demo hub | `/demo` renders two cards + simulated badge | PASS |
| Demo 1 open | `/demo/captions` — classroom shell on DemoTransport, "SIMULATED" chrome, meeting "DEMO01" | PASS (dev server 200, shell verified) |
| Play/pause/restart | Play unlocks audio on click; pause flushes voice instantly; restart resets state (pause/play re-entrancy bugs fixed earlier this session and re-verified by typecheck + transport tests) | PASS |
| Voice on pause/play | Voice no longer deadlocks (audio promise settles on pause) and never replays old lines (seen-memory kept) | PASS |
| Caption resume | An interrupted line keeps its remaining slot; captions resume where paused instead of jumping ahead | PASS |
| Add/remove student | Pool of 5 base + 6 extra; adds via participant join event; "Room full" state added this session | PASS |
| Student language pills | Six-language selects per student; language owned by the student, never the host; tile chips update live | PASS |
| Chat | Seeded messages stream in; sending echoes locally; empty send rejected (ChatPanel trims + disables); participant identity correct | PASS |
| Mic/cam controls | Real browser media controls preserved as designed; muted state visible on self tile | PASS (code path; real UI confirmed via user screenshots) |
| Languages | `en/ta/hi/bn/mr` full voice OK; `or` honest degradation (see E) | PASS with documented limitation |
| Demo 2 | Teacher console radio → 6 participant cards re-label instantly in each language; geometry constant; `lang` attributes present | PASS |
| Exit | "Leave the demo (simulated)" → toast + navigate `/`; "All demos" links back to hub; "End demo for everyone (simulated)" clearly labeled | PASS |
| Refresh while in demo | Page reload re-creates DemoTransport from scratch (client-only state; no server pollution) — predictable reset | PASS |
| Re-entry | Unmount clears timers (`disconnect()`), hero restarts, no orphan state | PASS |

## C. Bugs discovered → root cause → fix → retest

1. **Dishonest provider status in demo**
   - Problem: SettingsPanel showed a green "Translation ✓" chip in demo although no translation provider exists; demo data simply claimed `translationConfigured: true`.
   - Root cause: `demoTransport.connect()` hard-coded provider flags from the configured-provider era.
   - Fix: truthful flags + additive demo-only note in SettingsPanel (`simulated` branch only).
   - Retest: verified against real `/api/providers/status` (`translation: none`, `tts: google-translate-tts-fallback`) — demo now matches reality.
2. **Pending chat cancelled by pause**
   - Problem: pausing inside the first ~4s dropped seeded chat messages.
   - Root cause: chat and lecture timers shared one array that `pausePlayback()` wipes.
   - Fix: dedicated `chatTimers` array, cleared only on disconnect.
   - Retest: code-traced both paths; HMR clean; typecheck passes.
3. **"Add student" dead control** — see A.3.
4. **Voice unavailable for Odia broke the demo's public claims** (discovered by live endpoint test)
   - Problem: `/api/demo/speech?lang=or` → HTTP 400 upstream → demo hub/banner promised "voice in all six languages including Odia".
   - Root cause: Google Translate speech endpoint only supports a subset (verified live: en, ta, hi, bn, mr; rejects `or` with 400).
   - Fix: honest copy in the three demo surfaces (hub card, banner, explainer card) + clearer 502 message naming the language. No fake success introduced; degrade → browser voice → explicit "no installed voice" error.
   - Retest: `or` now returns 502 with `"the endpoint does not support \"or\""`; `ta` still 200.
5. **Dead `useEffect` in Demo.tsx** — removed; zero behavior change.

## D. UI/UX improvements (demo-relevant)

- Provider truth panel (Settings → connection section) — evaluator sees exactly what is real vs prepared.
- "Room full" state — no dead-looking control.
- Terminology protection remains visible in captions (torque/eigenvalue restored with original in parentheses) — unchanged, verified in prepared samples.
- Earlier-in-session demo fixes still in effect and regression-checked: play-button-first-audio, student-owned language pills, eliminated stage mid-band gap, toolbar keycap redesign, no fake AI claims anywhere.

## E. Language verification

| Language | Captions (prepared) | Fallback voice (live-tested) | Honest reporting |
| --- | --- | --- | --- |
| English | PASS | PASS (200, `google-translate-tts-fallback`) | n/a |
| Tamil | PASS ("௦ torque" preserved as `(Torque)`) | PASS (200) | n/a |
| Hindi | PASS | PASS (200) | n/a |
| Bengali | PASS | PASS (200) | n/a |
| Marathi | PASS | PASS (200) | n/a |
| Odia | PASS | **502 — endpoint rejects `or` (HTTP 400)** | Yes — browser voice chain + explicit error, no fabrication |

Terminology preservation verified in all six languages of the prepared segments (terms render with the original English in parentheses).

## F. Automated verification

| Check | Command (repo scripts) | Result |
| --- | --- | --- |
| API tests | `npm test -w @nexclass/api` | **22/22 passed** (added `validates demo voice requests before synthesizing` — 400 validation, network-free) |
| Web typecheck | `npm run typecheck -w @nexclass/web` | PASS |
| API typecheck | `npm run typecheck -w @nexclass/api` | PASS |
| Web build | `npm run build -w @nexclass/web` | PASS (2.5s, demo chunks: Demo 17.2 kB, DemoRoom 12 kB) |
| API build | `npm run build -w @nexclass/api` | PASS (dist/server.js 163.2 kB) |
| Live API checks | curl | `/api/demo/segments` 200; `/api/demo/speech` satisfied languages 200 ×5, Odia 502 (honest); `/api/providers/status` consistent with demo claims |
| Browser tests | — | **Not run** — no browser automation available in this environment (Playwright/Puppeteer not installed; sandbox cannot open a desktop browser). Not marked as passed. |
| Console/network errors | `dev-server.log` tail + HMR stream | No errors or warnings; server restarts clean |

## G. Regression verification

- Landing page, `/login`, `/register`, `/join`, `/dashboard`, `/meet/:code` untouched; real dashboard provider bar still reads the real `/api/providers/status` (re-verified live).
- Shared components touched in this mission: only `SettingsPanel`, which gained an additive `simulated`-gated note — non-demo rendering is unchanged (same JSX tree, new paragraph never renders).
- `providers.ts` change is comment/message text only; API suite green.
- Git status: **not a git repository** (`fatal: not a git repository`) — there is no VCS history or uncommitted diff to preserve; all edits were additive or copy fixes, reviewable line-by-line in this report.

## H. Known limitations

1. **Odia synthesized voice is impossible without a provider that supports it.** The keyless Google Translate speech endpoint rejects Odia. With live `TTS_PROVIDER=google-tts|azure-tts` credentials this becomes a real voice; without them the browser voice chain is tried and fails honestly ("no installed voice for this language").
2. **Live AI translation requires `TRANSLATION_PROVIDER` credentials.** Demo captions are preparation-quality hand-authored samples — never presented as AI output.
3. **No browser automation in this environment.** Journeys were verified via code traces, live HTTP checks against running servers, Hot-Module-Reload logs with zero errors, and user screenshots during the session; a final human click-through (esp. audio on demo host machines) is still recommended.
4. **WebRTC media is real in the live room but is not part of the demo scope** and was not exercised between two browsers here; STUN-only ICE is a documented deployment limitation in the app itself.
5. Sandbox note: Node outbound calls are blocked, but the API server process (running outside the sandbox) does reach the network — all voice checks above are genuine API responses from the running dev server.

## I. Final result

**DEMO VERIFIED WITH LIMITATIONS**

The demo can be presented confidently: all three demo pages, every visible control, per-student language isolation, prepared caption/translation flow, terminology protection, honest provider status, and honest voice degradation. Explicit limits: no live AI translation, no Odia synthesized voice without a supporting provider, and no automated browser click-through in this environment.
