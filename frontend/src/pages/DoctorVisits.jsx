import React from 'react';
import { Stethoscope } from 'lucide-react';
import AppShell from '../components/AppShell';
import RecordManager from '../components/RecordManager';

const CONFIG = {
  endpoint: '/api/doctor-visits',
  backTo: '/smart-health-record',
  eyebrow: 'Health Records',
  title: 'Doctor Visits',
  subtitle: 'Every appointment, diagnosis, and follow-up in one place.',
  icon: Stethoscope,
  noun: 'Visit',
  pluralNoun: 'Visits',
  titleField: 'doctorName',
  subtitleField: 'specialty',
  badge: {
    field: 'status',
    tones: { completed: 'success', scheduled: 'info', cancelled: 'danger', rescheduled: 'warning' },
  },
  search: ['doctorName', 'specialty', 'diagnosis', 'symptoms', 'notes'],
  cardFields: ['visitDate', 'visitType', 'diagnosis', 'nextAppointment'],
  fields: [
    { name: 'doctorName', label: 'Doctor', type: 'text', required: true, placeholder: 'Dr. Smith' },
    { name: 'specialty', label: 'Specialty', type: 'text', half: true, placeholder: 'e.g. Cardiology' },
    { name: 'visitDate', label: 'Visit date', type: 'date', half: true },
    { name: 'visitType', label: 'Visit type', type: 'select', options: ['routine', 'follow-up', 'consultation', 'specialist', 'emergency'], half: true },
    { name: 'status', label: 'Status', type: 'select', options: ['completed', 'scheduled', 'rescheduled', 'cancelled'], half: true },
    { name: 'symptoms', label: 'Symptoms', type: 'text' },
    { name: 'diagnosis', label: 'Diagnosis', type: 'text' },
    { name: 'treatment', label: 'Treatment', type: 'text' },
    { name: 'nextAppointment', label: 'Next appointment', type: 'date', half: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
};

export default function DoctorVisits() {
  return (
    <AppShell title="Doctor Visits">
      <RecordManager config={CONFIG} />
    </AppShell>
  );
}
