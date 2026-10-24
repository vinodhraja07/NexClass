# Project: NexClass Premium Dashboard Command Center — Emerald Glass UI/UX Transformation

## Architecture
NexClass is an AI-powered multilingual virtual classroom platform architected as a TypeScript monorepo with `@nexclass/api` (Express, Socket.io, Mongoose, ioredis, WebRTC mesh signaling) and `@nexclass/web` (React 18, Vite, Tailwind CSS, Motion/React, Web Audio API, MediaRecorder).

This project phase transforms the NexClass dashboard into a clean, premium, and uncluttered educational command center using a sleek left-sidebar navigation layout with the **Emerald Glass UI/UX Transformation** (Premium Futuristic Design + Advanced Motion System).

- **Emerald Glass Design System (MANDATORY USER TRANSFORMATION MANDATE 2026-10-24T04:45:58Z)**:
  - **Background Surfaces**:
    - Primary background: `#101A16`
    - Secondary background: `#17231D`
    - Main surface: `#1D3028`
    - Elevated surface: `#294034`
    - Floating surface: `#20382E`
    - Muted surface: `#1A2A21`
  - **Emerald Accents & Highlights**:
    - Primary Emerald: `#78A98B`
    - Deep Emerald: `#176B55`
    - Soft Emerald: `#32B98A`
    - Secondary Sage: `#C4B887`
    - AI Accent: `#9B9B78`
    - Pale Mint: `#B3E5C5`
  - **Typography (Crisp High-Contrast)**:
    - Primary text: `#E9EFE8`
    - Secondary text: `#ACBCAF`
    - Muted text: `#829487`
  - **Borders & Overlays**:
    - Default border: `#34483B`
    - Subtle border: `#293C32`
    - Active border: `#78A98B`
    - Soft shadow: `rgba(0, 0, 0, 0.22)`
    - Emerald glow: `rgba(120, 169, 139, 0.12)`
    - Glass overlay: `rgba(255, 255, 255, 0.035)`
  - **Strict Constraint**: FRONTEND PRESENTATION & MOTION ONLY. No backend, API, auth, WebRTC, or business logic modifications. All existing features remain 100% operational.
- **Navigation & Layout Architecture**:
  - Replaces the 2-tier horizontal top header with a sleek, collapsible left-sidebar navigation (`DashboardSidebar`).
  - Brand & user identity: NexClass wordmark with role indicator (`Teacher` / `Student`) and active user profile badge.
  - 4 Core Navigation Items: `Classrooms` (with real-time active counter pill), `Create Classroom` (quick-action button), `Transcripts & Archive` (past sessions with multilingual badges), `Preferences & Languages` (UI language & caption presets).
  - Collapsible / Responsive rail: Icon-only collapsed mode (`w-20`) on desktop with floating glass tooltips; smooth slide-over drawer with backdrop blur and escape key dismissal on mobile/tablet (<1024px).
  - Sidebar Footer: Live WebRTC / STUN / Neural TTS / ASR / Translation server connection status beacon (`api.providerStatus`) with full diagnostics popover and logout trigger.
  - URL Synchronization: Seamless view switching via `?view=classrooms|create|transcripts|preferences` using `useSearchParams` with zero full-page reloads and layout stability.
- **Visual Design System**:
  - Dark glassmorphism with deep velvety Emerald Glass backgrounds (`bg-ink-950/90`, `#101A16`), translucent panels (`backdrop-blur-xl`), delicate luminous borders (`#34483B`, `#78A98B`), and subtle specular highlights (`rgba(255, 255, 255, 0.035)`).
  - Indic typography: Line-height relaxation (`1.5-1.65`) to prevent clipping on upper matras and lower conjuncts (Hindi, Tamil, Bengali, Marathi, Odia).
- **Motion & Physics**:
  - Directional slide and blur cross-fade view transitions wrapped in `<AnimatePresence mode="wait">`.
  - Staggered cascading entries (`staggerChildren: 0.05s`) for cards, action decks, and metric chips.
  - Tactile spring micro-interactions (`whileTap={{ scale: 0.97 }}`, `whileHover={{ y: -2 }}`).
  - Strict accessibility compliance via `<MotionConfig reducedMotion="user">` and `useReducedMotion()`.
- **Focused Views**:
  - `ClassroomsView`: Compact Hero Action Deck (Instant 1-Click Meeting launching directly into classroom room, Join by Code with 6-char animated input, Open Demo), Active & Upcoming Classrooms grid, and Recent Sessions drawer.
  - `CreateClassroomView`: 2-column split configuration with real-time "Meeting Card Preview" updating live as teacher types, language matrix, granular participant permissions, and celebratory post-creation modal with 48px monospace shareable code.
  - `TranscriptsView`: Search and filter by title, room code, date range, language; multi-language badges; real 1-click "Export TXT" transcript download fetching segments and translations from API; Reopen Session action.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Sleek Left Sidebar Navigation | Collapsible left sidebar replacing top tabs, brand & user identity, active counter pills, 4 nav items | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Responsive Rail & Slide-Over Drawer | Icon-only collapsed desktop rail (`w-20`) with tooltips; mobile/tablet slide-over drawer with backdrop blur & escape dismissal | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Server Health & Diagnostics Footer | Live WebRTC/STUN/TTS/ASR/Translation server status beacon and logout action in sidebar footer | M1 | ORIGINAL_REQUEST §R1 |
| 4 | URL Query View Synchronization | Synchronize active view with `?view=classrooms\|create\|transcripts\|preferences` without page reloads | M1 | ORIGINAL_REQUEST §R1, §R5 |
| 5 | Dark Glassmorphism Design Tokens | `backdrop-blur-xl`, `bg-ink-950/90`, luminous borders, specular inner highlights | M1 | ORIGINAL_REQUEST §R2 |
| 6 | Emerald Glass UI/UX Design System | Full Emerald Glass palette (#101A16, #78A98B, #176B55, #E9EFE8, #34483B, #9B9B78) | M1, M2 | Mandate 2026-10-24 |
| 7 | Indic Typography Legibility | Prevent clipping of matras and conjuncts in language badges and text with relaxed line-height | M1 | ORIGINAL_REQUEST §R2 |
| 8 | Accessibility & Reduced Motion | Wrap in `MotionConfig reducedMotion="user"`, ensure instant fallback when reduced motion preferred | M1 | ORIGINAL_REQUEST §R3 |
| 9 | Compact Hero Action Deck | Instant 1-Click Meeting (direct launch to room), Join by Code (6-char animated input), Open Demo | M2 | ORIGINAL_REQUEST §R4 |
| 10 | Classrooms Glassmorphic Grid | Responsive grid of active & upcoming classrooms with live participant count, enter, copy link, copy code | M2 | ORIGINAL_REQUEST §R4 |
| 11 | Recent Sessions Quick-Glance Drawer | Collapsible quick-glance drawer of completed sessions with 1-tap jump to Transcripts | M2 | ORIGINAL_REQUEST §R4 |
| 12 | Create Classroom Form & Controls | Clean card-based config: title, 6 lecture languages, student caption matrix, password, permissions pills | M3 | ORIGINAL_REQUEST §R4 |
| 13 | Real-Time Meeting Card Live Preview | Interactive card preview updating in real-time as teacher types title, changes language or permissions | M3 | ORIGINAL_REQUEST §R4 |
| 14 | Celebratory Post-Creation Screen | Large 48px monospace room code, 1-click copy link, direct Enter Classroom action | M3 | ORIGINAL_REQUEST §R4 |
| 15 | Transcripts Search & Filter | Filter archive by meeting title, room code, date range, and language code | M4 | ORIGINAL_REQUEST §R4 |
| 16 | Multi-Language Transcript Badges | Visual badges for supported languages (EN, TA, HI, BN, MR, OR) on transcript items | M4 | ORIGINAL_REQUEST §R4 |
| 17 | Real 1-Click TXT Transcript Export | Download formatted multi-language `.txt` file pulling actual segments and translations from API | M4 | ORIGINAL_REQUEST §R4 |
| 18 | Reopen Session Action | One-click action to reopen an archived classroom session | M4 | ORIGINAL_REQUEST §R4 |
| 19 | Preferences & Languages View | Preferred UI language & caption presets management | M4 | ORIGINAL_REQUEST §R1 |
| 20 | Fluid Spring Motion & View Transitions | Directional slide & cross-fade `<AnimatePresence mode="wait">`, staggered card cascades, tactile spring physics | M5 | ORIGINAL_REQUEST §R3 |
| 21 | Responsive Layout Hardening & Verification | Verified across mobile (<640px), tablet (640-1024px), desktop (1024-1440px), ultrawide; 0 TypeScript errors; clean production build | M5 | ORIGINAL_REQUEST §R5, Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Left Sidebar Shell, Responsive Rail & Glassmorphism Navigation | Features 1, 2, 3, 4, 5, 7, 8 | none | DONE |
| M2 | Emerald Glass Classrooms Command Center View | Features 6, 9, 10, 11 | M1 | PLANNED |
| M3 | Create Classroom View & Live Preview | Features 12, 13, 14 | M1, M2 | PLANNED |
| M4 | Transcripts & Archive View with TXT Export | Features 15, 16, 17, 18, 19 | M1, M2 | PLANNED |
| M5 | Fluid Motion, E2E Integration & Final Forensic Audit | Features 20, 21 | M2, M3, M4 | PLANNED |
