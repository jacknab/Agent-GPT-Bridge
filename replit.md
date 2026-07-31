# Night Watch — Apartment Telephone Agent

An AI-powered after-hours answering service for apartment complexes. Callers ring a Twilio phone number and are connected in real time to an OpenAI GPT-4o Realtime voice agent that handles maintenance requests, answers questions, and takes messages. A web dashboard lets property managers monitor call history and configure the agent.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/dashboard run dev` — run the dashboard (port 23183)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Required Secrets

| Secret | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key — must have Realtime API access |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |

## Twilio Configuration

After deploying, configure Twilio to point your phone number at this app:

1. Go to **Twilio Console → Phone Numbers → Manage → Active Numbers**
2. Click your number → **Voice Configuration**
3. Set **"A call comes in"** webhook to: `https://YOUR_DOMAIN/api/twilio/voice` (HTTP POST)
4. Set **"Call status changes"** to: `https://YOUR_DOMAIN/api/twilio/status` (HTTP POST)

The WebSocket bridge is served at: `wss://YOUR_DOMAIN/api/twilio/stream`

## Stack

- **pnpm workspaces**, Node.js 24, TypeScript 5.9
- **API**: Express 5 + WebSocket (ws package)
- **AI**: OpenAI GPT-4o Realtime API (gpt-4o-realtime-preview-2024-12-17) via raw WebSocket
- **Telephone**: Twilio Media Streams (G.711 µ-law audio — no conversion needed)
- **DB**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (zod/v4), drizzle-zod
- **Frontend**: React + Vite, TanStack Query, shadcn/ui, wouter, Tailwind CSS
- **API codegen**: Orval (from OpenAPI spec)

## Where Things Live

| Concern | Location |
|---|---|
| OpenAPI spec | `lib/api-spec/openapi.yaml` |
| DB schema | `lib/db/src/schema/` |
| WebSocket bridge (Twilio ↔ OpenAI) | `artifacts/api-server/src/lib/realtimeBridge.ts` |
| Twilio webhook routes | `artifacts/api-server/src/routes/twilio/index.ts` |
| Call log routes | `artifacts/api-server/src/routes/calls/index.ts` |
| Agent config routes | `artifacts/api-server/src/routes/config/index.ts` |
| Dashboard frontend | `artifacts/dashboard/src/` |

## Architecture

```
Caller
  │  (PSTN)
  ▼
Twilio Phone Number
  │  POST /api/twilio/voice  →  TwiML: <Connect><Stream url="wss://..."/></Connect>
  │
  ├─ WebSocket: /api/twilio/stream  ←──────────────────────────────────┐
  │      │  (G.711 µ-law audio, 8kHz)                                  │
  │      ▼                                                              │
  │  realtimeBridge.ts                                                  │
  │      │  (G.711 µ-law audio, 8kHz — same format, no conversion)     │
  │      ▼                                                              │
  │  OpenAI Realtime API (gpt-4o-realtime-preview)  ──── audio back ──►┘
  │
  └─ POST /api/twilio/status  →  Updates call record in PostgreSQL
```

Audio flows directly between Twilio and OpenAI in G.711 µ-law format — no transcoding required. Transcripts are accumulated from OpenAI events and saved to the DB when the call ends.

## Architecture Decisions

- **Raw WebSocket to OpenAI Realtime** — avoids the OpenAI SDK's Realtime client abstraction, keeping the bridge transparent and debuggable.
- **G.711 µ-law passthrough** — Twilio Media Streams and OpenAI Realtime both support `g711_ulaw`. No conversion, no latency penalty.
- **Server VAD** — OpenAI's server-side voice activity detection handles turn-taking; no client-side VAD logic needed.
- **Singleton agent config** — Config is a single row in `agent_config`; the bridge reads it fresh on each call connection.
- **Orval coerce.response += 'number'** — Added to prevent Orval v8.23 from generating `zod.int()` (Zod v4 only) in response schemas when the project uses Zod v3.

## User Preferences

_Populate as needed._

## Gotchas

- After any schema change in `lib/api-spec/openapi.yaml`, re-run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs`.
- The `@workspace/db` tables are not visible to leaf packages until `pnpm run typecheck:libs` has been run after schema changes.
- WebSocket connections from Twilio arrive at `/api/twilio/stream`; this is already under the `/api` path registered in the api-server artifact.toml so no extra config is needed.
- The OpenAI Realtime API model env var `OPENAI_REALTIME_MODEL` defaults to `gpt-4o-realtime-preview-2024-12-17`.
