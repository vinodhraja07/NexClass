# Execution Plan: NexClass Premium Dashboard Command Center

## Objective
Transform the NexClass dashboard into a clean, premium, and uncluttered educational command center with a sleek left-sidebar navigation layout, dark glassmorphism aesthetic, fluid spring motion, and responsive views, meeting all acceptance criteria in `ORIGINAL_REQUEST.md`.

## Survey Phase
- Spawn 3 parallel Explorers:
  - `explorer_dash_1`: Web routing, view navigation, URL search params (`?view=classrooms|create|transcripts`), App.tsx and layout wrappers.
  - `explorer_dash_2`: Existing Dashboard components, tabs, classroom listing, join/create forms, transcripts, state & API calls (`listMeetings`, `providerStatus`, `createMeeting`).
  - `explorer_dash_3`: Design system, Tailwind configuration, CSS glassmorphism classes, motion/react setup, typography, and responsive breakpoints.

## Milestone Decomposition (Target)
- M1: Layout Shell & Sleek Left Sidebar Navigation (Desktop rail, mobile slide-over drawer, URL query synchronization, brand/user identity, connection status & logout).
- M2: Visual Design System & Dark Glassmorphism Polish (Deep velvety backgrounds, backdrop-blur-xl translucent cards, luminous borders, generous whitespace, zero clutter).
- M3: Fluid Spring Motion & Tactile Micro-Interactions (Framer Motion transitions, staggered entry, tactile physics, useReducedMotion compliance).
- M4: Focused Views: Classrooms Command Center (Hero Action Deck, active & upcoming grid, live participants indicator, recent sessions drawer).
- M5: Focused Views: Create Classroom Configuration & Live Preview (Real-time meeting card preview, language matrix, granular permissions, celebratory code modal).
- M6: Focused Views: Transcripts & Archive Center (Search & filter, multi-language badges EN/TA/HI/BN/MR/OR, TXT export, reopen session).
- M7: End-to-End Verification, TypeScript Hygiene (0 any), Build & Forensic Audit.

## Verification Protocol
- Strict gate on each milestone: Worker -> 2 Reviewers -> 2 Challengers -> 1 Forensic Auditor.
- 100% typecheck (`npm run typecheck`) and web build (`npm run build -w @nexclass/web`) verification.
