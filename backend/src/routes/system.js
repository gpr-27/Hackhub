'use strict';

const express = require('express');
const mongoose = require('mongoose');
const config = require('../config');

const router = express.Router();

// Maps mongoose's connection.readyState codes to readable strings.
const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];
const dbState = () => {
  const code = mongoose.connection.readyState;
  return { readyState: code, status: DB_STATES[code] || 'unknown' };
};

// Liveness probe. Reports that the process is up; deliberately does NOT depend on
// the database, so a transient DB blip never causes orchestrators to kill an
// otherwise-healthy process (use /ready for DB-gated readiness). Reports whether
// the AI key is configured (boolean only, never the key itself) plus
// non-sensitive provider/model metadata.
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    uptime: process.uptime(),
    db: dbState(),
    aiConfigured: config.groq.isConfigured,
    provider: config.llm.provider,
    defaultModel: config.llm.defaultModel,
    availableModels: config.llm.availableModelIds.length,
  });
});

// Readiness probe. Returns 200 only when the database connection is live, else
// 503 — so an orchestrator/load balancer routes traffic only to instances that
// can actually serve requests.
router.get('/ready', (req, res) => {
  const db = dbState();
  const ready = db.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, db });
});

module.exports = router;
