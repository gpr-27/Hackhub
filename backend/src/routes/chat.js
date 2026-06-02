'use strict';

const express = require('express');
const { ChatSession } = require('../models');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Every chat route is scoped to the authenticated Clerk user.
router.use(authenticateUser);

const TITLE_MAX = 48;

// Derive a concise session title from a message (a summary of what the user typed).
const summarizeTitle = (text = '') => {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (!clean) return 'New chat';
  return clean.length > TITLE_MAX ? `${clean.slice(0, TITLE_MAX).trimEnd()}…` : clean;
};

// Loads a session and asserts ownership; returns null + sends 404 otherwise.
const findOwned = async (req, res) => {
  let session = null;
  try {
    session = await ChatSession.findById(req.params.id);
  } catch (_) {
    session = null;
  }
  if (!session || session.userId !== req.user.id) {
    res.status(404).json({ error: 'Chat not found' });
    return null;
  }
  return session;
};

// List the user's saved chats (lightweight — titles + counts, no message bodies).
router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt messages')
      .lean();
    res.json(
      sessions.map((s) => ({
        _id: s._id,
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: Array.isArray(s.messages) ? s.messages.length : 0,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Create a new saved chat (optionally seeded with a title and messages).
router.post('/sessions', async (req, res, next) => {
  try {
    const { title, messages } = req.body || {};
    const session = await ChatSession.create({
      userId: req.user.id,
      title: title ? summarizeTitle(title) : 'New chat',
      messages: Array.isArray(messages) ? messages : [],
    });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

// Clear ALL saved chats for the user.
router.delete('/sessions', async (req, res, next) => {
  try {
    const { deletedCount } = await ChatSession.deleteMany({ userId: req.user.id });
    res.json({ success: true, deletedCount });
  } catch (err) {
    next(err);
  }
});

// Load one full saved chat (with messages).
router.get('/sessions/:id', async (req, res, next) => {
  try {
    const session = await findOwned(req, res);
    if (session) res.json(session);
  } catch (err) {
    next(err);
  }
});

// Update a saved chat: rename (title) and/or replace its messages. Called after
// each turn and on regenerate. With autoTitle, derives the title from the first
// user message when it is still the default.
router.put('/sessions/:id', async (req, res, next) => {
  try {
    const session = await findOwned(req, res);
    if (!session) return;

    const { title, messages, autoTitle } = req.body || {};
    if (typeof title === 'string') {
      session.title = summarizeTitle(title);
    }
    if (Array.isArray(messages)) {
      session.messages = messages;
      if (autoTitle && (!session.title || session.title === 'New chat')) {
        const firstUser = messages.find((m) => m && m.sender === 'user');
        if (firstUser) session.title = summarizeTitle(firstUser.message);
      }
    }
    session.updatedAt = new Date();
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
});

// Delete one saved chat.
router.delete('/sessions/:id', async (req, res, next) => {
  try {
    const session = await findOwned(req, res);
    if (!session) return;
    await ChatSession.deleteOne({ _id: session._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
