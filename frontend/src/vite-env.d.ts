/// <reference types="vite/client" />

// Types the VITE_-prefixed environment variables the app reads (only through
// src/config/index.ts — see that module for validation). Keeping them here gives
// `import.meta.env.VITE_*` real types and editor autocomplete. Vars marked `?`
// are optional; the rest are required and validated at startup.
interface ImportMetaEnv {
  /** Backend origin for split local dev (Vite :5173 + API :3001). Unset in the
   *  single-origin deploy, where requests go same-origin to a relative /api. */
  readonly VITE_API_URL?: string;
  /** App environment label, e.g. "development" | "production". Required. */
  readonly VITE_APP_ENV: string;
  /** Clerk publishable key ("pk_test_…"/"pk_live_…"). Required. Must equal the
   *  backend's CLERK_PUBLISHABLE_KEY. */
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  /** LLM provider id, e.g. "groq". Required. */
  readonly VITE_LLM_PROVIDER: string;
  /** Default model id; must be one of VITE_AVAILABLE_MODELS. Required. */
  readonly VITE_DEFAULT_MODEL: string;
  /** Comma-separated "id" or "id:Human Label" model list. Required. */
  readonly VITE_AVAILABLE_MODELS: string;
  /** Optional Vite dev-server port (Vite default when unset). */
  readonly VITE_DEV_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
