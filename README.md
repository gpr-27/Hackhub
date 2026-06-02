# Aura — Mental Wellness

A full-stack mental wellness companion with a polished, modern UI: mood tracking
with AI reflections, an empathetic AI wellness chat (powered by **Groq**), a
mindful studio (breathing, meditation, gratitude, drawing), medication reminders,
and a complete smart health record.

- **Frontend** — React 19 + **Vite** in [`frontend/`](frontend); the dev server runs on Vite's default port (**5173**).
- **Backend** — Express + MongoDB API in [`backend/`](backend); the port comes from `PORT` (e.g. **3001**).

All configuration is environment-driven — there are no environment-specific
values (URLs, ports, model names, provider names, keys) hardcoded in the source.
The backend reads everything through [`backend/src/config/index.js`](backend/src/config/index.js)
and the frontend through [`frontend/src/config/index.ts`](frontend/src/config/index.ts);
both validate their required variables at startup and fail fast with a clear error.

## Features

- 🏠 **Dashboard** — personalized greeting, wellness stats, mood sparkline, quick actions.
- ❤️ **Mood Tracker** — 1–10 mood + intensity + emotion chips + notes, AI-generated
  reflections (Groq), trend charts, and an editable history.
- 💬 **Wellness Chat** — empathetic AI chat with therapy / meditation / wellness /
  crisis modes, persisted history, and a crisis-support banner.
- ✨ **Mindful Studio** — animated box-breathing, a meditation timer, a gratitude
  journal, a creative drawing canvas, and healthy-living tips (all client-side).
- 💊 **Medications** — schedule, dosage, reminders/chime, and a daily adherence ring.
- 🗂️ **Smart Health Records** — health profile, medical history, lab reports, doctor
  visits, prescriptions, vital-sign charts, and emergency contacts.

## Design system

The frontend is built on a token-based design system (**AURA**) with full
**light/dark theming**, a reusable UI kit, a shared `AppShell` (sidebar + topbar),
toasts, and smooth motion. See [`frontend/DESIGN_SYSTEM.md`](frontend/DESIGN_SYSTEM.md)
for tokens, component APIs, and conventions. Icons use `lucide-react`; charts use
`recharts`.

```
.
├── frontend/        # React app (UI)
│   ├── public/
│   ├── src/
│   └── package.json
├── backend/         # Express + MongoDB API
│   ├── src/
│   │   ├── config/      # centralized config (index.js) + logger + db + time
│   │   ├── models/      # mongoose schemas
│   │   ├── middleware/  # Clerk session verification (auth guard)
│   │   ├── routes/      # API endpoints by domain
│   │   └── services/    # Groq AI client + password hashing
│   ├── tests/           # supertest + in-memory MongoDB
│   └── package.json
├── package.json     # root orchestrator (runs both apps together)
└── netlify.toml     # frontend deploy config
```

## Prerequisites

- Node.js 18+ and npm
- A MongoDB database — either a [MongoDB Atlas](https://www.mongodb.com/atlas) connection
  string, **or** use the built-in in-memory database for local development.
- A [Groq API key](https://console.groq.com) (optional — the app uses safe
  fallback responses until one is provided).
- A [Clerk application](https://dashboard.clerk.com) (free) for authentication —
  you'll need its publishable key and secret key.

## Setup

1. Install dependencies for the root, backend, and frontend:

   ```bash
   npm run install:all
   ```

2. Configure environment variables. There is a **single shared `.env` at the
   repository root** used by both the backend (via dotenv) and the frontend (via
   Vite's `envDir`). Only `VITE_`-prefixed vars reach the browser, so the backend
   secrets in the same file never leak to the client.

   ```bash
   cp .env.example .env
   ```

   Every variable in `.env.example` is required at startup. Key ones to set:
   - `MONGODB_URI` — your connection string (leave blank to use the in-memory DB
     via `npm run dev:memory`).
   - `GROQ_API_KEY` — your key from https://console.groq.com (required only in
     production; otherwise the app uses built-in fallback replies).
   - `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PUBLISHABLE_KEY`
     — from your Clerk dashboard (https://dashboard.clerk.com → API keys). The two
     publishable keys must be identical. Authentication is managed by Clerk.
   - `CLIENT_URL` — the frontend origin (e.g. `http://localhost:5173`).
   - `DEFAULT_MODEL` / `AVAILABLE_MODELS` (+ `VITE_*` mirrors) — the model and the
     selectable model list that populates the in-app selector.

## Running locally

**Option A — with the in-memory database (no MongoDB account needed):**

```bash
npm run dev:memory
```

**Option B — against your own MongoDB** (set `MONGODB_CONNECTION_STRING` first):

```bash
npm run dev
```

Both commands start the backend (port from `PORT`, e.g. http://localhost:3001)
and the Vite frontend (http://localhost:5173) together. You can also run them
separately with `npm run start:backend` and `npm run start:frontend`.

## Tests

End-to-end backend tests run against an in-memory MongoDB (no external services):

```bash
npm test
```

## How the AI works

The frontend never talks to Groq directly. Health Chat and the Mood Tracker call
the backend endpoint `POST /api/ai/chat`, which calls Groq server-side. This keeps
the API key secret and avoids browser CORS restrictions. When no key is
configured, the endpoint returns friendly built-in fallback responses so the app
keeps working without errors. The provider and models are configured entirely via
the environment — `LLM_PROVIDER`, `DEFAULT_MODEL` and the `AVAILABLE_MODELS` list
(mirrored on the frontend by `VITE_AVAILABLE_MODELS`, which populates the in-app
model selector). No model or provider names are hardcoded in the source, and the
chosen model is validated server-side against `AVAILABLE_MODELS`.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). In short: deploy `frontend/` to Netlify (config
in `netlify.toml`) and `backend/` to a Node host (Render/Railway/etc.), then set
the `VITE_*` variables (including `VITE_API_URL` → the backend's URL) in the
Netlify UI and the backend variables on your Node host.
