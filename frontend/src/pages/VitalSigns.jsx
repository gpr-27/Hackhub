import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import {
  HeartPulse, Activity, Thermometer, Droplets, Gauge, Wind, Weight, Ruler,
  Plus, Pencil, Trash2, ChevronLeft, Calendar, LineChart as LineChartIcon,
} from 'lucide-react';
import AppShell, { useAppUser } from '../components/AppShell';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import {
  PageHeader, Card, Button, Field, Input, Textarea, Select, Badge,
  Modal, ConfirmDialog, StatCard, EmptyState, Loader, Skeleton,
} from '../components/ui';
import '../styles/VitalSigns.css';

const EMPTY_FORM = {
  date: '',
  heartRate: '',
  systolicBP: '',
  diastolicBP: '',
  temperature: '',
  weight: '',
  height: '',
  bloodGlucose: '',
  oxygenSaturation: '',
  respiratoryRate: '',
  status: 'normal',
  notes: '',
};

// Fields that must be coerced to Number before sending to the API.
const NUMERIC_FIELDS = [
  'heartRate', 'systolicBP', 'diastolicBP', 'temperature', 'weight', 'height',
  'bloodGlucose', 'oxygenSaturation', 'respiratoryRate',
];

const NUMERIC_INPUTS = [
  { name: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: HeartPulse, placeholder: '72', step: '1', min: '30', max: '220' },
  { name: 'systolicBP', label: 'Systolic BP', unit: 'mmHg', icon: Activity, placeholder: '120', step: '1', min: '60', max: '250' },
  { name: 'diastolicBP', label: 'Diastolic BP', unit: 'mmHg', icon: Activity, placeholder: '80', step: '1', min: '40', max: '150' },
  { name: 'temperature', label: 'Temperature', unit: '°F', icon: Thermometer, placeholder: '98.6', step: '0.1', min: '90', max: '110' },
  { name: 'oxygenSaturation', label: 'Oxygen Saturation', unit: '%', icon: Droplets, placeholder: '98', step: '1', min: '70', max: '100' },
  { name: 'respiratoryRate', label: 'Respiratory Rate', unit: 'breaths/min', icon: Wind, placeholder: '16', step: '1', min: '5', max: '60' },
  { name: 'bloodGlucose', label: 'Blood Glucose', unit: 'mg/dL', icon: Gauge, placeholder: '95', step: '1', min: '20', max: '600' },
  { name: 'weight', label: 'Weight', unit: 'lbs', icon: Weight, placeholder: '150', step: '0.1', min: '20', max: '600' },
  { name: 'height', label: 'Height', unit: 'in', icon: Ruler, placeholder: '68', step: '0.1', min: '20', max: '100' },
];

const hasValue = (v) => v !== null && v !== undefined && v !== '';

function toDateTimeLocal(date) {
  if (!date) return '';
  if (date.includes('T')) return date.substring(0, 16);
  return `${date}T12:00`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

export default function VitalSigns() {
  const { user } = useAppUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/vital-signs`, { method: 'GET' });
        if (res.status === 401) { navigate('/login'); return; }
        if (!res.ok) throw new Error('Failed to fetch vital signs');
        const data = await res.json();
        if (active) setVitals(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) toast.error('Could not load your vital signs. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [navigate, toast]);

  // Sorted ascending by date for the charts.
  const chronological = useMemo(
    () => [...vitals].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [vitals]
  );

  // Most recent reading for the "Latest readings" stat row.
  const latest = useMemo(
    () => (chronological.length ? chronological[chronological.length - 1] : null),
    [chronological]
  );

  const heartRateData = useMemo(
    () => chronological
      .filter((v) => hasValue(v.heartRate))
      .map((v) => ({ label: formatDate(v.date), value: Number(v.heartRate) })),
    [chronological]
  );

  const bloodPressureData = useMemo(
    () => chronological
      .filter((v) => hasValue(v.systolicBP) || hasValue(v.diastolicBP))
      .map((v) => ({
        label: formatDate(v.date),
        systolic: hasValue(v.systolicBP) ? Number(v.systolicBP) : null,
        diastolic: hasValue(v.diastolicBP) ? Number(v.diastolicBP) : null,
      })),
    [chronological]
  );

  const weightData = useMemo(
    () => chronological
      .filter((v) => hasValue(v.weight))
      .map((v) => ({ label: formatDate(v.date), value: Number(v.weight) })),
    [chronological]
  );

  // History list shows newest first.
  const history = useMemo(
    () => [...vitals].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [vitals]
  );

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (vital) => {
    setEditingId(vital._id);
    setFormData({
      date: toDateTimeLocal(vital.date),
      heartRate: hasValue(vital.heartRate) ? String(vital.heartRate) : '',
      systolicBP: hasValue(vital.systolicBP) ? String(vital.systolicBP) : '',
      diastolicBP: hasValue(vital.diastolicBP) ? String(vital.diastolicBP) : '',
      temperature: hasValue(vital.temperature) ? String(vital.temperature) : '',
      weight: hasValue(vital.weight) ? String(vital.weight) : '',
      height: hasValue(vital.height) ? String(vital.height) : '',
      bloodGlucose: hasValue(vital.bloodGlucose) ? String(vital.bloodGlucose) : '',
      oxygenSaturation: hasValue(vital.oxygenSaturation) ? String(vital.oxygenSaturation) : '',
      respiratoryRate: hasValue(vital.respiratoryRate) ? String(vital.respiratoryRate) : '',
      status: vital.status || 'normal',
      notes: vital.notes || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    const payload = { date: formData.date, status: formData.status, notes: formData.notes };
    NUMERIC_FIELDS.forEach((key) => {
      if (hasValue(formData[key])) payload[key] = Number(formData[key]);
    });
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date) {
      toast.error('Please choose a date and time for this reading.');
      return;
    }

    setSaving(true);
    const isEdit = Boolean(editingId);
    const url = isEdit
      ? `${API_BASE_URL}/api/vital-signs/${editingId}`
      : `${API_BASE_URL}/api/vital-signs`;

    try {
      const res = await makeAuthenticatedRequest(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(buildPayload()),
      });
      if (res.status === 401) { navigate('/login'); return; }
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();

      setVitals((prev) => (
        isEdit
          ? prev.map((v) => (v._id === editingId ? saved : v))
          : [saved, ...prev]
      ));
      toast.success(isEdit ? 'Reading updated.' : 'Reading recorded.');
      closeModal();
    } catch (err) {
      toast.error('We could not save this reading. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/vital-signs/${confirmTarget._id}`, {
        method: 'DELETE',
      });
      if (res.status === 401) { navigate('/login'); return; }
      if (!res.ok) throw new Error('Delete failed');
      setVitals((prev) => prev.filter((v) => v._id !== confirmTarget._id));
      toast.success('Reading deleted.');
      setConfirmTarget(null);
    } catch (err) {
      toast.error('Could not delete this reading. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const latestTone = latest?.status === 'abnormal' ? 'danger' : latest ? 'success' : 'primary';

  return (
    <AppShell title="Vital Signs">
      <div className="vs-page animate-in">
        <Link to="/smart-health-record" className="vs-breadcrumb">
          <ChevronLeft size={16} /> Back to Health Records
        </Link>

        <PageHeader
          eyebrow="Smart Health Record"
          title="Vital Signs"
          subtitle="Track your key health metrics and watch the trends over time."
          actions={
            <Button onClick={openCreate}>
              <Plus size={18} /> Record reading
            </Button>
          }
        />

        {loading ? (
          <div className="vs-skeletons">
            <div className="vs-stat-grid">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={110} radius={18} />
              ))}
            </div>
            <Skeleton height={300} radius={22} />
            <Loader label="Loading your vital signs…" />
          </div>
        ) : vitals.length === 0 ? (
          <Card>
            <EmptyState
              icon={HeartPulse}
              title="No vital signs yet"
              text={`${user?.name ? user.name.split(' ')[0] + ', s' : 'S'}tart tracking your health by recording your first reading.`}
              action={
                <Button onClick={openCreate}>
                  <Plus size={18} /> Record your first reading
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {/* Latest readings */}
            {latest && (
              <section className="vs-section" aria-label="Latest readings">
                <div className="vs-section-head">
                  <h2 className="vs-h2"><Calendar size={18} /> Latest readings</h2>
                  <span className="vs-subtle">
                    {formatDate(latest.date)} · {formatTime(latest.date)}
                  </span>
                </div>
                <div className="vs-stat-grid stagger">
                  <StatCard
                    icon={HeartPulse}
                    label="Heart rate (bpm)"
                    value={hasValue(latest.heartRate) ? latest.heartRate : '—'}
                    tone={latestTone}
                  />
                  <StatCard
                    icon={Activity}
                    label="Blood pressure (mmHg)"
                    value={
                      hasValue(latest.systolicBP) || hasValue(latest.diastolicBP)
                        ? `${hasValue(latest.systolicBP) ? latest.systolicBP : '—'}/${hasValue(latest.diastolicBP) ? latest.diastolicBP : '—'}`
                        : '—'
                    }
                    tone={latestTone}
                  />
                  <StatCard
                    icon={Thermometer}
                    label="Temperature (°F)"
                    value={hasValue(latest.temperature) ? latest.temperature : '—'}
                    tone={latestTone}
                  />
                  <StatCard
                    icon={Droplets}
                    label="SpO₂ (%)"
                    value={hasValue(latest.oxygenSaturation) ? latest.oxygenSaturation : '—'}
                    tone={latestTone}
                  />
                  <StatCard
                    icon={Gauge}
                    label="Glucose (mg/dL)"
                    value={hasValue(latest.bloodGlucose) ? latest.bloodGlucose : '—'}
                    tone={latestTone}
                  />
                </div>
              </section>
            )}

            {/* Charts */}
            <section className="vs-section" aria-label="Trends">
              <h2 className="vs-h2"><LineChartIcon size={18} /> Trends</h2>
              <div className="vs-chart-grid">
                <Card className="vs-chart-card">
                  <div className="vs-chart-head">
                    <HeartPulse size={18} />
                    <h3>Heart rate over time</h3>
                  </div>
                  {heartRateData.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={heartRateData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="vsHeart" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }} />
                        <Area type="monotone" dataKey="value" name="bpm" stroke="#ef4444" strokeWidth={2.5} fill="url(#vsHeart)" dot={{ r: 2.5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon={HeartPulse} title="No heart-rate data" text="Add heart-rate readings to see this trend." />
                  )}
                </Card>

                <Card className="vs-chart-card">
                  <div className="vs-chart-head">
                    <Activity size={18} />
                    <h3>Blood pressure over time</h3>
                  </div>
                  {bloodPressureData.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={bloodPressureData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />
                        <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon={Activity} title="No blood-pressure data" text="Add blood-pressure readings to see this trend." />
                  )}
                </Card>

                <Card className="vs-chart-card">
                  <div className="vs-chart-head">
                    <Weight size={18} />
                    <h3>Weight over time</h3>
                  </div>
                  {weightData.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="vsWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} width={40} domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }} />
                        <Area type="monotone" dataKey="value" name="lbs" stroke="#10b981" strokeWidth={2.5} fill="url(#vsWeight)" dot={{ r: 2.5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon={Weight} title="No weight data" text="Add weight readings to see this trend." />
                  )}
                </Card>
              </div>
            </section>

            {/* History */}
            <section className="vs-section" aria-label="History">
              <div className="vs-section-head">
                <h2 className="vs-h2"><Calendar size={18} /> History</h2>
                <span className="vs-subtle">{history.length} {history.length === 1 ? 'reading' : 'readings'}</span>
              </div>
              <div className="vs-history stagger">
                {history.map((vital) => (
                  <Card key={vital._id} hover className="vs-entry">
                    <div className="vs-entry__main">
                      <div className="vs-entry__date">
                        <div className="vs-entry__day">{formatDate(vital.date)}</div>
                        <div className="vs-subtle">{formatTime(vital.date)}</div>
                      </div>
                      <div className="vs-entry__metrics">
                        {hasValue(vital.heartRate) && (
                          <span className="vs-metric"><HeartPulse size={14} /> {vital.heartRate} bpm</span>
                        )}
                        {(hasValue(vital.systolicBP) || hasValue(vital.diastolicBP)) && (
                          <span className="vs-metric"><Activity size={14} /> {hasValue(vital.systolicBP) ? vital.systolicBP : '—'}/{hasValue(vital.diastolicBP) ? vital.diastolicBP : '—'} mmHg</span>
                        )}
                        {hasValue(vital.temperature) && (
                          <span className="vs-metric"><Thermometer size={14} /> {vital.temperature}°F</span>
                        )}
                        {hasValue(vital.oxygenSaturation) && (
                          <span className="vs-metric"><Droplets size={14} /> {vital.oxygenSaturation}%</span>
                        )}
                        {hasValue(vital.bloodGlucose) && (
                          <span className="vs-metric"><Gauge size={14} /> {vital.bloodGlucose} mg/dL</span>
                        )}
                        {hasValue(vital.respiratoryRate) && (
                          <span className="vs-metric"><Wind size={14} /> {vital.respiratoryRate} br/min</span>
                        )}
                        {hasValue(vital.weight) && (
                          <span className="vs-metric"><Weight size={14} /> {vital.weight} lbs</span>
                        )}
                        {hasValue(vital.height) && (
                          <span className="vs-metric"><Ruler size={14} /> {vital.height} in</span>
                        )}
                      </div>
                    </div>
                    <div className="vs-entry__side">
                      <Badge tone={vital.status === 'abnormal' ? 'danger' : 'success'} dot>
                        {vital.status === 'abnormal' ? 'Abnormal' : 'Normal'}
                      </Badge>
                      <div className="vs-entry__actions">
                        <Button variant="ghost" size="sm" iconOnly onClick={() => openEdit(vital)} aria-label="Edit reading">
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" iconOnly onClick={() => setConfirmTarget(vital)} aria-label="Delete reading">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    {vital.notes && <p className="vs-entry__notes">{vital.notes}</p>}
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Add / Edit modal */}
        <Modal
          open={modalOpen}
          onClose={closeModal}
          title={editingId ? 'Edit reading' : 'Record vital signs'}
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal} disabled={saving}>Cancel</Button>
              <Button type="submit" form="vs-form" loading={saving}>
                {editingId ? 'Update reading' : 'Save reading'}
              </Button>
            </>
          }
        >
          <form id="vs-form" onSubmit={handleSubmit} className="vs-form">
            <Field label="Date & time" htmlFor="vs-date">
              <Input
                id="vs-date"
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </Field>

            <div className="vs-form-grid">
              {NUMERIC_INPUTS.map((f) => {
                const Icon = f.icon;
                return (
                  <Field key={f.name} label={`${f.label} (${f.unit})`} htmlFor={`vs-${f.name}`}>
                    <Input
                      id={`vs-${f.name}`}
                      type="number"
                      name={f.name}
                      icon={Icon}
                      value={formData[f.name]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      step={f.step}
                      min={f.min}
                      max={f.max}
                      inputMode="decimal"
                    />
                  </Field>
                );
              })}
            </div>

            <Field label="Status" htmlFor="vs-status">
              <Select id="vs-status" name="status" value={formData.status} onChange={handleChange}>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
              </Select>
            </Field>

            <Field label="Notes" htmlFor="vs-notes" hint="Optional — symptoms, context, or observations.">
              <Textarea
                id="vs-notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional observations…"
              />
            </Field>
          </form>
        </Modal>

        <ConfirmDialog
          open={Boolean(confirmTarget)}
          onClose={() => setConfirmTarget(null)}
          onConfirm={confirmDelete}
          title="Delete this reading?"
          message={confirmTarget ? `This will permanently remove the reading from ${formatDate(confirmTarget.date)}.` : ''}
          confirmLabel="Delete"
          danger
          loading={deleting}
        />
      </div>
    </AppShell>
  );
}
