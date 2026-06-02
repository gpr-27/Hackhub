'use strict';

// Mounts every domain router under a single /api router.
const express = require('express');

const router = express.Router();

router.use('/', require('./system'));
router.use('/guest', require('./guest'));
router.use('/medications', require('./medications'));
router.use('/moods', require('./moods'));
router.use('/chat', require('./chat'));
router.use('/ai', require('./ai'));
router.use('/', require('./healthRecords'));

module.exports = router;
