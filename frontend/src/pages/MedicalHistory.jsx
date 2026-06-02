import React from 'react';
import { HeartPulse } from 'lucide-react';
import AppShell from '../components/AppShell';
import RecordManager from '../components/RecordManager';

const CONFIG = {
  endpoint: '/api/medical-history',
  backTo: '/smart-health-record',
  eyebrow: 'Health Records',
  title: 'Medical History',
  subtitle: 'A timeline of your conditions, diagnoses, and treatments.',
  icon: HeartPulse,
  noun: 'Condition',
  pluralNoun: 'Conditions',
  titleField: 'condition',
  subtitleField: 'doctor',
  badge: { field: 'status', tones: { active: 'warning', chronic: 'info', resolved: 'success' } },
  search: ['condition', 'doctor', 'treatment', 'notes'],
  cardFields: ['diagnosisDate', 'treatment', 'notes'],
  fields: [
    { name: 'condition', label: 'Condition', type: 'text', required: true, placeholder: 'e.g. Hypertension' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'chronic', 'resolved'], half: true },
    { name: 'diagnosisDate', label: 'Diagnosis date', type: 'date', half: true },
    { name: 'doctor', label: 'Doctor', type: 'text', half: true, placeholder: 'Dr. Smith' },
    { name: 'treatment', label: 'Treatment', type: 'text', half: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
};

export default function MedicalHistory() {
  return (
    <AppShell title="Medical History">
      <RecordManager config={CONFIG} />
    </AppShell>
  );
}
