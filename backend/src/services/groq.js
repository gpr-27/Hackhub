'use strict';

// Server-side AI client for Groq (OpenAI-compatible chat completions API).
// Running this on the backend keeps the API key secret and avoids the CORS
// restrictions that block browser calls to api.groq.com. When no key is
// configured, every entry point degrades to a helpful, hard-coded fallback so
// the product keeps working with zero errors.
const config = require('../config');
const logger = require('../config/logger');

const REQUEST_TIMEOUT_MS = 20000;

const BASE_PERSONA = `You are MediBot, a warm, caring mental health assistant. Speak naturally and calmly, like you're having a real one-on-one conversation with someone who trusts you.

IMPORTANT FORMATTING RULES:
- Always use bullet points for tips and suggestions
- Keep paragraphs short (1-2 sentences max)
- Use line breaks between different ideas

Stay focused on the user's mental and emotional well-being. Use a soft, friendly, empathetic tone. Share simple suggestions as bullet points and ask at most one gentle follow-up question. Do not include disclaimers like "I'm just an AI", but always encourage seeing a therapist when appropriate.`;

const MODE_PERSONA = {
  therapy:
    'Provide empathetic, brief therapeutic responses. Focus on emotional support and 2-3 practical coping strategies.',
  meditation:
    'Guide the user through a specific meditation or breathing exercise. Keep instructions clear and concise.',
  crisis:
    'Provide immediate, compassionate support. For any crisis situation, emphasize professional help and crisis hotlines.',
  wellness:
    'Give motivational wellness tips. Provide 2-3 actionable lifestyle suggestions.',
};

const RESPONSE_GUIDELINES = `RESPONSE GUIDELINES:
- Keep responses under 250 words
- ALWAYS use bullet points for tips and suggestions
- Use short paragraphs (2-3 sentences maximum)
- Ask ONE follow-up question maximum
- For serious concerns, recommend professional help
- Stay focused on mental wellness topics; politely redirect off-topic questions`;

const buildChatMessages = (message, mode = 'therapy') => {
  const persona = MODE_PERSONA[mode] || MODE_PERSONA.therapy;
  const system = `${BASE_PERSONA}\n\n${persona}\n\n${RESPONSE_GUIDELINES}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: message },
  ];
};

const buildMoodMessages = (moodData = {}) => {
  const {
    moodLabel = 'Neutral',
    mood = 5,
    intensity = 5,
    notes = '',
    emotionWords = [],
    entryNumber = 1,
  } = moodData;

  const system =
    'You are a warm, supportive mental wellness analyst. Be empathetic, concise, and practical.';
  const user = `Analyze this mood entry briefly:

MOOD: ${moodLabel} (${mood}/10), Intensity: ${intensity}/10
NOTES: "${notes || 'No details'}"
EMOTIONS: ${emotionWords.length > 0 ? emotionWords.join(', ') : 'None'}
ENTRY: #${entryNumber} today

Respond in exactly 5 sections, each maximum 2 lines:
1. Acknowledge their emotional state with side heading "💙 Mood Validation"
2. Insight about their mood pattern with side heading "🔍 Pattern Recognition"
3. Personal understanding with side heading "💡 Personal Understanding"
4. One practical recommendation with side heading "🌟 Recommendations"
5. Encouraging message with side heading "🌟 Encouragement"

No formatting like ** or *. Plain text only. Be warm and supportive.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
};

const FALLBACK_CHAT = {
  therapy: `I'm really glad you reached out. I'm here with you.

• Take a slow breath — in for 4, out for 6
• Name one feeling you're noticing right now
• Be as kind to yourself as you'd be to a friend

What feels heaviest for you at the moment?`,
  meditation: `Let's take a calm minute together.

• Sit comfortably and soften your shoulders
• Breathe in for 4, hold for 4, out for 4 (box breathing)
• Repeat 4 rounds, letting each exhale release tension

How does your body feel after that?`,
  crisis: `You matter, and you don't have to face this alone.

• If you're in immediate danger, please contact local emergency services now
• Reach a trained counselor any time — in the US call or text 988
• Stay with someone you trust if you can

Would you like help finding a support line near you?`,
  wellness: `Small steps add up to real change.

• Drink a glass of water and step outside for a few minutes
• Move your body — even a 10-minute walk lifts mood
• Write down one thing you're grateful for today

Which of these feels easiest to start with?`,
};

const fallbackChat = (mode) => FALLBACK_CHAT[mode] || FALLBACK_CHAT.therapy;

const fallbackMood = (moodData = {}) => {
  const label = moodData.moodLabel || 'what you described';
  return `💙 Mood Validation
It's completely okay to feel ${String(label).toLowerCase()} right now. Your feelings are valid.

🔍 Pattern Recognition
Noticing and recording your mood is a meaningful step toward understanding yourself.

💡 Personal Understanding
Every entry helps you see what lifts you up and what weighs you down over time.

🌟 Recommendations
Try one small kind act for yourself today — a short walk, water, or a slow breath.

🌟 Encouragement
You're showing real strength by checking in with yourself. Keep going.`;
};

// One chat-completions request against a single model. Throws on any failure
// (network, timeout, non-2xx, empty reply) so the caller can try the next model.
// Reasoning models spend part of max_tokens on hidden reasoning, so an empty
// `content` (finish_reason "length") is treated as a failure, not a reply.
const requestModel = async (resolvedModel, messages, { maxTokens, temperature }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = `${config.groq.baseUrl}/chat/completions`;

  logger.debug(`[llm] request → provider=${config.llm.provider} model=${resolvedModel} url=${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.groq.apiKey}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Provider API error ${response.status}: ${detail.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('Provider API returned an empty response');
    }
    logger.debug(`[llm] response ← model=${resolvedModel} chars=${text.length}`);
    return text;
  } finally {
    clearTimeout(timeout);
  }
};

// The ordered, de-duplicated list of models to try: the requested model
// (allow-listed via AVAILABLE_MODELS, else DEFAULT_MODEL), then FALLBACK_MODEL,
// then DEFAULT_MODEL — so the fallback also covers a user who picked the
// fallback model themselves. No model identifier is ever hardcoded here.
const buildModelChain = (requested) => {
  const primary = config.resolveModel(requested);
  if (requested && requested !== primary) {
    logger.warn(`[llm] requested model "${requested}" is not allow-listed; using "${primary}"`);
  }
  return [...new Set([primary, config.llm.fallbackModel, config.llm.defaultModel].filter(Boolean))];
};

// Calls the provider, falling back through the model chain on failure.
// Returns the assistant text and the model that actually produced it.
const callGroq = async (messages, { maxTokens = 1024, temperature = 0.7, model } = {}) => {
  const chain = buildModelChain(model);
  let lastError;

  for (const candidate of chain) {
    try {
      const text = await requestModel(candidate, messages, { maxTokens, temperature });
      return { text, model: candidate };
    } catch (err) {
      lastError = err;
      const reason = err.name === 'AbortError' ? 'request timed out' : err.message;
      const next = chain[chain.indexOf(candidate) + 1];
      logger.warn(
        `[llm] model "${candidate}" failed (${reason})` +
          (next ? `; falling back to "${next}"` : '; no more models to try')
      );
    }
  }
  throw lastError;
};

// Generates a chat reply. Never throws — returns a fallback on any failure.
const generateChatReply = async (message, mode = 'therapy', model) => {
  if (!config.groq.isConfigured) {
    return { text: fallbackChat(mode), fallback: true, model: null };
  }
  try {
    const { text, model: usedModel } = await callGroq(buildChatMessages(message, mode), { model });
    return { text, fallback: false, model: usedModel };
  } catch (err) {
    logger.error('[llm] chat generation failed:', err.message);
    return { text: fallbackChat(mode), fallback: true, model: null };
  }
};

// Generates structured mood insights. Never throws — returns a fallback on failure.
const generateMoodInsights = async (moodData, model) => {
  if (!config.groq.isConfigured) {
    return { text: fallbackMood(moodData), fallback: true, model: null };
  }
  try {
    const { text, model: usedModel } = await callGroq(buildMoodMessages(moodData), {
      maxTokens: 800,
      model,
    });
    return { text, fallback: false, model: usedModel };
  } catch (err) {
    logger.error('[llm] mood insight generation failed:', err.message);
    return { text: fallbackMood(moodData), fallback: true, model: null };
  }
};

module.exports = {
  generateChatReply,
  generateMoodInsights,
  // Exposed for unit tests.
  _internal: { buildChatMessages, buildMoodMessages, fallbackChat, fallbackMood, buildModelChain },
};
