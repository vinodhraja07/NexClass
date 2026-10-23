# Dispatch for Worker 5 — Milestone 3: Advanced Classroom UI/UX Polish & Fluid Animations (R3)

- **Identity**: teamwork_preview_worker
- **Role**: Frontend UI/UX Animation & Typography Worker
- **Working Directory**: E:\mnt\e\NexClass\.agents\teamwork\worker_m3
- **Project Root**: E:\mnt\e\NexClass
- **Authoritative Request**: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
- **Project Scope Document**: E:\mnt\e\NexClass\PROJECT.md
- **Explorer Survey Reference**: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_2\survey_frontend_report.md
- **Parent Conversation ID**: 9e5960ea-425e-42b2-ac85-94fd33a66831

## File Ownership (Strict & Exclusive)
You exclusively own and may edit or create these files:
- `apps/web/src/components/classroom/Stage.tsx`
- `apps/web/src/components/classroom/VideoTile.tsx`
- `apps/web/src/components/classroom/CaptionOverlay.tsx`
- `apps/web/src/components/classroom/TermText.tsx`
- `apps/web/index.html`
- `apps/web/src/index.css`
- `apps/web/tailwind.config.js`

Do NOT touch `ClassroomHeader.tsx`, `ClassroomToolbar.tsx`, `ClassroomShell.tsx`, `useMeetingRecording.ts`, or any backend files.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Requirements (R3)
1. **Stage & VideoTile Layout Animations (`motion/react`)**:
   - In `Stage.tsx` and `VideoTile.tsx`:
     - Fluid layout animations using `motion.div` with layout spring transitions: `layout transition={{ type: "spring", stiffness: 350, damping: 32 }}`.
     - Smooth entry and exit animations (`initial={{ opacity: 0, scale: 0.85 }}`, `animate={{ opacity: 1, scale: 1 }}`, `exit={{ opacity: 0, scale: 0.85 }}`).
     - Pin-to-stage expansion: Support clicking a participant tile to pin to stage, expanding into a primary spotlight view while other tiles animate smoothly into a sidebar or bottom strip with layout springs.
2. **Sophisticated Active-Speaker Visual Cues**:
   - In `VideoTile.tsx`:
     - Smooth animated audio equalizer wave: Render animated audio level bars (3-4 bars) that smoothly dance with participant audio levels instead of static keyframe loops.
     - Subtle accent border transitions: Animate border and ring styling smoothly with `motion.div` or CSS transitions (`transition: border-color 0.3s ease, box-shadow 0.3s ease`), eliminating jarring pulse jumps.
3. **Floating Captions & Terminology Gloss Popovers**:
   - In `CaptionOverlay.tsx`:
     - Smooth entry and update transitions (`AnimatePresence` with `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -6 }}`).
     - High-contrast Indic typography rendering with comfortable line-height for Indian language scripts.
   - In `TermText.tsx`:
     - Smooth popover card animations with tooltip arrow and terminology definition pill.
4. **Indic Scripts & Typography**:
   - In `apps/web/index.html`: Load Google Fonts for `Noto Sans Devanagari`, `Noto Sans Tamil`, `Noto Sans Bengali`, `Noto Sans Oriya`.
   - In `apps/web/tailwind.config.js` and `apps/web/src/index.css`:
     - Define Indic font families and set proper line-height (`line-height: 1.6`) for Indic language text tags so matras and diacritics are never clipped.
5. **Accessibility (`useReducedMotion`)**:
   - Strictly respect `useReducedMotion()`. When reduced motion is preferred by the user, disable layout spring animations, scale transforms, and equalizer animations, falling back to instant opacity or static displays.
6. **Verification**:
   - Verify `npm run typecheck` passes with 0 errors.
   - Verify `npm run build -w @nexclass/web` succeeds cleanly.
   - Write your handoff report to `handoff.md`.


## 2026-10-23T15:39:57Z
[Message] timestamp=2026-10-23T15:39:57Z sender=9e5960ea-425e-42b2-ac85-94fd33a66831 priority=MESSAGE_PRIORITY_HIGH content=You are Worker 5 implementing Milestone 3: Advanced Classroom UI/UX Polish & Fluid Animations (R3).
Working directory: E:\mnt\e\NexClass\.agents\teamwork\worker_m3
Project root: E:\mnt\e\NexClass
Read ORIGINAL_REQUEST.md at: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
Read PROJECT.md at: E:\mnt\e\NexClass\PROJECT.md
Read DISPATCH.md at: E:\mnt\e\NexClass\.agents\teamwork\worker_m3\DISPATCH.md
Read survey findings at: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_2\survey_frontend_report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
- apps/web/src/components/classroom/Stage.tsx
- apps/web/src/components/classroom/VideoTile.tsx
- apps/web/src/components/classroom/CaptionOverlay.tsx
- apps/web/src/components/classroom/TermText.tsx
- apps/web/index.html
- apps/web/src/index.css
- apps/web/tailwind.config.js

Tasks:
1. Stage & VideoTile Layout Animations: motion/react layout springs for participant join, leave, reorder, and pin-to-stage expansion.
2. Smooth active-speaker visual cues: dynamic equalizer wave animation and subtle accent border transitions without jarring jumps.
3. Floating captions & gloss popovers: smooth entry transitions and high-contrast Indic typography rendering.
4. Indic typography: Load Noto Sans Devanagari, Tamil, Bengali, Oriya in index.html, configure in tailwind.config.js, and set line-height in index.css.
5. Accessibility: Strict useReducedMotion() compliance across all animations.
6. Verify npm run typecheck (0 errors) and npm run build -w @nexclass/web (clean build).
7. Write handoff.md and notify orchestrator when done.
