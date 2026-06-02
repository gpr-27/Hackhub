'use strict';

const express = require('express');
const { Medication } = require('../models');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();
const MED_FIELDS = ['name', 'time', 'dosage', 'tillDate'];

const pickMedFields = (body) =>
  MED_FIELDS.reduce((acc, field) => {
    acc[field] = body[field];
    return acc;
  }, {});

router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const meds = await Medication.find({ userId: req.user._id });
    res.json(meds);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateUser, async (req, res, next) => {
  try {
    const med = await Medication.create({ ...pickMedFields(req.body), userId: req.user._id });
    res.json(med);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateUser, async (req, res, next) => {
  try {
    const med = await Medication.findById(req.params.id);
    if (!med || med.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    const updated = await Medication.findByIdAndUpdate(req.params.id, pickMedFields(req.body), {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    const med = await Medication.findById(req.params.id);
    if (!med || med.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    await Medication.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
