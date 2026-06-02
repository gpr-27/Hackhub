'use strict';

// The "Smart Health Record" domain: a set of user-owned medical record types.
// Grouped together because they share the same ownership/CRUD shape.
const mongoose = require('mongoose');

// Owner's Clerk user id (e.g. "user_xxx"). Identity is managed by Clerk.
const ownerRef = {
  type: String,
  required: true,
  index: true,
};

const emergencyContactSchema = new mongoose.Schema({
  userId: ownerRef,
  name: { type: String, required: true },
  relationship: String,
  phone: { type: String, required: true },
  type: {
    type: String,
    enum: ['family', 'medical', 'friend', 'work'],
    default: 'family',
  },
  dateAdded: { type: Date, default: Date.now },
});

const healthProfileSchema = new mongoose.Schema({
  userId: ownerRef,
  dateOfBirth: String,
  gender: String,
  bloodType: String,
  height: String,
  weight: String,
  allergies: [String],
  chronicConditions: [String],
  emergencyContact: String,
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
  },
  lastUpdated: { type: Date, default: Date.now },
});

const medicalHistorySchema = new mongoose.Schema({
  userId: ownerRef,
  condition: { type: String, required: true },
  diagnosisDate: String,
  doctor: String,
  treatment: String,
  status: {
    type: String,
    enum: ['active', 'resolved', 'chronic'],
    default: 'active',
  },
  notes: String,
  dateAdded: { type: Date, default: Date.now },
});

const labReportSchema = new mongoose.Schema({
  userId: ownerRef,
  testName: { type: String, required: true },
  testDate: String,
  doctor: String,
  results: String,
  normalRange: String,
  status: {
    type: String,
    enum: ['normal', 'abnormal', 'pending'],
    default: 'pending',
  },
  notes: String,
  dateAdded: { type: Date, default: Date.now },
});

const doctorVisitSchema = new mongoose.Schema({
  userId: ownerRef,
  doctorName: { type: String, required: true },
  specialty: String,
  visitDate: String,
  visitType: {
    type: String,
    enum: ['routine', 'emergency', 'follow-up', 'consultation', 'specialist'],
    default: 'routine',
  },
  status: {
    type: String,
    enum: ['completed', 'scheduled', 'cancelled', 'rescheduled'],
    default: 'completed',
  },
  symptoms: String,
  diagnosis: String,
  treatment: String,
  nextAppointment: String,
  notes: String,
  dateAdded: { type: Date, default: Date.now },
});

const prescriptionSchema = new mongoose.Schema({
  userId: ownerRef,
  medicationName: { type: String, required: true },
  dosage: String,
  frequency: String,
  duration: String,
  prescribedBy: String,
  prescriptionDate: String,
  instructions: String,
  refillsRemaining: Number,
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued'],
    default: 'active',
  },
  dateAdded: { type: Date, default: Date.now },
});

const vitalSignsSchema = new mongoose.Schema({
  userId: ownerRef,
  date: { type: String, required: true },
  heartRate: Number,
  systolicBP: Number,
  diastolicBP: Number,
  temperature: Number,
  weight: Number,
  height: Number,
  bloodGlucose: Number,
  oxygenSaturation: Number,
  respiratoryRate: Number,
  status: {
    type: String,
    enum: ['normal', 'abnormal'],
    default: 'normal',
  },
  notes: String,
  dateAdded: { type: Date, default: Date.now },
});

module.exports = {
  EmergencyContact: mongoose.model('EmergencyContact', emergencyContactSchema),
  HealthProfile: mongoose.model('HealthProfile', healthProfileSchema),
  MedicalHistory: mongoose.model('MedicalHistory', medicalHistorySchema),
  LabReport: mongoose.model('LabReport', labReportSchema),
  DoctorVisit: mongoose.model('DoctorVisit', doctorVisitSchema),
  Prescription: mongoose.model('Prescription', prescriptionSchema),
  VitalSigns: mongoose.model('VitalSigns', vitalSignsSchema),
};
