# Dispatch for Worker 3 — Milestone 2: Frontend Recording & Google Meet UI Polish (R1 & R4)

- **Identity**: teamwork_preview_worker
- **Role**: Frontend Recording & Meet UI Implementation Worker
- **Working Directory**: E:\mnt\e\NexClass\.agents\teamwork\worker_m2
- **Project Root**: E:\mnt\e\NexClass
- **Authoritative Request**: E:\mnt\e\NexClass\.agents\teamwork\ORIGINAL_REQUEST.md
- **Project Scope Document**: E:\mnt\e\NexClass\PROJECT.md
- **Explorer Survey Reference**: E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_2\survey_frontend_report.md
- **Parent Conversation ID**: 9e5960ea-425e-42b2-ac85-94fd33a66831

## File Ownership (Strict & Exclusive)
You exclusively own and may edit or create these files:
- `apps/web/src/hooks/useMeetingRecording.ts` (create recording hook with Web Audio API mixer & canvas/video compositor)
- `apps/web/src/components/classroom/ClassroomHeader.tsx` (add pulsing red "REC" pill badge with elapsed timer)
- `apps/web/src/components/classroom/ClassroomToolbar.tsx` (add Record Call button with active indicator and tooltip)
- `apps/web/src/components/classroom/MeetSidePanel.tsx` (add Recordings list in Details / info tab with download and stream links)
- `apps/web/src/components/classroom/ClassroomShell.tsx` (integrate recording hook, pass props to Header, Toolbar, SidePanel, and add start/stop confirmation modal)

Do NOT touch `apps/web/src/components/classroom/Stage.tsx`, `VideoTile.tsx`, `CaptionOverlay.tsx`, `TermText.tsx`, or any files in `apps/api/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Requirements (R1 & R4)
1. **`useMeetingRecording.ts` Hook**:
   - Web Audio API Audio Mixer: Mix local microphone stream, peer remote audio streams, and translated audio elements into a unified `MediaStreamAudioDestinationNode`.
   - Video / Canvas Compositor: Composite the active video stage (or direct screen share track) at 1280x720 30fps.
   - `MediaRecorder` pipeline: Combine mixed audio + video into `MediaRecorder` with `video/webm;codecs=vp9,opus` (with fallback to `video/webm` or `video/mp4`).
   - On stop:
     - Trigger immediate local file download via `URL.createObjectURL(blob)` with a clean `.webm` filename.
     - Upload binary blob to `@nexclass/api`: `POST /api/meetings/${meetingCode}/recordings` with `Content-Type: video/webm`, headers `x-recording-duration`, `x-recorded-by`, `x-recording-size`.
   - Socket synchronization: Listen for socket `recording:state`, emit `recording:start`, `recording:stop`, `recording:pause`, `recording:resume`.
   - Fetch meeting recordings: Function to query `GET /api/meetings/${meetingCode}/recordings` to populate the recordings list.
2. **`ClassroomHeader.tsx`**:
   - Render pulsing red "REC" pill badge when `isRecording` is true, displaying formatted elapsed time (e.g. `00:14`, `01:32`).
   - Smooth pulse animation using Tailwind/motion. Respect `useReducedMotion()`.
3. **`ClassroomToolbar.tsx`**:
   - Add circular Record button (using `Radio` or `Disc` or `CircleDot` icon from `lucide-react`).
   - Active state: Red accent ring / background when recording.
   - Micro-interactions: Tactile spring clicks (`whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`), responsive tooltip.
4. **`ClassroomShell.tsx`**:
   - Connect `useMeetingRecording` with room state, local stream, peers, and socket.
   - Add start/stop confirmation modal ("Recording will capture video, microphone, and translated audio for all participants. Start recording?").
5. **`MeetSidePanel.tsx`**:
   - Inside the Details (`info`) tab, add a "Classroom Recordings" section listing saved recordings for the meeting with download links and stream links.
6. **Verification**:
   - Verify TypeScript typecheck: `npm run typecheck` passes with 0 errors.
   - Verify Web build: `npm run build -w @nexclass/web` succeeds cleanly.
   - Write your implementation report to `handoff.md`.
