import React from 'react';
import { FlaskConical } from 'lucide-react';
import AppShell from '../components/AppShell';
import RecordManager from '../components/RecordManager';

const CONFIG = {
  endpoint: '/api/lab-reports',
  backTo: '/smart-health-record',
  eyebrow: 'Health Records',
  title: 'Lab Reports',
  subtitle: 'Keep every test result organised and easy to compare.',
  icon: FlaskConical,
  noun: 'Report',
  pluralNoun: 'Reports',
  titleField: 'testName',
  subtitleField: 'doctor',
  badge: { field: 'status', tones: { normal: 'success', abnormal: 'danger', pending: 'warning' } },
  search: ['testName', 'doctor', 'results', 'notes'],
  cardFields: ['testDate', 'results', 'normalRange', 'notes'],
  fields: [
    { name: 'testName', label: 'Test name', type: 'text', required: true, placeholder: 'e.g. Complete Blood Count' },
    { name: 'status', label: 'Status', type: 'select', options: ['pending', 'normal', 'abnormal'], half: true },
    { name: 'testDate', label: 'Test date', type: 'date', half: true },
    { name: 'doctor', label: 'Ordering doctor', type: 'text', half: true },
    { name: 'normalRange', label: 'Normal range', type: 'text', half: true, placeholder: 'e.g. 4.5–11.0' },
    { name: 'results', label: 'Results', type: 'text', placeholder: 'Key values / summary' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
};

export default function LabReports() {
  return (
    <AppShell title="Lab Reports">
      <RecordManager config={CONFIG} />
    </AppShell>
  );
}
