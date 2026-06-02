# Deployment Guide

The app has two independently deployed pieces:

1. **Frontend** (`frontend/`) — static React + Vite build, hosted on Netlify.
2. **Backend** (`backend/`) — Node/Express API, hosted on a Node platform
   (Render, Railway, Fly.io, etc.) with a MongoDB database.

All configuration comes from environment variables; nothing environment-specific
is hardcoded. Both apps **fail fast at startup** with a clear error if a required
variable is missing.

---

## 1. Backend (Render / Railway / any Node host)

**Root directory:** `backend`
**Build command:** `npm install`
**Start command:** `npm start`

Locally, all variables live in a single shared `.env` at the repository root (see
`.env.example`). In hosted deployments there is no `.env` file — set these
variables in the platform's dashboard instead. Backend variables (all required
unless noted):

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` |
| `PORT` | yes | Most hosts inject this automatically |
| `CLIENT_URL` | yes | Frontend origin (your Netlify URL); always CORS-allowed |
| `LOG_LEVEL` | yes | `error` \| `warn` \| `info` \| `debug` |
| `MONGODB_URI` | yes | MongoDB connection string (include a db name, e.g. `/healthcareDB`) |
| `CLERK_SECRET_KEY` | yes | Clerk secret key (dashboard.clerk.com → API keys) |
| `CLERK_PUBLISHABLE_KEY` | yes | Clerk publishable key (must match the frontend) |
| `LLM_PROVIDER` | yes | e.g. `groq` |
| `GROQ_BASE_URL` | yes | e.g. `https://api.groq.com/openai/v1` |
| `DEFAULT_MODEL` | yes | Must be one of `AVAILABLE_MODELS` |
| `AVAILABLE_MODELS` | yes | `id` or `id:Label`, comma-separated |
| `GROQ_API_KEY` | yes (prod) | Required when `NODE_ENV=production`; else AI uses fallbacks |
| `CORS_ORIGINS` | no | Comma-separated extra origins |
| `CORS_ALLOWED_ORIGIN_SUFFIXES` | no | Wildcard host suffixes, e.g. `.netlify.app` |

> In production the server refuses to start if any required variable is missing,
> printing a `❌ Missing <VAR>` report and exiting.

Note the deployed backend URL (e.g. `https://your-backend.onrender.com`).

## 2. Frontend (Netlify)

`netlify.toml` is already configured:

- **Base directory:** `frontend`
- **Build command:** `npm run build` (runs `vite build`)
- **Publish directory:** `frontend/build` (Vite `build.outDir` is set to `build`)
- **Node version:** 22 (Vite 8 requirement)
- SPA redirect to `index.html` is included (`public/_redirects`).

**Environment variables to set in the Netlify UI** (all required — Vite inlines
them at build time, so trigger a redeploy after changing any):

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | The backend URL from step 1 |
| `VITE_APP_ENV` | `production` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (must match the backend) |
| `VITE_LLM_PROVIDER` | Must match the backend's `LLM_PROVIDER` |
| `VITE_DEFAULT_MODEL` | Default model id (one of `VITE_AVAILABLE_MODELS`) |
| `VITE_AVAILABLE_MODELS` | `id` or `id:Label`, comma-separated (populates the selector) |

## 3. Connect the two

1. Set `VITE_API_URL` (and the other `VITE_*` vars) on Netlify to match the backend.
2. Set the backend's `CLIENT_URL` to the Netlify site URL. To allow preview
   deploys, add `CORS_ALLOWED_ORIGIN_SUFFIXES=.netlify.app` (and/or list specific
   origins in `CORS_ORIGINS`).
3. Redeploy both. Verify the backend health check at
   `https://your-backend-url/api/health`.

## Local production-style check

```bash
# Backend
cd backend && NODE_ENV=production PORT=3001 CLIENT_URL="https://your-site.netlify.app" \
  LOG_LEVEL=info MONGODB_URI="<uri>" CLERK_SECRET_KEY="<sk>" CLERK_PUBLISHABLE_KEY="<pk>" \
  LLM_PROVIDER=groq GROQ_BASE_URL="https://api.groq.com/openai/v1" \
  GROQ_API_KEY="<key>" DEFAULT_MODEL="<model-id>" \
  AVAILABLE_MODELS="<id1>,<id2>" npm start

# Frontend (these can also live in the single root .env)
cd frontend && VITE_API_URL="http://localhost:3001" VITE_APP_ENV=production \
  VITE_CLERK_PUBLISHABLE_KEY="<pk>" VITE_LLM_PROVIDER=groq VITE_DEFAULT_MODEL="<model-id>" \
  VITE_AVAILABLE_MODELS="<id1>,<id2>" npm run build
```
