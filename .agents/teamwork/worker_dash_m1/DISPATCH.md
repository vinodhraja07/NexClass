## 2026-10-24T03:41:35Z
You are Worker Dash M1 implementing Milestone 1: Left Sidebar Shell, Responsive Rail & Dark Glassmorphism for the NexClass Dashboard Transformation.
Your working directory is: `E:\mnt\e\NexClass\.agents\teamwork\worker_dash_m1`
Project root: `E:\mnt\e\NexClass`

Mandatory: Read `E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically `## Follow-up — 2026-10-24T03:28:45Z`).
Read `E:\mnt\e\NexClass\PROJECT.md`.
Read Explorer Handoffs:
- `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_dash_1\handoff.md` (Navigation & Shell Architecture)
- `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_dash_2\handoff.md` (Dashboard Views & Data Flow)
- `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_dash_3\handoff.md` (Visual Design Tokens & Motion)

Write Ownership (Exclusive to this Worker):
- `apps/web/src/components/dashboard/DashboardSidebar.tsx` (new)
- `apps/web/src/components/dashboard/DashboardMobileHeader.tsx` (new)
- `apps/web/src/pages/Dashboard.tsx`
- `apps/web/src/index.css`
- `apps/web/tailwind.config.js`
- `apps/web/src/components/dashboard/LanguageChips.tsx`

Scope & Tasks:
1. Create `DashboardSidebar.tsx`:
   - Top Brand & User Identity: NexClass wordmark, role indicator badge (Teacher / Student), active user profile badge with avatar/initials.
   - Collapsible desktop rail: toggle between expanded (`w-64`) and icon-only collapsed (`w-20`) with floating glass tooltips (`AnimatePresence`) for icon-only mode.
   - 4 Navigation Items:
     - `Classrooms` (with real-time active counter pill)
     - `Create Classroom` (prominent quick-action button for teachers)
     - `Transcripts & Archive` (past sessions with multilingual indicators)
     - `Preferences & Languages` (preferred UI language & caption presets)
   - Mobile & Tablet (<1024px) Slide-Over Drawer:
     - Smooth slide-in from left with backdrop blur.
     - Backdrop click and Escape key dismissal.
     - Clean touch-friendly navigation items.
   - Footer Section:
     - Live WebRTC / STUN / Neural TTS server connection status beacon (backed by `api.providerStatus`).
     - Logout trigger with confirmation or direct logout flow.
2. Create `DashboardMobileHeader.tsx`:
   - Mobile/tablet sticky top bar (<1024px) with hamburger menu button to open sidebar drawer, NexClass wordmark, active role badge, and quick user actions.
3. Refactor `Dashboard.tsx`:
   - Wrap the dashboard container with `<MotionConfig reducedMotion="user">` from `motion/react`.
   - Replace the stacked 2-tier horizontal top header with the left sidebar layout.
   - Migrate URL query parameter from `?tab=` to `?view=classrooms|create|transcripts|preferences` using `useSearchParams`. Provide backward compatibility fallback if `?tab=` is encountered.
   - Ensure switching views updates the URL without full-page reloads and with zero layout jumps.
4. Dark Glassmorphism Styling & Design System (`index.css` & `tailwind.config.js`):
   - Add glassmorphism classes: `.nc-glass-sidebar`, `.nc-glass-card`, `.nc-glass-panel`, `.nc-glass-drawer`, `.nc-live-glow`, `.nc-accent-glow` with specular inner highlights (`inset 0 1px 0 0 rgba(255,255,255,0.06)`).
   - Ensure neon emerald (`emerald-400` / `#2EE0A8`) is used for live active indicator, violet/cyan (`#8980BD` / `#42DCC5`) for actions, and red is reserved exclusively for recording (`REC`).
5. Indic Typography Legibility (`index.css` and `LanguageChips.tsx`):
   - Relax `line-height` for `.font-indic` and remove `leading-none` in `LanguageChips.tsx` so upper matras and lower conjuncts are never clipped.
6. Verification:
   - Run `npm run typecheck` to verify 0 TypeScript errors across `@nexclass/api` and `@nexclass/web`.
   - Run `npm run build -w @nexclass/web` to verify clean production compilation.
   - Run `npm test -w @nexclass/api` or relevant web tests.


## 2026-10-24T03:47:38Z
**Context**: NexClass Dashboard Transformation — Milestone 1 Implementation
**Content**: CRITICAL USER DIRECTION UPDATE:
The user has explicitly requested: "i need previous palette , new palette was not good so change to previous"

Please adjust your implementation of design tokens, themes, and styles immediately:
1. Strictly use the PREVIOUS signature NexClass palette: Monsoon Aurora / Oceanic Dark Navy (#101D2B / #070B14 / #05080F, surface #1D3544, border #304957) with signature mint/emerald (#2EE0A8 / #42DCC5) and warm ivory text (#FBF8F2 / #F4EFE6).
2. DO NOT use Midnight Purple, lavender, violet accents, or complex multi-color neon gradients.
3. Keep the palette clean, high-contrast, uncluttered, and faithful to the original NexClass identity.
4. Ensure DEFAULT_THEME_ID is "monsoon-aurora" (or points to Monsoon Aurora) in `apps/web/src/themes/index.ts` / `themes.css` and all theme defaults point to Monsoon Aurora.
5. All glassmorphism utilities (`nc-glass-sidebar`, `nc-glass-card`, `nc-glass-panel`) should tint with dark oceanic navy (`#101D2B / #070B14`) and luminous teal/emerald borders (`#304957`, `#2EE0A8`).
**Action**: Incorporate this palette instruction into your current Milestone 1 changes and confirm when done.
