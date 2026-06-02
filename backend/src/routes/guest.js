'use strict';

const express = require('express');
const crypto = require('crypto');
const models = require('../models');
const { GuestUser } = models;
const { authenticateUser } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Every model that owns user data (has a `userId` path). Used by migration so
// new owned collections are picked up automatically.
const ownedModels = () =>
  Object.values(models).filter((M) => M && M.schema && M.schema.path('userId'));

// Create a new anonymous guest. Returns the public guest identity (no secrets).
router.post('/', async (req, res, next) => {
  try {
    const guestId = `guest_${crypto.randomUUID()}`;
    const guest = await GuestUser.create({ guestId });
    logger.info(`[guest] created ${guestId}`);
    res.json({
      guestId: guest.guestId,
      isGuest: true,
      displayName: guest.displayName,
      createdAt: guest.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// Migrate all data owned by a guest to the signed-in Clerk user, then remove the
// guest record. Must be called while authenticated as a real (non-guest) account.
router.post('/migrate', authenticateUser, async (req, res, next) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ error: 'Sign in to a real account before migrating guest data' });
    }
    const { guestId } = req.body || {};
    if (!guestId || !/^guest_/.test(guestId)) {
      return res.status(400).json({ error: 'A valid guestId is required' });
    }
    const guest = await GuestUser.findOne({ guestId });
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    const targetId = req.user.id;
    const migrated = {};
    for (const Model of ownedModels()) {
      const result = await Model.updateMany({ userId: guestId }, { $set: { userId: targetId } });
      if (result.modifiedCount) migrated[Model.modelName] = result.modifiedCount;
    }
    await GuestUser.deleteOne({ guestId });

    logger.info(`[guest] migrated ${guestId} → ${targetId}: ${JSON.stringify(migrated)}`);
    res.json({ success: true, migrated });
  } catch (err) {
    next(err);
  }
});

// Restore a guest session by id (used on app startup). Bumps activity.
router.get('/:guestId', async (req, res, next) => {
  try {
    const guest = await GuestUser.findOneAndUpdate(
      { guestId: req.params.guestId },
      { $set: { lastActiveAt: new Date() } },
      { new: true }
    );
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.json({
      guestId: guest.guestId,
      isGuest: true,
      displayName: guest.displayName,
      createdAt: guest.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
