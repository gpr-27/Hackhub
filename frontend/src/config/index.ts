// ─────────────────────────────────────────────────────────────────────────────
// Centralized, validated frontend configuration.
// This is the ONLY module in the frontend that reads import.meta.env. Every
// other module imports this config. Missing required values throw immediately
// with a clear message (surfaced by the Vite error overlay in dev).
// ─────────────────────────────────────────────────────────────────────────────

export interface ModelOption {
  id: string;
  label: string;
}

const env = import.meta.env as unknown as Record<string, string | undefined>;

const required = (key: string): string => {
  const value = env[key];
  if (value === undefined || String(value).trim() === '') {
    throw new Error(`[config] Missing required environment variable: ${key}`);
  }
  return String(value).trim();
};

// Derive a readable label from a model id when none is supplied,
// e.g. "llama-3.3-70b-versatile" -> "Llama 3.3 70B Versatile".
const humanizeModelId = (id: string): string =>
  id
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((part) => (/^\d/.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');

// "id" or "id:Human Label", comma-separated. No model identifiers live in code;
// they come entirely from VITE_AVAILABLE_MODELS.
const parseModels = (raw: string): ModelOption[] =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(':');
      const id = (idx === -1 ? entry : entry.slice(0, idx)).trim();
      const label = idx === -1 ? '' : entry.slice(idx + 1).trim();
      return { id, label: label || humanizeModelId(id) };
    })
    .filter((m) => m.id);

const availableModels = parseModels(required('VITE_AVAILABLE_MODELS'));
if (availableModels.length === 0) {
  throw new Error('[config] VITE_AVAILABLE_MODELS did not contain any valid model ids');
}

const defaultModel = required('VITE_DEFAULT_MODEL');
if (!availableModels.some((m) => m.id === defaultModel)) {
  throw new Error(
    `[config] VITE_DEFAULT_MODEL "${defaultModel}" is not present in VITE_AVAILABLE_MODELS`
  );
}

const provider = required('VITE_LLM_PROVIDER');
// Display label for the provider, derived from config (no provider name is
// hardcoded in components). e.g. "groq" -> "Groq".
const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);

// Clerk (auth) publishable key. Validated here for fail-fast; <ClerkProvider>
// reads VITE_CLERK_PUBLISHABLE_KEY from the environment itself, so we never pass
// it as a prop.
required('VITE_CLERK_PUBLISHABLE_KEY');

export interface AppConfig {
  apiUrl: string;
  appEnv: string;
  llm: {
    provider: string;
    providerLabel: string;
    defaultModel: string;
    availableModels: ModelOption[];
  };
}

export const config: AppConfig = {
  // Trailing slash trimmed so callers can safely template `${apiUrl}/api/...`.
  apiUrl: required('VITE_API_URL').replace(/\/+$/, ''),
  appEnv: required('VITE_APP_ENV'),
  llm: {
    provider,
    providerLabel,
    defaultModel,
    availableModels,
  },
};

export default config;
