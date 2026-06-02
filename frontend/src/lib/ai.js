// Thin client for the backend AI endpoint (provider-powered, /api/ai/chat).
// The backend keeps the API key secret and always returns a usable reply
// (falling back to safe canned guidance when the provider is unconfigured).
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';

/**
 * Send a conversational message.
 * @param {string} message
 * @param {'therapy'|'meditation'|'crisis'|'wellness'} mode
 * @param {string} [model] - optional model id (allow-listed server-side)
 * @returns {Promise<{text: string, fallback: boolean, model: string|null}>}
 */
export async function sendChat(message, mode = 'therapy', model) {
  const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    body: JSON.stringify({ mode, message, ...(model ? { model } : {}) }),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  return res.json();
}

/**
 * Ask the AI to analyse a mood entry. Returns structured-ish insight text.
 * @param {object} moodData
 * @param {string} [model] - optional model id (allow-listed server-side)
 * @returns {Promise<{text: string, fallback: boolean, model: string|null}>}
 */
export async function analyzeMood(moodData, model) {
  const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    body: JSON.stringify({ mode: 'mood', moodData, ...(model ? { model } : {}) }),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  return res.json();
}

const aiClient = { sendChat, analyzeMood };
export default aiClient;
