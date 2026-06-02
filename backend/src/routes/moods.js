'use strict';

const express = require('express');
const { Mood } = require('../models');
const { authenticateUser } = require('../middleware/auth');
const { istNow } = require('../config/time');

const router = express.Router();

const inRange = (value) => value >= 1 && value <= 10;

router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const moods = await Mood.find({ userId: req.user._id }).sort({ date: -1, timestamp: -1 });
    res.json(moods);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateUser, async (req, res, next) => {
  try {
    const { mood, intensity, notes, emotionWords, aiInsights, date, timestamp, entryNumber } =
      req.body;

    if (!mood || !intensity || !date) {
      return res.status(400).json({ error: 'Mood, intensity, and date are required' });
    }
    if (!inRange(mood) || !inRange(intensity)) {
      return res.status(400).json({ error: 'Mood and intensity must be between 1 and 10' });
    }

    const entry = await Mood.create({
      mood,
      intensity,
      notes: notes || '',
      emotionWords: emotionWords || [],
      aiInsights: aiInsights || '',
      date,
      timestamp: timestamp ? new Date(timestamp) : istNow(),
      entryNumber: entryNumber || 1,
      userId: req.user._id,
    });

    res.json(entry);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateUser, async (req, res, next) => {
  try {
    const entry = await Mood.findById(req.params.id);
    if (!entry || entry.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    const { mood, intensity, notes, emotionWords, aiInsights } = req.body;
    if ((mood && !inRange(mood)) || (intensity && !inRange(intensity))) {
      return res.status(400).json({ error: 'Mood and intensity must be between 1 and 10' });
    }

    const update = {};
    if (mood !== undefined) update.mood = mood;
    if (intensity !== undefined) update.intensity = intensity;
    if (notes !== undefined) update.notes = notes;
    if (emotionWords !== undefined) update.emotionWords = emotionWords;
    if (aiInsights !== undefined) update.aiInsights = aiInsights;

    const updated = await Mood.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    const entry = await Mood.findById(req.params.id);
    if (!entry || entry.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }
    await Mood.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
