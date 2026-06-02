'use strict';

const express = require('express');
const { authenticateUser } = require('../middleware/auth');

// Drops empty-string values from a payload so Mongoose schema defaults (and enum
// constraints) apply cleanly — e.g. an unselected `status` dropdown sends "",
// which would otherwise fail enum validation. Keeps 0/false/empty arrays intact.
const stripEmpty = (obj = {}) => {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') continue;
    out[key] = value;
  }
  return out;
};

// Builds a router exposing list/create/update/delete for a user-owned collection.
// Every operation is scoped to req.user._id, so users can only touch their own
// documents. Used by the Smart Health Record domains that share this shape.
const createOwnerCrudRouter = (Model, { sort = { dateAdded: -1 }, label = 'Record' } = {}) => {
  const router = express.Router();

  router.get('/', authenticateUser, async (req, res, next) => {
    try {
      const docs = await Model.find({ userId: req.user._id }).sort(sort);
      res.json(docs);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', authenticateUser, async (req, res, next) => {
    try {
      const doc = await Model.create({ ...stripEmpty(req.body), userId: req.user._id });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', authenticateUser, async (req, res, next) => {
    try {
      const existing = await Model.findById(req.params.id);
      if (!existing || existing.userId.toString() !== req.user._id.toString()) {
        return res.status(404).json({ error: `${label} not found` });
      }
      const updated = await Model.findByIdAndUpdate(
        req.params.id,
        { ...stripEmpty(req.body), userId: req.user._id },
        { new: true }
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', authenticateUser, async (req, res, next) => {
    try {
      const existing = await Model.findById(req.params.id);
      if (!existing || existing.userId.toString() !== req.user._id.toString()) {
        return res.status(404).json({ error: `${label} not found` });
      }
      await Model.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
};

module.exports = { createOwnerCrudRouter };
