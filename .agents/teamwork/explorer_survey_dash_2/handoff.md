# Survey Report & Handoff — Dashboard Views, Components & Data Flow

**Agent**: Explorer Survey Dash 2 (`explorer_survey_dash_2`)  
**Mission**: Investigate the NexClass dashboard views, existing components, and data flow to design focused, uncluttered views.  
**Working Directory**: `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_dash_2`  
**Date**: 2026-10-24T03:38:00Z  

---

## 1. Observation

### 1.1 Existing Dashboard Structure & Architecture
From inspecting `apps/web/src/pages/Dashboard.tsx` (1,222 lines) and associated components:
1. **Monolithic Layout**:
   - `apps/web/src/pages/Dashboard.tsx` currently houses the top header (lines 420–463), horizontal navigation tabs (lines 466–522), Classrooms tab content (lines 547–774), Create Classroom tab content (lines 779–1059), Transcripts tab content (lines 1064–1212), and footer (lines 1216–1219) all in a single 52KB file.
   - Tabs are currently controlled by `searchParams.get("tab") as DashboardTab` (`"classrooms" | "create" | "transcripts"`) (lines 69–74), using URL query parameter `?tab=...` instead of the required `?view=classrooms|create|transcripts` (Requirement R4 & Acceptance Criteria).
2. **Current Classrooms Tab**:
   - For teachers (lines 556–642): 3 cards in a basic grid (`Instant Class`, `Custom Setup`, `Enter Another Room`).
   - `handleInstantCreate` (lines 196–232): Generates a random title, calls `api.createMeeting()`, but then switches the active tab to `"create"` and sets `created` state instead of launching directly into the classroom room as required by the Acceptance Criteria (`[ ] Instant 1-click meeting creation launches directly into the classroom room.`).
   - For students (lines 644–704): A separate "Join a Classroom" card with code input and language chips.
   - Meetings list container (lines 706–770): Renders `upcoming` meetings using `MeetingList` (`apps/web/src/components/dashboard/MeetingListItem.tsx`), which is a vertical stack of items rather than a spacious, responsive glassmorphic grid.
   - Bottom completed session strip (lines 753–767): Renders a single line saying "You have N completed sessions in your history" with a button to switch tabs. There is NO interactive quick-glance drawer.
3. **Current Create Classroom Tab**:
   - Contains a standard form (lines 877–1054) with Title input, Teacher Spoken Language chips, and an accordion for Advanced Settings (available student languages, password toggle, participant permissions toggles: `canUnmute`, `canShareScreen`, `canChat`, default captions, default voice).
   - **Crucial Absence**: There is NO real-time "Meeting Card Preview" updating as the teacher types.
   - Success state (lines 790–857): Displays a created classroom card with a large monospace code (`created.code`), copy buttons, and "Enter Classroom Now" button.
4. **Current Transcripts & Archive Tab**:
   - Lists `allRecent` meetings (lines 1097–1188) in a simple list.
   - **Crucial Absence of Filters**: There is NO search input, NO date filtering, and NO language code filtering.
   - **Crucial Fake Export**: The "Export TXT" button (lines 1160–1173) generates a mock static string without querying the server:
     ```ts
     const blob = new Blob([
       `NEXCLASS SESSION TRANSCRIPT ARCHIVE\nRoom: ${meeting.code}\nTitle: ${meeting.title}\nDate: ${meeting.createdAt}\nLanguages: English, Tamil, Hindi, Bengali, Marathi, Odia\n\n[Full synchronized transcripts saved in NexClass cloud storage]`
     ], { type: "text/plain" });
     ```
     This does not export the actual multi-language transcript segments.
5. **Backend APIs Available (`apps/api/src/routes/meetings.ts`)**:
   - `GET /api/meetings`: Returns `{ hosted: MeetingPublic[], joined: MeetingPublic[] }` (authenticated).
   - `POST /api/meetings`: Accepts `{ title, speakerLanguage, availableLanguages, password, participantPermissions, captionsEnabledByDefault, voiceEnabledByDefault }` and returns `{ meeting: MeetingPublic }` (teacher only).
   - `GET /api/meetings/:code/transcripts`: Returns `{ segments: TranscriptSegmentPublic[] }` with speaker name, original text, start/end time, original language.
   - `GET /api/meetings/:code/translations`: Returns `{ translations: TranslationPublic[] }` with segmentId, language, localized text, provider, latencyMs.
   - `GET /api/meetings/:code/recordings`: Returns `{ ok: true, recordings: RecordingPublic[] }` (`apps/api/src/routes/recordings.ts`).
   - `GET /api/providers/status`: Returns ASR, translation, TTS, TURN, MongoDB, and Redis provider readiness.
6. **Code Quality & Typecheck**:
   - `npm run typecheck` passes cleanly across `@nexclass/api` and `@nexclass/web` with 0 errors.

---

## 2. Logic Chain

### 2.1 Problem Decomposition & View Requirements
To deliver a luxurious, uncluttered educational command center with generous whitespace and zero cognitive overload, the monolithic `Dashboard.tsx` must be refactored into focused, modular view components governed by an active view selector (`?view=classrooms|create|transcripts|preferences`).

```
                    ┌────────────────────────────────────────┐
                    │          Dashboard.tsx (Shell)         │
                    │  URL Sync (?view=...), loadMeetings(), │
                    │       loadProvider(), useAuth()        │
                    └───────────────────┬────────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
┌──────────────────┐          ┌───────────────────┐          ┌───────────────────┐
│  ClassroomsView  │          │CreateClassroomView│          │  TranscriptsView  │
├──────────────────┤          ├───────────────────┤          ├───────────────────┤
│• Hero Action Deck│          │• Config Form      │          │• Search & Filter  │
│  - Instant 1-Clk │          │  - Lecture Lang   │          │  - Title/Code/Date│
│  - Animated Code │          │  - Caption Matrix │          │  - Lang Badges    │
│  - Open Demo     │          │  - Permissions    │          │• Real TXT Export  │
│• Classrooms Grid │          │• Live Card Preview│          │  (Transcripts +   │
│  - Live indicator│          │  (Real-time sync) │          │   Translations)   │
│  - 1-click enter │          │• Celebratory Post-│          │• Reopen Session   │
│  - Copy link/code│          │  Creation Modal   │          │• Segment Drawer   │
│• Recent Drawer   │          └───────────────────┘          └───────────────────┘
│  - Quick glance  │
│  - Jump to Arch. │
└──────────────────┘
```

### 2.2 View 1: Classrooms View Architecture
1. **Compact Hero Action Deck (`HeroActionDeck.tsx`)**:
   - Card 1: `⚡ Instant 1-Click Meeting`:
     - Creates meeting instantly with random educational lecture title (e.g., "Physics - Classical Mechanics & Vectors", "Computer Science - Distributed Systems Architecture", "Biochemistry - Cellular Respiration") and the teacher's preferred language.
     - **Direct Room Launch**: Immediately navigates via `navigate('/meet/' + result.meeting.code)` on completion to satisfy Acceptance Criteria: `Instant 1-click meeting creation launches directly into the classroom room.`
   - Card 2: `Join by Code` with Animated Input:
     - 6-character monospace input with active border glow, auto-uppercase formatting, character counter, and instant Enter-key submission.
     - Validates format: 6 alphanumeric characters.
     - One-touch "Enter Classroom" button with tactile spring feedback.
   - Card 3: `Open Demo`:
     - Clean quick-entry card to `/demo/room` (or `/demo`), letting educators and students try out simulated multilingual speech without setup.
2. **Active & Upcoming Classrooms Grid (`ClassroomsGrid.tsx` & `ClassroomCard.tsx`)**:
   - Replaces the dense list with a responsive card grid (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`).
   - High-end dark glassmorphism styling (`bg-ink-950/80 backdrop-blur-xl border border-ink-700/60 rounded-2xl p-6 hover:border-accent-400/40 hover:shadow-xl hover:shadow-black/50 transition-all duration-300`).
   - Key Card Elements:
     - **Live Status Indicator**: When `status === "live"`, render an emerald glowing pulse dot (`LiveDot`), a `LIVE NOW` badge, and neon border accent. When scheduled, render an info badge.
     - **Room Code**: Crisp uppercase monospace tracking-[0.25em] with integrated 1-click copy code (`CopyButton`).
     - **Class Title**: Prominent font-display text, high contrast against velvety dark background.
     - **Language Badges**: Teacher speaker language pill (`accent-400/15 border-accent-400/40 text-accent-300`) plus available student caption language badges (EN, TA, HI, BN, MR, OR).
     - **Quick Actions Bar**:
       - 1-Click "Enter Class" / "Resume Class" primary button (emerald gradient with spring click).
       - "Copy Link" button (copies `${window.location.origin}/meet/${code}`).
       - "Copy Code" button.
     - **Security / Settings Tag**: Password protected icon (`Lock`/`KeyRound`) if enabled.
3. **Recent Sessions Quick-Glance Drawer (`RecentSessionsDrawer.tsx`)**:
   - Slide-over panel from the right edge with backdrop blur and escape key dismissal.
   - Shows the last 5 completed sessions with room title, ended date, and language indicators.
   - Each entry has a direct 1-tap "View Full Transcript & Export" action that updates the active view to `?view=transcripts&search=${code}` or opens the transcript detail reader directly.

### 2.3 View 2: Create Classroom View Architecture
1. **Interactive 2-Column Configuration + Live Preview (`CreateClassroomView.tsx`)**:
   - **Left Column (Configuration Form)**:
     - **Classroom Title**: Interactive input with real-time state feedback, placeholder hints, and instant validation.
     - **Teacher Lecture Language Selector**: Single-select interactive chips with English name, native script (e.g., `English`, `தமிழ்`, `हिन्दी`, `বাংলা`, `मराठी`, `ଓଡ଼ିଆ`), and script indicators.
     - **Student Caption Language Matrix**: Multi-select grid of languages. Includes a "Select All (All 6 Indic)" toggle and resets. The teacher's spoken language is permanently locked as included.
     - **Room Password Toggle**: Toggle switch with smooth spring reveal of password input (minimum 4 characters) with password visibility toggle.
     - **Participant Permission Pills**: Interactive pill toggles for `Can Unmute (Microphone)`, `Share Screen (Presentation)`, and `In-Meeting Chat`.
     - **Captions & Voice Defaults**: Toggles for "Captions on by default" and "Neural voice translation on by default".
     - **Submit Action**: Primary gradient "Create Classroom & Generate Code" button with spinner state.
   - **Right Column (Sticky "Meeting Card Preview" - `MeetingCardPreview.tsx`)**:
     - Displays in real time exactly how the classroom card will appear on the dashboard and to joining students.
     - Updates instantly as the teacher types:
       - Title updates live (shows "Untitled Multilingual Classroom" if empty).
       - Live badge shows `LIVE PREVIEW`.
       - Teacher Lecture Language pill shows selected language with native script.
       - Available Student Caption Language badges update dynamically.
       - Security badge shows `Protected` when password toggle is active.
       - Permissions summary shows enabled capabilities (e.g., "Chat: On · Mic: On · Screen: On").
       - Simulated code placeholder (e.g., `NEX-999`).
2. **Celebratory Post-Creation Screen (`CelebrationCard.tsx`)**:
   - Triggered upon successful `api.createMeeting()` call:
     - Full card celebration with spring entrance physics (`scale: [0.92, 1]`, `opacity: [0, 1]`).
     - Ambient emerald/neon celebratory glow.
     - Success banner: "Classroom Created Successfully — Ready for Learners".
     - Huge 48px monospace shareable room code (e.g., `7KQ2MD`) with large click-to-copy surface and glowing neon border.
     - Direct Action Deck:
       - `Enter Classroom Now` (primary gradient button navigating directly to `/meet/${code}`).
       - `Copy Shareable Link` (`${window.location.origin}/meet/${code}`).
       - `Copy Code`.
       - `Create Another Classroom` (resets form).
       - `Back to Classrooms Grid` (switches view to `?view=classrooms`).

### 2.4 View 3: Transcripts & Archive View Architecture
1. **Search & Filter System (`TranscriptSearchBar.tsx`)**:
   - **Search Input**: Instant client-side search across meeting title and 6-character room code.
   - **Date Filter Selector**: Quick pills for `All Time`, `Today`, `Past 7 Days`, `Past 30 Days`.
   - **Language Filter Matrix**: Filter sessions by supported language code (`All`, `EN`, `TA`, `HI`, `BN`, `MR`, `OR`).
   - **Results Count**: Crisp text displaying "Showing X completed sessions".
2. **Multi-Language Badges (`TranscriptListItem.tsx`)**:
   - Each completed session card displays high-contrast badges for all languages captured during the lecture:
     - `EN` (English)
     - `TA` (Tamil - தமிழ்)
     - `HI` (Hindi - हिन्दी)
     - `BN` (Bengali - বাংলা)
     - `MR` (Marathi - मराठी)
     - `OR` (Odia - ଓଡ଼ିଆ)
   - Distinctive typography and color-coded accents honoring Indic script legibility.
3. **1-Click "Export TXT" Multi-Language Download**:
   - Fetching true transcript and translation segments:
     - Call `api.transcripts(meeting.code)` to retrieve `TranscriptSegmentPublic[]`.
     - Also query `/api/meetings/:code/translations` to retrieve `TranslationPublic[]`.
     - Synthesize into a complete, clean UTF-8 text file:
       ```
       ================================================================================
       NEXCLASS MULTILINGUAL CLASSROOM TRANSCRIPT ARCHIVE
       Room Code:       7KQ2MD
       Classroom Title: Physics - Mechanics of Rotating Bodies
       Date & Time:     2026-10-24 10:30:00 UTC
       Lecture Spoken:  English (en)
       Languages:       English, Tamil, Hindi, Bengali, Marathi, Odia
       ================================================================================

       [00:01:15] Prof. Ramanathan (EN):
       "Welcome everyone. Today we analyze torque and angular momentum."
         [TA - Tamil]: "அனைவருக்கும் வணக்கம். இன்று நாம் முறுக்குவிசை மற்றும் கோண உந்தத்தை பகுப்பாய்வு செய்கிறோம்."
         [HI - Hindi]: "सभी का स्वागत है। आज हम बलाघूर्ण और कोणीय संवेग का विश्लेषण करेंगे।"
         [BN - Bengali]: "সবাইকে স্বাগতম। আজ আমরা টর্ক এবং কৌণিক ভরবেগ বিশ্লেষণ করব।"
         [MR - Marathi]: "सर्वांचे स्वागत आहे. आज आपण टॉर्क आणि कोनीय संवेगाचे विश्लेषण करू."
         [OR - Odia]: "ସମସ୍ତଙ୍କୁ ସ୍ୱାଗତ। ଆଜି ଆମେ ଟର୍କ ଏବଂ କୌଣିକ ସଂବେଗ ବିଶ୍ଳେଷଣ କରିବା।"
       ```
     - Triggers native browser download: `nexclass-transcript-${meeting.code}.txt`.
     - Falls back gracefully to formatted session metadata if the meeting was ended without recorded speech.
4. **"Reopen Session" Action**:
   - Button navigating directly to `/meet/${meeting.code}`, allowing teachers or students to re-enter the classroom room.
5. **Interactive Transcript Timeline Reader (Slide-over Drawer)**:
   - Clicking a session card opens a slide-over reader showing the conversation segments with a language tab selector (switch between English, Tamil, Hindi, Bengali, Marathi, and Odia view).

### 2.5 API Server Calls & State Synchronization
1. **URL Synchronization**:
   - Replace the obsolete `?tab=` query parameter with `?view=classrooms|create|transcripts|preferences`.
   - Update URL using `useSearchParams` with `{ replace: true }`, ensuring smooth back/forward browser navigation without triggering full page reloads.
2. **State Wiring in `apps/web/src/pages/Dashboard.tsx`**:
   ```ts
   // High-level state orchestrator
   const [searchParams, setSearchParams] = useSearchParams();
   const activeView = (searchParams.get("view") as DashboardView) || "classrooms";
   
   const setView = useCallback((view: DashboardView) => {
     setSearchParams((prev) => {
       const next = new URLSearchParams(prev);
       if (view === "classrooms") next.delete("view");
       else next.set("view", view);
       return next;
     }, { replace: true });
   }, [setSearchParams]);
   ```
3. **Data Fetching Synchronization**:
   - `loadMeetings()`: Calls `api.listMeetings()`. Updates `hosted` and `joined` state.
   - `loadProvider()`: Calls `api.providerStatus()`. Updates provider capabilities (ASR, translation, TTS, TURN).
   - After `api.createMeeting()`:
     - Automatically invokes `loadMeetings()` so the new meeting appears in the active meetings grid immediately.
     - For instant meetings: invokes `navigate('/meet/' + result.meeting.code)` directly.
     - For custom meetings: sets `createdMeeting` state to display the celebratory post-creation screen.
   - For student joins:
     - Submitting 6-char code calls `api.joinMeeting(code, { name, language })`.
     - Stores guest session via `storeGuestSession(code, ...)` and `storeRecentMeeting(...)`.
     - Navigates directly to `/meet/${code}`.

---

## 3. Caveats

1. **Backend Endpoint for Translations**:
   - While `GET /api/meetings/:code/transcripts` is wrapped in `api.ts`, `GET /api/meetings/:code/translations` exists on the server (`apps/api/src/routes/meetings.ts:465`) but is not currently exposed in `apps/web/src/lib/api.ts`. Adding `api.translations(code)` in `api.ts` will allow full multilingual TXT export.
2. **Student vs Teacher Roles**:
   - Teacher accounts have full access to `create` and `hosted` meetings.
   - Student accounts see the "Enter Classroom with Code" interface and their `joined` meetings plus locally stored recent guest joins (`readRecentMeetings()`).
   - If a student navigates to `?view=create`, they should be automatically redirected to `?view=classrooms` with a polite notice ("Only teacher accounts can create classrooms").
3. **Reduced Motion**:
   - Every Framer Motion transition (`motion/react`) must honor `useReducedMotion()`. If `useReducedMotion()` is true, all layout animations and spring physics should immediately fallback to instant opacity transitions or `duration: 0`.
4. **Coordination with Peer Explorers**:
   - Explorer 1 is designing the left sidebar navigation shell (`SidebarNav.tsx`, responsive mobile drawer, footer server status).
   - Explorer 3 is designing the dark glassmorphic styling tokens (`bg-ink-950/90`, `border-ink-700/60`, `border-accent-400/30`), typography, and spring physics presets.
   - This survey (Explorer 2) provides the modular view components that sit cleanly inside the layout shell provided by Explorer 1 and use the design tokens from Explorer 3.

---

## 4. Conclusion

1. **Monolithic Decomposition**: `Dashboard.tsx` should be refactored from a 1,222-line monolith into a lean orchestrator (~150 lines) that coordinates data fetching (`loadMeetings`, `loadProvider`, `useAuth`) and delegates rendering to 3 primary views: `ClassroomsView`, `CreateClassroomView`, and `TranscriptsView` (plus `PreferencesView`).
2. **Classrooms View**:
   - Houses a 3-tile **Compact Hero Action Deck** (`⚡ Instant 1-Click Meeting`, `Join by Code with Animated Input`, `Open Demo`). Instant 1-click meeting creation immediately enters `/meet/:code`.
   - Features an **Active & Upcoming Classrooms Grid** with live participant pulse dots, room codes with 1-click copy, language pills, and 1-click enter buttons.
   - Includes a **Recent Sessions Quick-Glance Drawer** sliding smoothly from the right edge with a 1-tap jump to Transcripts.
3. **Create Classroom View**:
   - Features a **2-Column Split Layout**: Left column contains the interactive configuration controls (Title, Lecture Language chips, Student Caption Matrix with Indic badges, Password toggle, and Participant Permissions pills).
   - Right column contains the real-time **Meeting Card Preview** updating live with every keystroke and toggle.
   - Features a **Celebratory Post-Creation Screen** with glowing neon 48px monospace code, 1-click "Enter Classroom Now" button, and copy buttons.
4. **Transcripts & Archive View**:
   - Features a **Search & Filter Bar** filtering by meeting title, room code, date range, and language code.
   - Renders **Multi-Language Badges** (`EN`, `TA`, `HI`, `BN`, `MR`, `OR`) for each archived session.
   - Provides a genuine **1-Click "Export TXT" Download** that fetches transcripts and translations from the API and produces clean multilingual formatted text files.
   - Provides a **"Reopen Session"** button to re-enter past classrooms.
5. **State & URL Synchronization**:
   - View state seamlessly updates via URL search parameters (`?view=classrooms|create|transcripts`) using `useSearchParams` without full page reloads.
   - Real-time synchronization guarantees that creating meetings instantly updates the active meetings state and triggers instant room launch or celebration.

---

## 5. Verification Method

### 5.1 Static Verification
1. **TypeScript Hygiene**:
   Run the project typecheck command:
   ```powershell
   powershell -Command "cd 'E:\mnt\e\NexClass'; npm run typecheck"
   ```
   Must pass with 0 errors across `@nexclass/api` and `@nexclass/web`.
2. **Production Build**:
   Verify the web frontend builds cleanly:
   ```powershell
   powershell -Command "cd 'E:\mnt\e\NexClass'; npm run build -w @nexclass/web"
   ```
   Must compile without chunking or packaging errors.
3. **API Test Suite**:
   Run API tests to ensure meeting and recording endpoints continue to pass:
   ```powershell
   powershell -Command "cd 'E:\mnt\e\NexClass'; npm test -w @nexclass/api"
   ```

### 5.2 Functional Inspection Points
- **View Switching**: Navigate to `http://localhost:5173/dashboard?view=classrooms`, `?view=create`, `?view=transcripts`. Confirm active view switches without full-page reloads and URL stays in sync.
- **Hero Action Deck**: Click `⚡ Instant 1-Click Meeting` -> verify direct navigation to `/meet/${code}`.
- **Live Preview**: On Create Classroom view, type title "Advanced Quantum Electrodynamics" and toggle Tamil + Hindi + Odia -> verify the Meeting Card Preview on the right updates instantly in real time.
- **Transcripts Export**: Click "Export TXT" on an archived meeting -> verify a `.txt` file downloads containing multilingual header and transcripts.
- **Accessibility**: Verify all animations cleanly disable when `prefers-reduced-motion` is enabled.

---

### Invalidation Conditions
- If `apps/web/src/pages/Dashboard.tsx` remains a monolithic file without modular views.
- If URL search parameters remain `?tab=` instead of `?view=`.
- If clicking "Instant 1-Click Meeting" does not directly launch the classroom room.
- If Create Classroom does not display a live real-time meeting card preview.
- If Transcripts View lacks search/filtering or continues to export placeholder mock text instead of true multilingual content.
