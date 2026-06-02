'use strict';

const express = require('express');
const config = require('../config');
const logger = require('../config/logger');
const { authenticateUser } = require('../middleware/auth');
const { generateChatReply, generateMoodInsights } = require('../services/groq');

const router = express.Router();

// Exposes the provider + configured model list so clients can populate a model
// selector dynamically. No secrets are returned (the API key is never included).
router.get('/models', (req, res) => {
  res.json({
    provider: config.llm.provider,
    defaultModel: config.llm.defaultModel,
    models: config.llm.availableModels,
  });
});

// Single AI entry point used by both Health Chat and the Mood Tracker.
// mode 'mood' analyses a mood entry; any other mode is a conversational reply.
// An optional `model` (allow-listed against AVAILABLE_MODELS) selects the model.
router.post('/chat', authenticateUser, async (req, res, next) => {
  try {
    const { mode, message, moodData, model } = req.body || {};
    logger.debug(`[ai] chat request mode=${mode || 'therapy'} model=${model || '(default)'}`);

    if (mode === 'mood') {
      if (!moodData) {
        return res.status(400).json({ error: 'moodData is required for mood analysis' });
      }
      const result = await generateMoodInsights(moodData, model);
      return res.json(result);
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    const result = await generateChatReply(message.trim(), mode || 'therapy', model);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
