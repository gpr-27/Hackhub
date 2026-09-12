'use strict';

// Mounts every domain router under a single /api router.
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// System (health/ready) and AI endpoints work independently of MongoDB
router.use('/', require('./system'));
router.use('/ai', require('./ai'));

// Guard DB-dependent routes when database is not connected
const requireDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database unavailable. Please verify MONGODB_URI in Render dashboard or check MongoDB Atlas status.',
    });
  }
  next();
};

router.use('/guest', requireDb, require('./guest'));
router.use('/medications', requireDb, require('./medications'));
router.use('/moods', requireDb, require('./moods'));
router.use('/chat', requireDb, require('./chat'));
router.use('/', requireDb, require('./healthRecords'));

module.exports = router;
