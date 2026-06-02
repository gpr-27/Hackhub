# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Single production image for Aura — Mental Wellness.
#
# It builds the React (Vite) SPA, then runs the Express API which ALSO serves
# that SPA from the same origin: one server, one URL, no CORS. This is the image
# a single Render web service runs (see render.yaml).
#
# Build context is the repository ROOT (so both ./frontend and ./backend are
# visible). Real secrets are NEVER consumed here — only the PUBLIC VITE_* values
# the browser bundle needs are passed as build args. The runtime secrets
# (MONGODB_URI, CLERK_SECRET_KEY, GROQ_API_KEY) are injected by the platform at
# run time and never enter an image layer.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build the frontend bundle ──────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /frontend

# Vite inlines VITE_-prefixed vars at build time. Render injects the service's
# environment variables as build args, so we accept the (non-prefixed) config
# values here and map them to the VITE_ names the bundle expects — keeping a
# SINGLE source of truth for each value across the backend and the frontend.
# Only public values belong here; the Clerk *publishable* key is public by
# design. VITE_API_URL is intentionally omitted: the SPA talks to the API
# same-origin (relative /api), because the server in stage 3 serves this bundle.
ARG VITE_APP_ENV=production
ARG LLM_PROVIDER=groq
ARG DEFAULT_MODEL
ARG AVAILABLE_MODELS
ARG CLERK_PUBLISHABLE_KEY
ENV VITE_APP_ENV=$VITE_APP_ENV \
    VITE_LLM_PROVIDER=$LLM_PROVIDER \
    VITE_DEFAULT_MODEL=$DEFAULT_MODEL \
    VITE_AVAILABLE_MODELS=$AVAILABLE_MODELS \
    VITE_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY

# Install deps first (cached unless the manifests change), then build.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build   # → /frontend/build (Vite build.outDir)

# ── Stage 2: install backend production dependencies ─────────────────────────
FROM node:22-alpine AS backend-deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
# Deterministic, production-only install from the committed lockfile.
RUN npm ci --omit=dev

# ── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

# tini becomes PID 1 so SIGTERM/SIGINT reach node (enabling the graceful
# shutdown in server.js) and zombies are reaped — node as PID 1 does neither.
RUN apk add --no-cache tini

# NODE_ENV=production hardens Express; STATIC_DIR tells the API where the SPA
# lives so it serves it (see config.staticDir / app.js).
ENV NODE_ENV=production \
    STATIC_DIR=/app/public

WORKDIR /app

# Run as an unprivileged user.
RUN addgroup -S app && adduser -S -G app app

# Backend production node_modules, then the backend source, then the built SPA.
COPY --from=backend-deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app backend/ ./
COPY --from=frontend --chown=app:app /frontend/build ./public

USER app

# Documentational only — the real port comes from the PORT env var (Render and
# most hosts inject it; config.port reads it). Defaults to 3001 locally.
EXPOSE 3001

# Liveness probe via the app's own /api/health (which does not depend on the DB).
# Uses node's http client because alpine ships no curl/wget; honours PORT.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
