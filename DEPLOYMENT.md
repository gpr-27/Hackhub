# Deployment — Render (single service)

The whole app ships as **one Docker image on one Render web service**. The root
[`Dockerfile`](Dockerfile) builds the React (Vite) SPA and runs the Express API,
which serves that SPA from the same origin. So there is **one URL, no CORS, and
no second service** — the frontend and backend are deployed together.

Everything is configured by [`render.yaml`](render.yaml) (a Render Blueprint).

---

## Prerequisites

You provide three secrets at deploy time:

| Secret | Where to get it |
| --- | --- |
| `MONGODB_URI` | [MongoDB Atlas](https://www.mongodb.com/atlas) connection string (include a db name, e.g. `/healthcareDB`) |
| `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` | [Clerk dashboard](https://dashboard.clerk.com) → API keys |
| `GROQ_API_KEY` | [Groq console](https://console.groq.com) |

> Atlas Network Access must allow Render. The simplest option is to allow
> `0.0.0.0/0` (Atlas + the Clerk/Groq keys are your real access controls), or add
> Render's static outbound IPs if you want to lock it down.

## Deploy

1. **Push this repo to GitHub** (or GitLab/Bitbucket).
2. In the **Render Dashboard → New → Blueprint**, select this repository.
3. Render reads `render.yaml`, creates the `aura` web service, and prompts for the
   four `sync: false` values: `MONGODB_URI`, `CLERK_SECRET_KEY`,
   `CLERK_PUBLISHABLE_KEY`, `GROQ_API_KEY`. Paste them in and **Apply**.
4. Render builds the Docker image and deploys. First build takes a few minutes.
5. When it's live, open the service URL and check `…/api/health` returns `200`.

That's it. No CORS, no `VITE_API_URL`, no second service to wire up.

## How the single-origin setup works

- **Build time** — Render injects the service's environment variables as Docker
  build args. The `Dockerfile` maps the public ones (`CLERK_PUBLISHABLE_KEY`,
  `LLM_PROVIDER`, `DEFAULT_MODEL`, `AVAILABLE_MODELS`) to the `VITE_*` names Vite
  inlines into the browser bundle. Only **public** values are baked in.
- **Run time** — the real secrets (`MONGODB_URI`, `CLERK_SECRET_KEY`,
  `GROQ_API_KEY`) are ordinary runtime env vars; they never enter an image layer.
- **Same origin** — the SPA calls the API at a relative `/api/...` path (no
  `VITE_API_URL` needed). The Express server serves both `/api/*` and the SPA
  (`config.staticDir` → `app.js`), and `CLIENT_URL` falls back to Render's
  injected `RENDER_EXTERNAL_URL`, so CORS is satisfied automatically.

## Environment variables

Set in `render.yaml` (edit there to change defaults):

| Variable | Set by | Notes |
| --- | --- | --- |
| `NODE_ENV` | blueprint | `production` |
| `LOG_LEVEL` | blueprint | `error` \| `warn` \| `info` \| `debug` |
| `LLM_PROVIDER` | blueprint | `groq` |
| `GROQ_BASE_URL` | blueprint | `https://api.groq.com/openai/v1` |
| `DEFAULT_MODEL` | blueprint | must be one of `AVAILABLE_MODELS` |
| `AVAILABLE_MODELS` | blueprint | `id` or `id:Label`, comma-separated |
| `MONGODB_URI` | **you** (`sync: false`) | Atlas connection string |
| `CLERK_SECRET_KEY` | **you** (`sync: false`) | `sk_…` |
| `CLERK_PUBLISHABLE_KEY` | **you** (`sync: false`) | `pk_…`; also baked into the SPA |
| `GROQ_API_KEY` | **you** (`sync: false`) | required in production |
| `PORT` | Render | injected automatically |
| `RENDER_EXTERNAL_URL` | Render | injected; used as the CORS origin fallback |

Optional: `CLIENT_URL`, `CORS_ORIGINS`, `CORS_ALLOWED_ORIGIN_SUFFIXES`,
`TRUST_PROXY_HOPS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `BODY_LIMIT`. Set
`CLIENT_URL` (or `CORS_ORIGINS`) only if you add a **custom domain**.

## Custom domain

Add the domain in the Render service settings, then set `CLIENT_URL` to that
origin (e.g. `https://app.example.com`) so it is the CORS-allowed origin. Render
serves it over HTTPS automatically.

## Build and run the image locally (optional)

The image is self-contained. Public build values default in the `Dockerfile`,
but pass your own to exercise the real frontend:

```bash
# Build (override the public VITE_* values via build args as needed)
docker build -t aura \
  --build-arg CLERK_PUBLISHABLE_KEY="pk_…" \
  --build-arg DEFAULT_MODEL="llama-3.3-70b-versatile" \
  --build-arg AVAILABLE_MODELS="llama-3.3-70b-versatile:Llama 3.3 70B" .

# Run (runtime secrets + PORT come from your root .env)
docker run --rm -p 3001:3001 --env-file .env aura
# → http://localhost:3001  (SPA + API on one origin)
```

(`npm run docker:build` / `npm run docker:run` wrap the simple forms.)
