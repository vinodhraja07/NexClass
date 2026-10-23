# Comprehensive Frontend & UI/UX Architectural Survey Report
**Project**: NexClass Multilingual Virtual Classroom (`@nexclass/web`)  
**Investigator**: Explorer 2 (Frontend & UI/UX Architecture)  
**Date**: 2026-10-23  
**Target Root**: `E:\mnt\e\NexClass`  
**Working Directory**: `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_2`

---

## 1. Executive Summary

This survey provides a comprehensive architectural and code inspection of the `@nexclass/web` application within the NexClass monorepo. It details existing UI components, animations (`motion/react`), audio/video streaming mechanisms, and establishes a concrete, production-ready blueprint for:
1. **The In-Meeting Recording Pipeline (R1 & R4)**: Compositing canvas/video stream with multi-channel audio mixing (original mic, peer audio, and AI translated voice playback via Web Audio API `AudioContext` and `MediaRecorder`), triggering instant client-side download (.webm) and uploading to the API server archive storage.
2. **Google Meet Virtual Classroom UI/UX Polish (R3 & R4)**: Smooth layout animations (`motion/react` spring transitions) for participant tile entering/exiting/reordering/pinning, non-jarring active speaker visual cues, smooth animated audio equalizer waves, tactile circular toolbar buttons, pulsing red `REC` header indicators with elapsed timer, and a dedicated recording management drawer in `MeetSidePanel.tsx`.
3. **Indic Script Typography & Accessibility (R3)**: High-contrast Indic script rendering (Devanagari, Tamil, Bengali, Odia), complex conjunct layout support, floating dual-language captions, terminology gloss popovers with Odia transliterated TTS fallback, and strict compliance with `useReducedMotion()`.
4. **Build & Typecheck Baseline**: Verified clean build (`npm run build -w @nexclass/web` in 2.41s) and typecheck (`tsc --noEmit` on web & api with 0 errors).

---

## 2. Monorepo & Web Application Architecture

### 2.1 Workspace Structure
NexClass is structured as an npm workspaces monorepo:
```
E:\mnt\e\NexClass\
├── apps/
│   ├── api/                   # Express, Socket.IO, Mongoose/Redis backend (@nexclass/api)
│   └── web/                   # React 18, Vite 5, Tailwind 3 SPA (@nexclass/web)
├── packages/
│   ├── shared/                # Universal types, language definitions, UI strings (@nexclass/shared)
│   └── terminology/           # Protected technical vocabulary, glossary definitions (@nexclass/terminology)
└── package.json               # Root scripts: build, dev, typecheck, test, lint
```

### 2.2 Dependencies & Build Configuration (`apps/web/package.json`)
- **React**: `^18.3.1` (concurrent rendering, strict mode compliant)
- **Vite**: `^5.4.11` (dev server proxy to `http://localhost:4000` for `/api` and `/socket.io`, build target ES2022)
- **Motion**: `"motion": "^11.15.0"`. Canonical motion exports are consumed via `import { motion, AnimatePresence, useReducedMotion } from "motion/react"`.
- **Lucide Icons**: `lucide-react: ^0.469.0`
- **Tailwind CSS**: `^3.4.17` with PostCSS and Autoprefixer
- **TypeScript**: `^5.7.3` with `moduleResolution: "Bundler"`, path aliases `@/*` mapping to `src/*`, and workspace aliases to `packages/shared` and `packages/terminology`.

### 2.3 Vite Configuration (`apps/web/vite.config.ts`)
- Configures aliases:
  - `@` -> `apps/web/src`
  - `@nexclass/shared` -> `packages/shared/src/index.ts`
  - `@nexclass/terminology` -> `packages/terminology/src/index.ts`
- Dev server proxy:
  - `/api` -> `process.env.VITE_API_PROXY ?? "http://localhost:4000"`
  - `/socket.io` -> `ws: true` proxy to backend
- Build target: `dist/`, chunkSizeWarningLimit 1200KB.

---

## 3. UI Component Inventory & Layout Structure

The core classroom interface lives in `apps/web/src/components/classroom/`:

| Component | File Path | Current Role & Responsibilities | Needed Hardening / Polish |
|---|---|---|---|
| `ClassroomShell.tsx` | `apps/web/src/components/classroom/ClassroomShell.tsx` | Main Google Meet layout orchestrator. Connects `useClassroom`, `usePeerConnections`, `useVoicePlayback`, `useSpeechRecognition`, `useClassroomPreferences`. | Needs integration with `useMeetingRecording` hook, recording confirmation modal, and recording state broadcast. |
| `ClassroomHeader.tsx` | `apps/web/src/components/classroom/ClassroomHeader.tsx` | Top 48px header displaying meeting title, elapsed time, copyable meeting code, and connection status pill. | Needs pulsing red `REC` badge with elapsed recording timer when recording is active (R4). |
| `ClassroomToolbar.tsx` | `apps/web/src/components/classroom/ClassroomToolbar.tsx` | Bottom 72-76px 3-zone circular toolbar: Left (clock + code), Center (mic, cam, cc, voice mode, share, hand, red leave pill), Right (drawers: info, people, chat, language). | Needs Record Call circular button with active recording indicator, tactile spring clicks, and smooth tooltips (R1, R3, R4). |
| `MeetSidePanel.tsx` | `apps/web/src/components/classroom/MeetSidePanel.tsx` | Right 360px drawer with tabs: `people`, `chat`, `language`, `info` (Details). | In `info` tab, add dedicated "Meeting Recordings" management section showing active status and download/streaming links (R4). |
| `Stage.tsx` | `apps/web/src/components/classroom/Stage.tsx` | Adaptive grid layout for video tiles (1, 2, 4, 6, 8+). Also renders screen share viewport with filmstrip. | Needs `<AnimatePresence>` for joining/leaving tiles, smooth layout spring transitions, and interactive pin-to-stage expansion (R3). |
| `VideoTile.tsx` | `apps/web/src/components/classroom/VideoTile.tsx` | Individual participant tile: video tag, camera-off fallback Avatar, name pill, mic status, host badge, pin button. | Active speaker border currently jumps abruptly; needs subtle smooth transition. Equalizer animation currently static 4-bar loop; needs smooth fluid wave. |
| `CaptionOverlay.tsx` | `apps/web/src/components/classroom/CaptionOverlay.tsx` | Floating glass subtitle overlay over video stage with dual-language display (original + translation) and interim speech. | High-contrast Indic font rendering, smoother spring entry/exit, line-height normalization for Indic scripts. |
| `TermText.tsx` | `apps/web/src/components/classroom/TermText.tsx` | Highlights protected technical terms; provides inline definition and pronunciation audio. | Enhance gloss popover animation and audio pronunciation error handling. |

---

## 4. Media & Audio Architecture Analysis

### 4.1 Local & Remote Stream Management
- **Local Media**: `useClassroom.ts` manages `localStream` (obtained via `navigator.mediaDevices.getUserMedia({ audio: true, video: true })`) and `screenStream` (via `getDisplayMedia`).
- **Remote WebRTC Mesh**: `usePeerConnections.ts` maintains a mesh of `RTCPeerConnection`s using "perfect negotiation" based on participant ID ordering. Each remote peer provides a `MediaStream` containing video and audio tracks.
- **Active Speaker Detection**:
  - `usePeerConnections.ts` (lines 394–480) creates an `AudioContext` and attaches an `AnalyserNode` (`fftSize = 512`, `smoothingTimeConstant = 0.6`) to each remote peer stream.
  - Computes RMS audio level every `requestAnimationFrame`. If `rms > 0.035`, sets `activeSpeakerId`.
  - **Identified Gap**: `localStream` (the local participant/host) is currently not attached to an analyser node, so the local user is never detected as the active speaker locally. Furthermore, the active speaker cue is a hard boolean toggle causing jarring border pops.

### 4.2 Translated Voice Playback (`useVoicePlayback.ts`)
- Translated captions receive audio from:
  1. Server-side TTS prefetch or on-demand fetch (`/api/demo/speech?lang=...&text=...`).
  2. Local browser `speechSynthesis` fallback with Odia-to-Devanagari phonetic transliteration (`odiaToDevanagariPhonetic`).
- When server audio is available, it plays via `new Audio(voice.audioUrl)`.
- **Identified Gap**: Currently, `new Audio()` plays directly to the device audio output and is not exposed as a `MediaStreamTrack`. For the recording pipeline to capture translated audio alongside the mic, an `AudioContext` routing mechanism is required.

---

## 5. In-Meeting Recording Pipeline Design (R1 & R4)

### 5.1 Compositing Architecture (Video + Dual Audio)
To meet Requirement R1 ("Capture composited canvas/video stream with both original mic and translated audio streams using MediaRecorder"):

```
                               ┌─────────────────────────┐
                               │ Local Microphone Track  │──┐
                               └─────────────────────────┘  │
                               ┌─────────────────────────┐  │   Web Audio API
                               │ Remote Peer Audio Tracks│──┼── AudioContext ────────► MediaStreamAudioDestinationNode
                               └─────────────────────────┘  │   Gain / Mixing               (Mixed Audio Track)
                               ┌─────────────────────────┐  │
                               │ Translated Audio Playback│──┘
                               └─────────────────────────┘                                    │
                                                                                               ▼
┌────────────────────────────────┐                             ┌──────────────────────────────────────────────┐
│ Stage Video Elements           │                             │             Combined MediaStream             │
│ (Screen share / Cam Tiles /    │──► Canvas 2D Loop ─────────►│  [Composited Video Track + Mixed Audio Track]│
│  Avatars + Burnt-in Subtitles) │    (1280x720 @ 30fps)       └──────────────────────┬───────────────────────┘
└────────────────────────────────┘      captureStream(30)                             │
                                                                                      ▼
                                                                        ┌───────────────────────────┐
                                                                        │   Browser MediaRecorder   │
                                                                        │  (video/webm;codecs=vp9)  │
                                                                        └─────────────┬─────────────┘
                                                                                      │
                                                                   ┌──────────────────┴──────────────────┐
                                                                   ▼                                     ▼
                                                        Instant Client Download              Upload to Server Archive
                                                        (Blob URL .webm / .mp4)         (POST /api/meetings/:code/recordings)
```

### 5.2 Step-by-Step Recording Implementation Blueprint

#### A. Multi-Source Audio Mixer (`AudioContext`)
```ts
export class MeetingAudioMixer {
  private ctx: AudioContext;
  private dest: MediaStreamAudioDestinationNode;
  private micGain: GainNode;
  private voiceGain: GainNode;

  constructor() {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx({ sampleRate: 48000 });
    this.dest = this.ctx.createMediaStreamDestination();
    this.micGain = this.ctx.createGain();
    this.voiceGain = this.ctx.createGain();
    this.micGain.connect(this.dest);
    this.voiceGain.connect(this.dest);
  }

  public addLocalMic(stream: MediaStream) {
    if (stream.getAudioTracks().length === 0) return;
    const src = this.ctx.createMediaStreamSource(new MediaStream([stream.getAudioTracks()[0]]));
    src.connect(this.micGain);
  }

  public addRemoteStream(stream: MediaStream) {
    if (stream.getAudioTracks().length === 0) return;
    const src = this.ctx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
    src.connect(this.dest);
  }

  public connectAudioElement(audio: HTMLAudioElement) {
    try {
      const src = this.ctx.createMediaElementSource(audio);
      src.connect(this.voiceGain);
      src.connect(this.ctx.destination); // Also play to speaker
    } catch {
      // Audio element already connected or cross-origin
    }
  }

  public getMixedTrack(): MediaStreamTrack {
    return this.dest.stream.getAudioTracks()[0];
  }

  public close() {
    void this.ctx.close();
  }
}
```

#### B. Canvas Stage Compositor
A lightweight, hidden 1280x720 `<canvas>` captures:
1. When screen sharing is active: Draws the `screenVideo` element centered with high fidelity, plus picture-in-picture speaker webcam in bottom right.
2. In camera grid mode: Draws active participant video elements (or avatars when camera is off) with neat grid partitioning (1, 2, 4, 6 tiles).
3. Active speaker border: Outlines the speaking participant's tile with primary accent glow.
4. Burned-in Subtitles (accessible video): Draws a dark rounded subtitle pill at the bottom with current speaker name and caption text.
5. Emits track via `canvas.captureStream(30)`.

#### C. Lifecycle & File Handling
1. **Start Recording**:
   - Opens confirmation modal ("Record this class? Participants will be notified.").
   - Initializes mixer + canvas loop + `MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' })`.
   - Emits `recording:start` via Socket.IO transport so all participants receive state and display the pulsing red `REC` pill.
2. **Pause / Resume Recording**:
   - `mediaRecorder.pause()` / `resume()` with timestamp accounting.
3. **Stop Recording**:
   - `mediaRecorder.stop()`.
   - On `dataavailable`: Gathers chunks into `const blob = new Blob(chunks, { type: 'video/webm' })`.
   - **Instant Download**: Triggers automatic client-side anchor click:
     `nexclass-${meetingCode}-${timestamp}.webm`.
   - **Server Upload**: Sends `multipart/form-data` or binary blob to:
     `POST /api/meetings/:code/recordings`
     Payload: `{ recording: file, duration: seconds, recordedBy: name }`.
   - Emits `recording:stop` to clear indicators across all peers.

#### D. API Server Endpoints & Persistence
- `POST /api/meetings/:code/recordings`: Accepts file upload, saves to disk under persistent directory (`uploads/recordings/` or configured volume), stores metadata (filename, duration, sizeBytes, createdAt, meetingCode) in database/in-memory store.
- `GET /api/meetings/:code/recordings`: Returns list of recordings:
  ```json
  [
    {
      "id": "rec-1740000000",
      "filename": "nexclass-MATH101-20261023.webm",
      "sizeBytes": 14502800,
      "duration": 482,
      "createdAt": "2026-10-23T13:40:00.000Z",
      "downloadUrl": "/api/meetings/MATH101/recordings/nexclass-MATH101-20261023.webm"
    }
  ]
  ```
- `GET /api/meetings/:code/recordings/:filename`: Streams recorded WebM/MP4 with `Accept-Ranges: bytes` support for video playback seeking.

---

## 6. Advanced UI/UX Polish & Fluid Animations (R3 & R4)

### 6.1 Google Meet Interface Enhancements
1. **Pulsing Red "REC" Badge (`ClassroomHeader.tsx`)**:
   - Positioned in top header next to title and duration.
   - Visible to all room participants whenever `isRecording` is true.
   - Displays pulsing red dot, elapsed recording timer (formatted `00:00:00`), and subtle `animate-pulse` or framer spring ring.
2. **Tactile Bottom Toolbar (`ClassroomToolbar.tsx`)**:
   - Added circular Record Call button (host control):
     - Inactive state: Gray surface button with camera/disc icon.
     - Active recording: Pulsing red pill/circle with pause and stop actions.
   - Micro-interactions:
     - `whileHover={{ scale: 1.08, y: -2 }}`
     - `whileTap={{ scale: 0.92 }}`
     - `transition={{ type: "spring", stiffness: 450, damping: 25 }}`
   - Smooth animated tooltips with delay-free entry.
3. **Recording Confirmation Modal**:
   - Google Meet-styled modal overlay when clicking Record:
     - Clear notice: *"Record this class? Recording will capture video, microphone audio, and live translated speech. All participants will see the recording indicator."*
     - Actions: [Cancel] and [Start Recording] (emerald/primary button).
4. **Recordings Management Tab (`MeetSidePanel.tsx`)**:
   - Inside Details tab (`info`), a dedicated "Classroom Recordings" accordion/card:
     - Real-time status indicator (Active / Idle).
     - List of completed recordings with timestamp, duration, download button, and copy link button.
5. **Video Tile Transitions & Pin-to-Stage (`Stage.tsx` & `VideoTile.tsx`)**:
   - Add `<AnimatePresence>` around tiles so peers joining/leaving animate smoothly (`opacity: 0, scale: 0.9` -> `opacity: 1, scale: 1`).
   - Pinning support: When user clicks Pin on a `VideoTile`, that participant is promoted to the primary focus area, while others arrange into a neat secondary horizontal strip.
6. **Smooth Equalizer & Speaker Cues (`VideoTile.tsx`)**:
   - Replace abrupt border popping with a smooth CSS/motion transition:
     `transition: border-color 300ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 300ms cubic-bezier(0.2, 0.8, 0.2, 1)`.
   - Smooth animated 4-bar equalizer wave where heights interpolate continuously rather than jumping in discrete steps.

---

## 7. Indic Script Rendering & Accessibility Audit (Task 4)

### 7.1 Indic Script Typography Inspection
Supported languages:
- **English (`en`)**: Latin
- **Tamil (`ta`)**: தமிழ் script
- **Hindi (`hi`)**: Devanagari script (हिन्दी)
- **Bengali (`bn`)**: Bengali script (বাংলা)
- **Marathi (`mr`)**: Devanagari script (मराठी)
- **Odia (`or`)**: Oriya script (ଓଡ଼ିଆ)

**Findings & Improvements**:
1. **Google Fonts Link (`apps/web/index.html`)**:
   - Current link imports only `Sora`, `Inter`, `JetBrains Mono`.
   - **Recommended enhancement**: Update Google Fonts stylesheet in `index.html` to import official Noto Sans Indic font families:
     - `Noto Sans Devanagari`
     - `Noto Sans Tamil`
     - `Noto Sans Bengali`
     - `Noto Sans Oriya`
2. **Tailwind Font Stacks (`apps/web/tailwind.config.js`)**:
   - Add font fallback stack:
     ```js
     fontFamily: {
       display: ["Sora", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Bengali", "Noto Sans Oriya", "Inter", "system-ui", "sans-serif"],
       sans: ["Inter", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Bengali", "Noto Sans Oriya", "system-ui", "sans-serif"],
       indic: ["Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Bengali", "Noto Sans Oriya", "Nirmala UI", "system-ui", "sans-serif"],
     }
     ```
3. **Indic OpenType & Line Height (`apps/web/src/index.css`)**:
   - Complex Indic scripts feature top matras and conjunct sub-scripts. Adding `line-height: 1.6` for `[lang="ta"]`, `[lang="hi"]`, `[lang="bn"]`, `[lang="or"]`, `[lang="mr"]` ensures no ascender/descender clipping occurs.

### 7.2 Terminology Gloss Popovers (`TermText.tsx`)
- Detects protected scientific terms using `@nexclass/terminology`.
- Clickable button shows localized equivalent + definition.
- Includes Odia phonetic transliteration (`odiaToDevanagariPhonetic`) for TTS pronunciation.
- Animation smoothly adapts with `useReducedMotion()`.

### 7.3 Accessibility (`useReducedMotion`) Compliance
- Verified: `useReducedMotion()` from `motion/react` is already imported and respected across 20+ components.
- In `index.css`:
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
- Spring animations cleanly disable displacement/scale when `reduced` is true.

---

## 8. Build & Test Verification (Task 5)

Commands executed in `E:\mnt\e\NexClass`:

| Check | Command | Result | Details |
|---|---|---|---|
| **TypeScript Typecheck** | `npm run typecheck` | **PASS (Exit 0)** | `@nexclass/api`: 0 errors. `@nexclass/web`: 0 errors (`tsc --noEmit`). |
| **Vite Web Production Build** | `npm run build -w @nexclass/web` | **PASS (Exit 0)** | Built production assets in 2.41s without warnings. Main bundle: 291 kB gzip 95 kB. |
| **API Unit & Integration Tests** | `npm test -w @nexclass/api` | **PASS (Exit 0)** | 22 of 22 Vitest tests pass in 1.09s (`tests/api.test.ts`). |
| **Lint Script** | `npm run lint` | Note | Fails because `eslint` binary is not in package.json devDependencies. Code is clean under TypeScript compiler. |

---

## 9. Implementation File Blueprint for Downstream Implementer

The implementer can cleanly deliver R1, R3, and R4 with the following targeted updates:

1. **`apps/web/src/hooks/useMeetingRecording.ts` (New Hook)**:
   - Encapsulates `MediaRecorder`, `MeetingAudioMixer` (Web Audio API), canvas stage compositor loop, download trigger, and server upload.
   - Exports `{ isRecording, isPaused, duration, startRecording, pauseRecording, resumeRecording, stopRecording, recordings, refreshRecordings, uploading }`.
2. **`apps/web/src/components/classroom/ClassroomHeader.tsx`**:
   - Add `isRecording?: boolean` and `recordingElapsed?: number` props.
   - Render pulsing red `REC` pill badge with duration timer.
3. **`apps/web/src/components/classroom/ClassroomToolbar.tsx`**:
   - Add Record Call circular button with tactile motion spring, active recording ring, and tooltip.
4. **`apps/web/src/components/classroom/MeetSidePanel.tsx`**:
   - In `info` tab, add "Meeting Recordings" section displaying saved sessions with download links and streaming playback.
5. **`apps/web/src/components/classroom/Stage.tsx` & `VideoTile.tsx`**:
   - Wrap participant tiles in `<AnimatePresence>`.
   - Support `pinnedParticipantId` to expand pinned user tile smoothly to main stage.
   - Soften active speaker border transition and enhance equalizer wave.
6. **`apps/web/src/components/classroom/RecordingConfirmModal.tsx` (New Component)**:
   - Confirmation dialog before starting recording.
7. **`apps/web/src/lib/api.ts` & `apps/web/src/lib/transport.ts`**:
   - Add `listRecordings` and `uploadRecording` methods.
   - Add recording events (`recording:start`, `recording:stop`, `recording:status`) to `ClientEventMap` / `ServerEventMap`.
8. **`apps/web/index.html` & `tailwind.config.js`**:
   - Add Noto Sans Indic fonts for Tamil, Devanagari, Bengali, and Oriya.
