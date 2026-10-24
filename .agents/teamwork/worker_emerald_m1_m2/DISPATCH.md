## 2026-10-24T04:53:36Z

You are Worker Emerald M1 M2 implementing the Emerald Glass UI/UX Transformation and Milestone 2 (Classrooms Command Center View).
Your working directory is: `E:\mnt\e\NexClass\.agents\teamwork\worker_emerald_m1_m2`
Project root: `E:\mnt\e\NexClass`

Mandatory: Read `E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically `## Follow-up — 2026-10-24T04:45:58Z` for the complete Emerald Glass UI/UX Transformation mandate).
Read `E:\mnt\e\NexClass\PROJECT.md`.
Read `E:\mnt\e\NexClass\.agents\teamwork\orchestrator_2\handoff.md`.
Read Challenger 2 handoff: `E:\mnt\e\NexClass\.agents\teamwork\challenger_dash_m1_final_2\handoff.md`.

STRICT CONSTRAINT: FRONTEND PRESENTATION & MOTION ONLY. No backend, API, auth, WebRTC, or business logic modifications. All existing features remain 100% operational.

Phase 1: Emerald Glass Design System & index.css Fixes
1. In `apps/web/src/index.css`:
   - Restore the `@media (prefers-reduced-motion: reduce)` block:
     ```css
     @media (prefers-reduced-motion: reduce) {
       *, *::before, *::after {
         animation-duration: 0.001ms !important;
         animation-iteration-count: 1 !important;
         transition-duration: 0.001ms !important;
         scroll-behavior: auto !important;
       }
     }
     ```
   - Restore the `.font-indic` CSS rule:
     ```css
     [lang="hi"], [lang="mr"], [lang="ta"], [lang="bn"], [lang="or"], .font-indic {
       font-family: "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Bengali", "Noto Sans Oriya", "Nirmala UI", sans-serif;
       line-height: 1.65 !important;
       text-rendering: optimizeLegibility;
       font-feature-settings: "kern", "liga", "clig";
     }
     ```
   - Update `.nc-glass-*` utilities to reflect Emerald Glass:
     - Background: `#101A16` (deep dark emerald), `#17231D` (secondary)
     - Surfaces: `#1D3028` (main), `#294034` (elevated), `#20382E` (floating)
     - Accents: `#78A98B` (primary emerald), `#176B55` (deep emerald), `#32B98A` (soft emerald/live), `#C4B887` (secondary sage), `#9B9B78` (AI accent), `#B3E5C5` (pale mint)
     - Typography: `#E9EFE8` (primary text), `#ACBCAF` (secondary text), `#829487` (muted text)
     - Borders: `#34483B` (default border), `#293C32` (subtle border), `#78A98B` (active border)
     - Overlay/highlights: `rgba(255, 255, 255, 0.035)`, soft shadow `rgba(0, 0, 0, 0.22)`, emerald glow `rgba(120, 169, 139, 0.12)`.
2. In `apps/web/src/themes/themes.css` & `themes.ts`:
   - Configure `:root` RGB variables to match this Emerald Glass palette as default.
3. In `apps/web/tailwind.config.js`:
   - Update `ink`, `accent`, `signal.live` (`#32B98A` / `#78A98B`), and `signal.rec` (`var(--danger)`).

Phase 2: Milestone 2 — Classrooms Command Center View
1. Build `apps/web/src/components/dashboard/HeroActionDeck.tsx`:
   - 3-card quick-action deck:
     - `⚡ Instant 1-Click Meeting`: Generates meeting with educational lecture title in teacher's preferred language and immediately navigates via `navigate('/meet/' + meeting.code)` on completion (MANDATORY acceptance criteria).
     - `Join by Code`: 6-char animated monospace input with auto-uppercase, active border glow, character counter, and instant Enter key submission.
     - `Open Demo`: Quick-launch card to `/demo/room`.
2. Build `apps/web/src/components/dashboard/ClassroomsGrid.tsx` & `ClassroomCard.tsx`:
   - Responsive card grid (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`).
   - Emerald Glass translucent cards (`backdrop-blur-xl`, border `#34483B`, hover active border `#78A98B`).
   - Live glowing pulse dot and `LIVE NOW` badge when meeting is live.
   - Quick action buttons: 1-click Enter Classroom, Copy Link, Copy Code.
3. Build `apps/web/src/components/dashboard/RecentSessionsDrawer.tsx`:
   - Collapsible quick-glance drawer of completed sessions with 1-tap jump to Transcripts view (`?view=transcripts`).
4. Build `apps/web/src/components/dashboard/ClassroomsView.tsx`:
   - Composes `HeroActionDeck`, `ClassroomsGrid`, and `RecentSessionsDrawer`.
   - Wire into `apps/web/src/pages/Dashboard.tsx` for `currentView === "classrooms"`.

Phase 3: Verification
- Run `npx tsx scripts/verify-m1-empirical.ts` and `npx tsx scripts/verify-challenger-m1-2.ts`.
- Run `npm run typecheck` (0 errors across @nexclass/api and @nexclass/web).
- Run `npm run build -w @nexclass/web` (clean compilation).
- Run `npm test -w @nexclass/api` (64/64 tests pass).
