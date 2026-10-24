## 2026-10-24T05:12:01Z

You are Worker Emerald M3 M4 implementing Milestone 3 (Create Classroom View & Live Preview) and Milestone 4 (Transcripts & Archive View with TXT Export) for the NexClass Dashboard Transformation.
Your working directory is: `E:\mnt\e\NexClass\.agents\teamwork\worker_emerald_m3_m4`
Project root: `E:\mnt\e\NexClass`

Mandatory: Read `E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically `## Follow-up — 2026-10-24T04:45:58Z` for the Emerald Glass UI/UX Transformation mandate).
Read `E:\mnt\e\NexClass\PROJECT.md`.
Read `E:\mnt\e\NexClass\.agents\teamwork\worker_emerald_m1_m2\handoff.md`.
Read Explorer 2 handoff: `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_dash_2\handoff.md`.

STRICT CONSTRAINT: FRONTEND PRESENTATION & MOTION ONLY. No backend, API, auth, WebRTC, or business logic modifications. All existing features remain 100% operational.

Scope & Tasks:

Part 1: Milestone 3 — Create Classroom View & Real-Time Live Preview
1. Build `apps/web/src/components/dashboard/MeetingCardPreview.tsx`:
   - Interactive card preview updating in real-time as the teacher types.
   - Live updates to Title, Spoken Language badge, Available Student Caption badges (EN, TA, HI, BN, MR, OR), Password lock indicator, and Participant Permissions pills (Mic/Unmute, Screen Share, Chat).
   - Styled with Emerald Glass aesthetics (`bg-ink-950/80 backdrop-blur-xl border border-ink-700/60 rounded-2xl p-6`).
2. Build `apps/web/src/components/dashboard/CelebratoryModal.tsx`:
   - Celebratory post-creation screen/modal displayed upon successful meeting creation.
   - Large 48px monospace shareable meeting code (`font-mono tracking-[0.25em] text-accent-400 font-bold`).
   - 1-click Copy Link button and 1-click Copy Code button.
   - Direct primary button: "Enter Classroom Now" navigating to `/meet/:code`.
3. Build `apps/web/src/components/dashboard/CreateClassroomView.tsx`:
   - 2-column split configuration:
     - Left column: interactive configuration form (title input, 6-language lecture selector, student caption language matrix, room password toggle, participant permissions pills: canUnmute, canShareScreen, canChat).
     - Right column: sticky real-time `MeetingCardPreview`.
   - Form validation: title cannot be empty, at least one caption language.
   - Submits via `api.createMeeting()` and presents `CelebratoryModal` or direct navigation.
4. Wire `CreateClassroomView` into `apps/web/src/pages/Dashboard.tsx` for `currentView === "create"`.

Part 2: Milestone 4 — Transcripts & Archive View with Real TXT Export
1. Build `apps/web/src/lib/exportTranscript.ts`:
   - Real 1-click "Export TXT" utility.
   - Fetches actual transcript segments from `GET /api/meetings/:code/transcripts` and translations from `GET /api/meetings/:code/translations`.
   - Compiles a clean, beautifully formatted text document containing:
     - Header: NexClass Session Transcript Archive, Room Code, Title, Date, Lecture Language, Participant count.
     - Synchronized chronological log: Speaker Name, Timestamp, Original Speech, Translated Captions (by language).
     - Triggers browser file download: `nexclass-transcript-{code}-{date}.txt`.
2. Build `apps/web/src/components/dashboard/TranscriptsView.tsx`:
   - Clean search and filter bar:
     - Search input (filter by meeting title or room code).
     - Language filter pills (All, EN, TA, HI, BN, MR, OR).
     - Date range filter (All Time, Today, Past 7 Days, Past 30 Days).
   - Archive list / cards:
     - Multi-language badges for all languages present in the session.
     - Date, duration, participant summary.
     - 1-click "Export TXT" button (invokes `exportTranscript` with loading spinner and toast).
     - "Reopen Session" action button (navigates to `/meet/:code`).
     - Recordings download link if recording exists.
3. Wire `TranscriptsView` into `apps/web/src/pages/Dashboard.tsx` for `currentView === "transcripts"`.

Part 3: Verification
- Run `npm run typecheck` (0 errors across @nexclass/api and @nexclass/web).
- Run `npm run build -w @nexclass/web` (clean compilation).
- Run `npm test -w @nexclass/api` (64/64 tests pass).
- Verify all empirical tests pass (`scripts/verify-m1-empirical.ts`, `scripts/verify-challenger-m1-2.ts`, `scripts/verify-m2-empirical.ts`).
- Create an empirical verification script `scripts/verify-m3-m4-empirical.ts` testing CreateClassroom form, live preview props, CelebratoryModal, TranscriptsView search/filter, and export TXT functionality.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Deliverable:
Document all created/modified files, interfaces, and test results in `E:\mnt\e\NexClass\.agents\teamwork\worker_emerald_m3_m4\handoff.md`.
Notify orchestrator (recipient: cbadd9ee-bd59-43df-91fb-7497135fc9e5) via `send_message` when done.
