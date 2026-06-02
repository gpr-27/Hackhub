import React from 'react';
import { Pill } from 'lucide-react';
import AppShell from '../components/AppShell';
import RecordManager from '../components/RecordManager';

const CONFIG = {
  endpoint: '/api/prescriptions',
  backTo: '/smart-health-record',
  eyebrow: 'Health Records',
  title: 'Prescriptions',
  subtitle: 'Track your medications, dosages, refills, and instructions.',
  icon: Pill,
  noun: 'Prescription',
  pluralNoun: 'Prescriptions',
  titleField: 'medicationName',
  subtitleField: 'prescribedBy',
  badge: { field: 'status', tones: { active: 'success', completed: 'neutral', discontinued: 'danger' } },
  search: ['medicationName', 'prescribedBy', 'instructions'],
  cardFields: ['dosage', 'frequency', 'duration', 'refillsRemaining', 'prescriptionDate'],
  fields: [
    { name: 'medicationName', label: 'Medication', type: 'text', required: true, placeholder: 'e.g. Amoxicillin' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'completed', 'discontinued'], half: true },
    { name: 'dosage', label: 'Dosage', type: 'text', half: true, placeholder: 'e.g. 500mg' },
    { name: 'frequency', label: 'Frequency', type: 'text', half: true, placeholder: 'e.g. Twice daily' },
    { name: 'duration', label: 'Duration', type: 'text', half: true, placeholder: 'e.g. 7 days' },
    { name: 'prescribedBy', label: 'Prescribed by', type: 'text', half: true },
    { name: 'prescriptionDate', label: 'Prescription date', type: 'date', half: true },
    { name: 'refillsRemaining', label: 'Refills remaining', type: 'number', half: true },
    { name: 'instructions', label: 'Instructions', type: 'textarea' },
  ],
};

export default function Prescriptions() {
  return (
    <AppShell title="Prescriptions">
      <RecordManager config={CONFIG} />
    </AppShell>
  );
}
