# NexClass — multilingual real-time virtual classroom

One teacher opens a live meeting and speaks in their own language.
Every student reads the captions and hears the voice in exactly the
language they chose (`en`, `ta`, `hi`, `bn`, `mr`, `or`), while the
**original transcript is never lost** and technical terms stay intact.

## Features

- **Per-participant language control** — caption language, voice
  language and interface language are independent per participant.
- **Original transcript always preserved** — translations are layered
  on top; when a translation provider is missing the text is marked
  `failed`, never invented.
- **Terminology engine** (`@nexclass/terminology`) — engineering and
  science expressions are detected and protected from machine
  translation placeholders, then restored with verified localised
  equivalents plus the original in parentheses.
- **Translated voice** — remote TTS when configured; otherwise a keyless
  fallback voice (Google Translate speech endpoint) synthesizes every
  supported language on the server; when that is disabled or offline,
  per-student browser speech synthesis is the last resort.
- **Live classroom** — WebRTC mesh audio/video, chat, hand raise, mute
  state, all over Socket.IO.
- **Interactive in-product demos** — `/demo` (captions + voice
  translation) and `/demo/room` (3D shared-room label translation) run
  prepared segments and emulate a full class in all six languages
  without any external API key.

## Monorepo layout

```
apps/web        React + TypeScript + Vite + Tailwind UI
apps/api        Express + Socket.IO + Mongoose backend
packages/shared        languages, event/type contracts, demo data, UI strings
packages/terminology   technical-term protection engine
```

## Quick start

```bash
npm install
npm run dev     # API :4000 + web :5173
```

No MongoDB or Redis? The API falls back to an in-memory store and says
so at boot. See `documentation/API_SETUP.md` for provider keys,
deployment details and the socket event contract.

Env templates: `apps/api/.env.example`, `apps/web/.env.example`.

## Commands

| Command          | Purpose                             |
| ---------------- | ----------------------------------- |
| `npm run dev`    | run API + web concurrently          |
| `npm run build`  | build shared, terminology, api, web |
| `npm test`       | API test suite (vitest)             |
| `npm run typecheck` | TypeScript check for both apps   |

## Honest status

Implemented and tested: REST API (auth, meetings, join, preferences,
chat, transcripts, providers status), realtime layer (join, captions
pipeline, chat, WebRTC relay, shared resources), terminology engine,
per-participant isolation, guest join, in-product demo transport, full
web UI. Live WebRTC/media between two browsers and configured
translation/TTS providers require external credentials and were not
run in this environment — the app reports them truthfully instead of
pretending.
