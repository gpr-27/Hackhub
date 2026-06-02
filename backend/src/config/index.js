'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Centralized, validated configuration — the single source of truth for the
// backend. This is the ONLY backend module that reads process.env. Every other
// module imports this config object. Missing or invalid required values fail
// fast at startup with a clear, actionable error (no hidden fallbacks).
// ─────────────────────────────────────────────────────────────────────────────
// Load the single shared .env from the repository root (one level above
// backend/). Resolved from this file's location so it works regardless of the
// process working directory. In hosted deployments (no .env file) this loads
// nothing and the platform-provided environment variables are used.
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const env = process.env;

// Collect every problem and report them together, so a misconfigured
// environment surfaces all issues at once instead of one-at-a-time.
const errors = [];

const requireVar = (key) => {
  const value = env[key];
  if (value === undefined || String(value).trim() === '') {
    errors.push(`Missing ${key}`);
    return '';
  }
  return String(value).trim();
};

const requireInt = (key) => {
  const raw = requireVar(key);
  if (raw === '') return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 0 || String(n) !== raw) {
    errors.push(`Invalid ${key} (expected a non-negative integer, got "${raw}")`);
    return 0;
  }
  return n;
};

// Optional comma-separated list -> trimmed array (empty by default).
const parseList = (raw) =>
  String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// Derive a readable label from a model id when none is supplied in config,
// e.g. "llama-3.3-70b-versatile" -> "Llama 3.3 70B Versatile".
const humanizeModelId = (id) =>
  id
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((part) => (/^\d/.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');

// "id" or "id:Human Label", comma-separated. No model identifiers live in code;
// they come entirely from AVAILABLE_MODELS.
const parseModels = (raw) =>
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

// ─── Server ─────────────────────────────────────────────────────────────────
const nodeEnv = requireVar('NODE_ENV');
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';
const port = requireInt('PORT');
const clientUrl = requireVar('CLIENT_URL');
const logLevel = requireVar('LOG_LEVEL');

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];
if (logLevel && !LOG_LEVELS.includes(logLevel)) {
  errors.push(`Invalid LOG_LEVEL "${logLevel}" (expected one of: ${LOG_LEVELS.join(', ')})`);
}

// ─── Database ─────────────────────────────────────────────────────────────────
const mongoUri = requireVar('MONGODB_URI');

// ─── Auth (Clerk) ─────────────────────────────────────────────────────────────
// Identity is managed by Clerk. The backend verifies Clerk session tokens via
// @clerk/express; both keys are required for that verification.
const clerkSecretKey = requireVar('CLERK_SECRET_KEY');
const clerkPublishableKey = requireVar('CLERK_PUBLISHABLE_KEY');

// ─── LLM / Provider ─────────────────────────────────────────────────────────
const llmProvider = requireVar('LLM_PROVIDER');
const groqBaseUrl = requireVar('GROQ_BASE_URL');
const defaultModel = requireVar('DEFAULT_MODEL');
const availableModelsRaw = requireVar('AVAILABLE_MODELS');
const availableModels = availableModelsRaw ? parseModels(availableModelsRaw) : [];
const availableModelIds = availableModels.map((m) => m.id);

if (availableModelsRaw && availableModels.length === 0) {
  errors.push('AVAILABLE_MODELS did not contain any valid model ids');
}
if (defaultModel && availableModelIds.length && !availableModelIds.includes(defaultModel)) {
  errors.push(`DEFAULT_MODEL "${defaultModel}" is not present in AVAILABLE_MODELS`);
}

// GROQ_API_KEY is required only in production. In development/test the AI layer
// degrades to safe, built-in fallback replies (a documented product feature
// that also keeps the test-suite deterministic and offline dev working).
const groqApiKey = String(env.GROQ_API_KEY || '').trim();
const PLACEHOLDER_KEYS = new Set(['', 'your-groq-api-key', 'changeme', 'placeholder']);
const groqConfigured = !PLACEHOLDER_KEYS.has(groqApiKey) && groqApiKey.length > 10;
if (isProduction && !groqConfigured) {
  errors.push('Missing GROQ_API_KEY (required when NODE_ENV=production)');
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Fully env-driven. CLIENT_URL is always allowed; CORS_ORIGINS adds extra
// explicit origins; CORS_ALLOWED_ORIGIN_SUFFIXES allows wildcard hosts
// (e.g. ".netlify.app") without hardcoding any deployment domain in source.
const corsOrigins = parseList(env.CORS_ORIGINS);
const corsAllowedOriginSuffixes = parseList(env.CORS_ALLOWED_ORIGIN_SUFFIXES);

// ─── Fail fast ────────────────────────────────────────────────────────────────
if (errors.length) {
  // Printed unconditionally (not through the leveled logger): a fatal
  // misconfiguration must always be visible regardless of LOG_LEVEL.
  /* eslint-disable no-console */
  console.error('\n❌ Invalid configuration — the server cannot start:\n');
  errors.forEach((e) => console.error(`   ❌ ${e}`));
  console.error('\n   Set the missing values in backend/.env (see backend/.env.example).\n');
  /* eslint-enable no-console */
  throw new Error(`Invalid configuration: ${errors.join('; ')}`);
}

const config = {
  nodeEnv,
  isProduction,
  isTest,
  port,
  clientUrl,
  logLevel,

  mongoUri,

  clerk: {
    secretKey: clerkSecretKey,
    publishableKey: clerkPublishableKey,
  },

  corsOrigins,
  corsAllowedOriginSuffixes,

  // Provider-agnostic LLM configuration. Model identifiers and the provider name
  // come entirely from the environment.
  llm: {
    provider: llmProvider,
    defaultModel,
    availableModels, // [{ id, label }]
    availableModelIds, // [id]
  },

  // Groq (https://console.groq.com) — OpenAI-compatible inference API.
  groq: {
    apiKey: groqApiKey,
    baseUrl: groqBaseUrl,
    isConfigured: groqConfigured,
  },

  // Resolves a client-requested model id to a valid configured id, falling back
  // to DEFAULT_MODEL when the request is missing or not allow-listed.
  resolveModel(requested) {
    if (requested && availableModelIds.includes(requested)) return requested;
    return defaultModel;
  },
};

// Prints the startup diagnostics banner. Called from server.js after the DB
// connects (not at module load, so the test-suite stays quiet).
const logStartupConfig = ({ dbConnected = false } = {}) => {
  /* eslint-disable no-console */
  const rule = '=================================';
  console.log(rule);
  console.log(`NODE_ENV=${nodeEnv}`);
  console.log(`PORT=${port}`);
  console.log(`CLIENT_URL=${clientUrl}`);
  console.log(`LOG_LEVEL=${logLevel}`);
  console.log(`LLM_PROVIDER=${llmProvider}`);
  console.log(`DEFAULT_MODEL=${defaultModel}`);
  console.log(`AVAILABLE_MODELS=${availableModels.length}`);
  if (dbConnected) console.log('MongoDB Connected ✓');
  const providerLabel = llmProvider.charAt(0).toUpperCase() + llmProvider.slice(1);
  console.log(
    `${providerLabel} Config Loaded ${groqConfigured ? '✓' : '(fallback mode — GROQ_API_KEY not set)'}`
  );
  console.log(rule);
  /* eslint-enable no-console */
};

config.logStartupConfig = logStartupConfig;

module.exports = config;
