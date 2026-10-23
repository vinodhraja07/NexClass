# API setup guide

Everything the API needs from the environment lives in `apps/api/.env`
(see `.env.example`). The server starts without any of it — sections
below describe what each optional knob unlocks and how the system
behaves when it is absent.

## Base behaviour with a bare `.env`

| Concern      | With no configuration                          |
| ------------ | ---------------------------------------------- |
| Data store   | In-memory document store (data lost on restart, clearly announced at boot) |
| Meeting transport | Socket.IO on the API port (`POST /api/...` REST + websocket namespace) |
| Auth         | JWT issued by `/api/auth/register` / `/login`; guests get a token when they join |
| Translation  | `TRANSLATION_PROVIDER=none` → original text only; per-language status is `failed`, never fabricated |
| Voice        | `TTS_PROVIDER=browser` → each student's browser `speechSynthesis` renders translations locally |
| Speech input | `ASR_PROVIDER=browser` → teacher uses the Web Speech API in the browser |

## Starting the stack

```bash
npm install          # installs all workspaces
npm run dev          # API on :4000, web on :5173 (concurrently)
npm test             # vitest suite for the API workspace
npm run build        # shared + terminology + api + web production builds
npm run typecheck    # tsc for both apps
```

The API also serves the built web app from `apps/web/dist` in
production mode (`NODE_ENV=production npm start -w @nexclass/api`).

## Persistence

- `MONGODB_URI` + `MONGODB_DB_NAME` — when the server can reach the
  database, all models (users, meetings, participants, transcript/
  translation/voice segments, chat) persist in Mongo. Otherwise an
  in-memory document store with the same tiny query surface is used.
- `REDIS_URL` — used for rate limiting and ephemeral meeting state
  coordination when present; an in-process cache is used otherwise.

## Provider environment variables

### Speech recognition (`ASR_*`)

- `ASR_PROVIDER` — `browser` (default), or `generic-http` to forward
  audio transcripts to a remote ASR.
- `ASR_API_KEY`, `ASR_API_URL` — credentials for the remote ASR.

### Translation (`TRANSLATION_*`)

- `TRANSLATION_PROVIDER` — `none` (default), `google`, `deepl`,
  `indictrans2` (a self-hosted IndicTrans2 HTTP bridge), or
  `generic-http`.
- `TRANSLATION_API_KEY`, `TRANSLATION_API_URL`, `TRANSLATION_MODEL`.
- Unsupported language pairs report `status: "failed"` for that
  translation; the original transcript is always preserved verbatim.

### Voice (`TTS_*`)

- `TTS_PROVIDER` — `browser` (default; students synthesize locally),
  `google-tts`, `azure-tts`, or `generic-tts` (remote rendering).
- `TTS_API_KEY`, `TTS_API_URL`.

### Interactive connectivity (`STUN_*` / `TURN_*`)

- `STUN_SERVERS` — comma-separated STUN URLs (public Google STUN by
  default).
- `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_PASSWORD` — optional TURN
  relay for restrictive networks; reported via `GET /api/providers/status`
  and exposed to clients through socket `meeting:joined` payloads.

## Truthful status reporting

`GET /api/providers/status` (also included in every socket
`meeting:joined` payload) exposes exactly what is configured:

```json
{
  "translationConfigured": false,
  "ttsConfigured": false,
  "stunServers": ["stun:stun.l.google.com:19302"],
  "turnConfigured": false
}
```

The UI surfaces these flags so a teacher always knows whether a
translated caption came from a real provider or is unavailable. The
product never invents a translation or a voice clip when a provider is
missing.

## Socket event contract (summary)

Client → server: `meeting:join`, `meeting:leave`, `media:state`,
`preferences:set`, `caption:interim`, `caption:original`, `chat:send`,
`webrtc:offer/answer/ice`, `room:resource:set`.

Server → clients: `meeting:joined`, `participant:joined/left/updated`,
`caption:interim`, `caption:segment`, `chat:message`,
`room:resource`, `room:labels`, `error:message`.

Every caption segment carries its original text, the protected
technical terms detected by `@nexclass/terminology`, and per-language
translation + voice entries with their own statuses and latencies.
