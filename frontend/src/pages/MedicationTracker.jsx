import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pill, Plus, Clock, Pencil, Trash2, Check, Search,
  CalendarClock, AlarmClock, ListChecks, CheckCircle2, CalendarX,
} from 'lucide-react';
import AppShell, { useAppUser } from '../components/AppShell';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import {
  PageHeader, Card, Button, Field, Input, Badge,
  Skeleton, EmptyState, StatCard, Modal, ConfirmDialog,
  SegmentedControl, ProgressRing,
} from '../components/ui';
import '../styles/MedicationTracker.css';

const ALARM_SRC = '/bedside-clock-alarm-95792.mp3';

const todayKey = () => new Date().toISOString().slice(0, 10);
const takenStorageKey = () => `aura-meds-taken-${todayKey()}`;

const EMPTY_FORM = { name: '', time: '', dosage: '', tillDate: '' };

/** Convert "HH:MM" to a friendly "8:30 AM" label. */
function formatTime(hhmm) {
  if (!hhmm || !hhmm.includes(':')) return hhmm || '—';
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isExpired(med) {
  if (!med.tillDate) return false;
  return med.tillDate < todayKey();
}

export default function MedicationTracker() {
  const { user } = useAppUser();
  const { toast } = useToast();

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | active | expired

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Per-day "taken" set, persisted in localStorage.
  const [takenIds, setTakenIds] = useState(() => {
    try {
      const raw = localStorage.getItem(takenStorageKey());
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  const audioRef = useRef(null);
  const timersRef = useRef([]);

  // ---- Load medications -------------------------------------------------
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/medications`, { method: 'GET' });
        if (!res.ok) throw new Error('Failed to fetch medications');
        const data = await res.json();
        if (active) setMedications(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) toast.error('Could not load your medications. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [toast]);

  // ---- Persist taken set whenever it changes ----------------------------
  useEffect(() => {
    try {
      localStorage.setItem(takenStorageKey(), JSON.stringify([...takenIds]));
    } catch {
      /* storage unavailable — ignore */
    }
  }, [takenIds]);

  // ---- Schedule gentle chimes at each med's time ------------------------
  const playChime = useCallback((med) => {
    const el = audioRef.current;
    if (el) {
      try {
        el.currentTime = 0;
        const p = el.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        /* autoplay may be blocked until first interaction — that's fine */
      }
    }
    toast.info(`Time to take ${med.name}${med.dosage ? ` (${med.dosage})` : ''}.`, {
      title: 'Medication reminder',
    });
  }, [toast]);

  useEffect(() => {
    // Clear any previously scheduled timers.
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const now = new Date();
    medications.forEach((med) => {
      if (!med.time || !med.time.includes(':') || isExpired(med)) return;
      const [hStr, mStr] = med.time.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (Number.isNaN(h) || Number.isNaN(m)) return;

      const target = new Date();
      target.setHours(h, m, 0, 0);
      const delay = target.getTime() - now.getTime();
      // Only schedule for upcoming times today (with a small grace window).
      if (delay > -1000 && delay <= 24 * 60 * 60 * 1000) {
        const id = setTimeout(() => playChime(med), Math.max(delay, 0));
        timersRef.current.push(id);
      }
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [medications, playChime]);

  // ---- Derived data -----------------------------------------------------
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return medications.filter((med) => {
      const matchesSearch =
        !term ||
        (med.name || '').toLowerCase().includes(term) ||
        (med.dosage || '').toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (filterStatus === 'active' && isExpired(med)) return false;
      if (filterStatus === 'expired' && !isExpired(med)) return false;
      return true;
    });
  }, [medications, searchTerm, filterStatus]);

  // Today's schedule = active meds, sorted by time.
  const todaysSchedule = useMemo(() => {
    return medications
      .filter((med) => !isExpired(med))
      .slice()
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [medications]);

  const totalToday = todaysSchedule.length;
  const takenToday = todaysSchedule.filter((med) => takenIds.has(med._id)).length;
  const adherence = totalToday ? Math.round((takenToday / totalToday) * 100) : 0;
  const activeCount = medications.filter((med) => !isExpired(med)).length;
  const expiredCount = medications.length - activeCount;

  // ---- Form handlers ----------------------------------------------------
  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (med) => {
    setEditId(med._id);
    setForm({
      name: med.name || '',
      time: med.time || '',
      dosage: med.dosage || '',
      tillDate: med.tillDate || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const updateField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const formValid = form.name.trim() && form.time && form.dosage.trim() && form.tillDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValid || submitting) return;
    setSubmitting(true);

    const body = {
      name: form.name.trim(),
      time: form.time,
      dosage: form.dosage.trim(),
      tillDate: form.tillDate,
    };

    try {
      const url = editId
        ? `${API_BASE_URL}/api/medications/${editId}`
        : `${API_BASE_URL}/api/medications`;
      const res = await makeAuthenticatedRequest(url, {
        method: editId ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Request failed');
      const saved = await res.json();

      if (editId) {
        setMedications((meds) => meds.map((m) => (m._id === editId ? saved : m)));
        toast.success(`${saved.name} updated.`);
      } else {
        setMedications((meds) => [...meds, saved]);
        toast.success(`${saved.name} added to your tracker.`);
      }
      setModalOpen(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(editId ? 'Could not update the medication.' : 'Could not add the medication.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/medications/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      setMedications((meds) => meds.filter((m) => m._id !== deleteTarget._id));
      setTakenIds((prev) => {
        if (!prev.has(deleteTarget._id)) return prev;
        const next = new Set(prev);
        next.delete(deleteTarget._id);
        return next;
      });
      toast.success(`${deleteTarget.name} removed.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Could not delete the medication.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleTaken = (med) => {
    setTakenIds((prev) => {
      const next = new Set(prev);
      if (next.has(med._id)) {
        next.delete(med._id);
      } else {
        next.add(med._id);
        toast.success(`Marked ${med.name} as taken. Nice work.`);
      }
      return next;
    });
  };

  const firstName = (user?.name || '').split(' ')[0];

  return (
    <AppShell title="Medications">
      <audio ref={audioRef} src={ALARM_SRC} preload="auto" />

      <div className="med-page animate-in">
        <PageHeader
          eyebrow="Care routine"
          title="Medication Tracker"
          subtitle={
            firstName
              ? `Stay on track, ${firstName} — schedule doses, set gentle reminders, and never miss a one.`
              : 'Schedule doses, set gentle reminders, and never miss a one.'
          }
          actions={
            <Button onClick={openAdd}>
              <Plus size={18} /> Add medication
            </Button>
          }
        />

        {/* Stats */}
        <section className="med-stats stagger" aria-label="Overview">
          <StatCard icon={Pill} label="Active medications" value={loading ? '—' : activeCount} tone="primary" />
          <StatCard icon={ListChecks} label="Doses due today" value={loading ? '—' : totalToday} tone="info" />
          <StatCard icon={CheckCircle2} label="Taken today" value={loading ? '—' : `${takenToday}/${totalToday}`} tone="success" />
          <StatCard icon={CalendarX} label="Expired" value={loading ? '—' : expiredCount} tone="warning" />
        </section>

        <div className="med-layout">
          {/* Today's schedule + adherence */}
          <Card className="med-schedule" pad>
            <div className="med-section-head">
              <div className="med-section-head__title">
                <span className="med-section-head__icon"><CalendarClock size={18} /></span>
                <div>
                  <h2>Today&apos;s schedule</h2>
                  <p className="muted">{formatDate(todayKey())}</p>
                </div>
              </div>
              <ProgressRing value={adherence} size={92} stroke={9}>
                <div className="med-ring-label">
                  <strong>{adherence}%</strong>
                  <span>{takenToday}/{totalToday}</span>
                </div>
              </ProgressRing>
            </div>

            {loading ? (
              <div className="med-schedule-list">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="med-row med-row--skeleton">
                    <Skeleton width={44} height={44} radius={14} />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="50%" height={14} radius={6} />
                      <Skeleton width="30%" height={11} radius={6} style={{ marginTop: 8 }} />
                    </div>
                    <Skeleton width={104} height={36} radius={12} />
                  </div>
                ))}
              </div>
            ) : todaysSchedule.length === 0 ? (
              <EmptyState
                icon={AlarmClock}
                title="No doses scheduled today"
                text="Add a medication to build your daily schedule and get gentle reminders."
                action={<Button variant="secondary" onClick={openAdd}><Plus size={16} /> Add medication</Button>}
              />
            ) : (
              <ul className="med-schedule-list" aria-label="Doses due today">
                {todaysSchedule.map((med) => {
                  const taken = takenIds.has(med._id);
                  return (
                    <li key={med._id} className={`med-row${taken ? ' med-row--taken' : ''}`}>
                      <span className="med-row__icon" aria-hidden="true"><Pill size={20} /></span>
                      <div className="med-row__info">
                        <span className="med-row__name">{med.name}</span>
                        <span className="med-row__meta">{med.dosage}</span>
                      </div>
                      <Badge tone="info" className="med-row__time">
                        <Clock size={13} /> {formatTime(med.time)}
                      </Badge>
                      <Button
                        size="sm"
                        variant={taken ? 'accent' : 'outline'}
                        onClick={() => toggleTaken(med)}
                        aria-pressed={taken}
                        className="med-row__toggle"
                      >
                        <Check size={15} /> {taken ? 'Taken' : 'Mark taken'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* All medications */}
          <Card className="med-all" pad>
            <div className="med-section-head med-section-head--stack">
              <div className="med-section-head__title">
                <span className="med-section-head__icon"><Pill size={18} /></span>
                <div>
                  <h2>All medications</h2>
                  <p className="muted">{medications.length} total</p>
                </div>
              </div>
              <div className="med-controls">
                <Input
                  icon={Search}
                  type="search"
                  placeholder="Search by name or dosage"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search medications"
                />
                <SegmentedControl
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'active', label: 'Active' },
                    { value: 'expired', label: 'Expired' },
                  ]}
                />
              </div>
            </div>

            {loading ? (
              <div className="med-grid stagger">
                {[0, 1, 2, 3].map((i) => (
                  <Card key={i} className="med-tile" pad>
                    <Skeleton width="60%" height={16} radius={6} />
                    <Skeleton width="40%" height={12} radius={6} style={{ marginTop: 12 }} />
                    <Skeleton width="80%" height={12} radius={6} style={{ marginTop: 8 }} />
                  </Card>
                ))}
              </div>
            ) : medications.length === 0 ? (
              <EmptyState
                icon={Pill}
                title="No medications yet"
                text="Add your first medication to schedule doses, set reminders, and track adherence."
                action={<Button onClick={openAdd}><Plus size={16} /> Add medication</Button>}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matches"
                text="Try a different search term or filter."
              />
            ) : (
              <div className="med-grid stagger">
                {filtered.map((med) => {
                  const expired = isExpired(med);
                  return (
                    <Card key={med._id} className={`med-tile${expired ? ' med-tile--expired' : ''}`} pad hover>
                      <div className="med-tile__head">
                        <h3 className="med-tile__name">{med.name}</h3>
                        <Badge tone={expired ? 'danger' : 'success'} dot>
                          {expired ? 'Expired' : 'Active'}
                        </Badge>
                      </div>
                      <dl className="med-tile__details">
                        <div>
                          <dt><Clock size={14} /> Time</dt>
                          <dd>{formatTime(med.time)}</dd>
                        </div>
                        <div>
                          <dt><Pill size={14} /> Dosage</dt>
                          <dd>{med.dosage}</dd>
                        </div>
                        <div>
                          <dt><CalendarClock size={14} /> Until</dt>
                          <dd>{formatDate(med.tillDate)}</dd>
                        </div>
                      </dl>
                      <div className="med-tile__actions">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(med)}>
                          <Pencil size={15} /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(med)} className="med-tile__delete">
                          <Trash2 size={15} /> Delete
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editId ? 'Edit medication' : 'Add medication'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={!formValid}>
              {editId ? 'Save changes' : 'Add medication'}
            </Button>
          </>
        }
      >
        <form className="med-form" onSubmit={handleSubmit}>
          <Field label="Medicine name" htmlFor="med-name">
            <Input
              id="med-name"
              icon={Pill}
              type="text"
              placeholder="e.g. Sertraline"
              value={form.name}
              onChange={updateField('name')}
              autoFocus
              required
            />
          </Field>
          <div className="med-form__row">
            <Field label="Time" htmlFor="med-time" hint="Daily dose time">
              <Input
                id="med-time"
                type="time"
                value={form.time}
                onChange={updateField('time')}
                required
              />
            </Field>
            <Field label="Dosage" htmlFor="med-dosage">
              <Input
                id="med-dosage"
                type="text"
                placeholder="e.g. 1 tablet"
                value={form.dosage}
                onChange={updateField('dosage')}
                required
              />
            </Field>
          </div>
          <Field label="Until date" htmlFor="med-till" hint="When this course ends">
            <Input
              id="med-till"
              type="date"
              value={form.tillDate}
              onChange={updateField('tillDate')}
              required
            />
          </Field>
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete medication?"
        message={deleteTarget ? `“${deleteTarget.name}” will be permanently removed from your tracker.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </AppShell>
  );
}
