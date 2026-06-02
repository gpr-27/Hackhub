'use strict';

const express = require('express');
const config = require('../config');

const router = express.Router();

// Health/readiness probe. Reports whether the AI key is configured (boolean
// only, never the key itself) plus non-sensitive provider/model metadata.
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    aiConfigured: config.groq.isConfigured,
    provider: config.llm.provider,
    defaultModel: config.llm.defaultModel,
    availableModels: config.llm.availableModelIds.length,
  });
});

module.exports = router;
