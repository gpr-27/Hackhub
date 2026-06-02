'use strict';

const express = require('express');
const {
  EmergencyContact,
  HealthProfile,
  MedicalHistory,
  LabReport,
  DoctorVisit,
  Prescription,
  VitalSigns,
} = require('../models');
const { authenticateUser } = require('../middleware/auth');
const { createOwnerCrudRouter } = require('./crudFactory');
const { istNow } = require('../config/time');

const router = express.Router();

// Standard user-owned collections share the CRUD factory.
router.use('/emergency-contacts', createOwnerCrudRouter(EmergencyContact, { label: 'Contact' }));
router.use('/medical-history', createOwnerCrudRouter(MedicalHistory, { label: 'Record' }));
router.use('/lab-reports', createOwnerCrudRouter(LabReport, { label: 'Report' }));
router.use('/doctor-visits', createOwnerCrudRouter(DoctorVisit, { label: 'Visit' }));
router.use('/prescriptions', createOwnerCrudRouter(Prescription, { label: 'Prescription' }));
router.use(
  '/vital-signs',
  createOwnerCrudRouter(VitalSigns, { sort: { date: -1, dateAdded: -1 }, label: 'Vital signs record' })
);

// Health profile is a per-user singleton (get + upsert), so it is handled directly.
router.get('/health-profile', authenticateUser, async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOne({ userId: req.user._id });
    res.json(profile || {});
  } catch (err) {
    next(err);
  }
});

router.post('/health-profile', authenticateUser, async (req, res, next) => {
  try {
    const existing = await HealthProfile.findOne({ userId: req.user._id });
    if (existing) {
      const updated = await HealthProfile.findByIdAndUpdate(
        existing._id,
        { ...req.body, userId: req.user._id, lastUpdated: istNow() },
        { new: true }
      );
      return res.json(updated);
    }
    const created = await HealthProfile.create({ ...req.body, userId: req.user._id });
    res.json(created);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
