# Original User Request

## Initial Request — 2026-10-23T13:24:48Z

Build full production hardening, advanced UI/UX polish, and fluid animations for NexClass, including an in-meeting recording pipeline with browser MediaRecorder and server archive, complete Docker multi-container deployment, and multi-participant stress testing.

Working directory: E:\mnt\e\NexClass
Integrity mode: development

## Requirements

### R1. In-Meeting Recording Pipeline
Implement meeting recording capabilities for host/teacher:
- Add a Record Call control in the bottom toolbar / Meet side drawer with start, pause, and stop controls.
- Display a pulsing red "REC" indicator in the top header when recording is active.
- Capture composited canvas/video stream with both original mic and translated audio streams using MediaRecorder.
- On stop: offer instant client-side download (.webm / .mp4) and upload the completed recording to the API server archive storage.
- Add an API endpoint GET /api/meetings/:code/recordings to list and stream saved recordings.

### R2. Docker Production Deployment Infrastructure
Provide a turnkey multi-container Docker configuration:
- Multi-stage Dockerfile for @nexclass/api (optimized Node.js Alpine runtime).
- Multi-stage Dockerfile for @nexclass/web (Nginx/Caddy static asset serving with gzip and SPA routing).
- Production docker-compose.yml orchestrating MongoDB, Redis, API server, and Web frontend with environment configurations, healthchecks, and volume persistence for recordings and database data.
- Environment templates (.env.example) and verification commands.

### R3. Advanced Classroom UI/UX Polish & Fluid Animations
Elevate the Google Meet virtual classroom interface with fluid animations:
- Smooth layout animations (motion/react) for participant tile entering, exiting, re-ordering, and pin-to-stage expansion.
- Sophisticated active-speaker visual cues: smooth animated audio equalizer wave and subtle accent border transitions without jarring pulse jumps.
- Polished micro-interactions for bottom circular toolbar buttons (tactile spring clicks, hover states, tooltip transitions, and audio wave state changes).
- Smooth entry transitions for floating multilingual captions and terminology gloss popovers with high-contrast Indic typography rendering.
- Full respect for accessibility with useReducedMotion().

### R4. Google Meet UI & Notification Polish
Seamlessly integrate recording status into the Google Meet interface:
- Red "REC" pill badge in ClassroomHeader.tsx with elapsed recording timer.
- Recording button in ClassroomToolbar.tsx with active indicator.
- Confirmation modal when starting/stopping recording to alert all participants ("Recording has started").
- Recording management tab inside MeetSidePanel.tsx (Details tab) showing completed recording links.

### R5. Automated Multi-Peer Concurrency Stress Test Suite
Create a comprehensive automated stress and load test:
- Script simulating 8+ concurrent participants joining a meeting room simultaneously.
- Verify WebRTC mesh signaling stability, room event fanout, and caption streaming under load.
- Verify zero-key Odia speech synthesis fallback under concurrent requests without memory leaks or race conditions.

## Acceptance Criteria

### Recording Pipeline
- [ ] Host can start recording; all participants see the pulsing "REC" indicator.
- [ ] Stopping recording triggers an immediate local file download and saves a copy to server disk.
- [ ] Downloaded recording plays back valid synchronized video and audio.

### UI/UX & Animations
- [ ] Video tile grid animates smoothly using layout springs when participants join, leave, or speak.
- [ ] Circular bottom bar buttons have tactile spring clicks and responsive hover states.
- [ ] Captions float smoothly with animated interim transcription and clear Indic script rendering.
- [ ] All animations obey prefers-reduced-motion settings.

### Docker Deployment
- [ ] docker compose -f docker-compose.yml config passes validation without syntax errors.
- [ ] Both API and Web containers build cleanly and pass container health checks (/api/health returns ok: true).

### Concurrency & Reliability
- [ ] Automated stress script runs 8 concurrent participants through room join, caption exchange, and chat messaging without connection drops.
- [ ] All existing Vitest tests (npm test -w @nexclass/api) continue to pass 100%.
- [ ] TypeScript check (npm run typecheck) and Vite build (npm run build -w @nexclass/web) pass cleanly with 0 errors.
