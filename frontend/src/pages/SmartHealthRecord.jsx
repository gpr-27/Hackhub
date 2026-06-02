import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, ClipboardList, FlaskConical, Stethoscope, Pill, Activity,
  ArrowRight, ShieldAlert, Plus, Phone, Pencil, Trash2, Users,
  HeartPulse, Briefcase, Contact, FolderHeart,
} from 'lucide-react';
import AppShell, { useAppUser } from '../components/AppShell';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import {
  PageHeader, Card, Button, Field, Input, Select, Badge,
  Skeleton, EmptyState, Modal, ConfirmDialog,
} from '../components/ui';
import '../styles/SmartHealthRecord.css';

const FEATURES = [
  {
    key: 'profile',
    to: '/smart-health-record/profile',
    endpoint: null, // singleton, not a list — no count
    icon: User,
    gradient: 'var(--gradient-teal)',
    title: 'Health Profile',
    desc: 'Personal health info, allergies, chronic conditions and insurance details.',
  },
  {
    key: 'medical-history',
    to: '/smart-health-record/medical-history',
    endpoint: '/api/medical-history',
    icon: ClipboardList,
    gradient: 'var(--gradient-aurora)',
    title: 'Medical History',
    desc: 'Conditions, diagnoses, treatments and your healthcare provider visits.',
  },
  {
    key: 'lab-reports',
    to: '/smart-health-record/lab-reports',
    endpoint: '/api/lab-reports',
    icon: FlaskConical,
    gradient: 'var(--gradient-brand)',
    title: 'Lab Reports',
    desc: 'Store and monitor lab test results, blood work and diagnostic reports.',
  },
  {
    key: 'doctor-visits',
    to: '/smart-health-record/doctor-visits',
    endpoint: '/api/doctor-visits',
    icon: Stethoscope,
    gradient: 'var(--gradient-sunset)',
    title: 'Doctor Visits',
    desc: 'Detailed records of appointments, consultations and follow-ups.',
  },
  {
    key: 'prescriptions',
    to: '/smart-health-record/prescriptions',
    endpoint: '/api/prescriptions',
    icon: Pill,
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    title: 'Prescriptions',
    desc: 'Manage medications, dosages, schedules and prescription history.',
  },
  {
    key: 'vital-signs',
    to: '/smart-health-record/vital-signs',
    endpoint: '/api/vital-signs',
    icon: Activity,
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    title: 'Vital Signs',
    desc: 'Track blood pressure, heart rate, temperature and other vitals.',
  },
];

const TYPE_META = {
  family: { label: 'Family', tone: 'primary', icon: Users },
  medical: { label: 'Medical', tone: 'info', icon: HeartPulse },
  friend: { label: 'Friend', tone: 'success', icon: Contact },
  work: { label: 'Work', tone: 'warning', icon: Briefcase },
};

const EMPTY_CONTACT = { name: '', relationship: '', phone: '', type: 'family' };

export default function SmartHealthRecord() {
  const navigate = useNavigate();
  const { user } = useAppUser();
  const { toast } = useToast();

  const [counts, setCounts] = useState({}); // { [key]: number }

  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Best-effort: fetch a count from each list endpoint in parallel; ignore failures.
  const loadCounts = useCallback(async () => {
    const withEndpoint = FEATURES.filter((f) => f.endpoint);
    const results = await Promise.allSettled(
      withEndpoint.map((f) =>
        makeAuthenticatedRequest(`${API_BASE_URL}${f.endpoint}`, { method: 'GET' }).then((res) =>
          res.ok ? res.json() : Promise.reject(new Error('failed'))
        )
      )
    );
    const next = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        next[withEndpoint[i].key] = r.value.length;
      }
    });
    setCounts(next);
  }, []);

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/emergency-contacts`, {
        method: 'GET',
      });
      if (res.ok) {
        setContacts(await res.json());
      } else if (res.status === 401) {
        navigate('/login');
      } else {
        toast.error('Could not load emergency contacts.');
      }
    } catch (err) {
      toast.error('Could not load emergency contacts.');
    } finally {
      setContactsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadCounts();
    loadContacts();
  }, [loadCounts, loadContacts]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_CONTACT);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (contact) => {
    setEditingId(contact._id);
    setForm({
      name: contact.name || '',
      relationship: contact.relationship || '',
      phone: contact.phone || '',
      type: contact.type || 'family',
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.phone.trim()) next.phone = 'Phone is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      relationship: form.relationship.trim(),
      phone: form.phone.trim(),
      type: form.type,
    };
    try {
      const isEdit = Boolean(editingId);
      const res = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/emergency-contacts${isEdit ? `/${editingId}` : ''}`,
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const saved = await res.json();
        setContacts((list) =>
          isEdit ? list.map((c) => (c._id === editingId ? saved : c)) : [...list, saved]
        );
        toast.success(isEdit ? 'Emergency contact updated.' : 'Emergency contact added.');
        setModalOpen(false);
      } else if (res.status === 401) {
        navigate('/login');
      } else {
        toast.error('Could not save the contact. Please try again.');
      }
    } catch (err) {
      toast.error('Could not save the contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/emergency-contacts/${confirmTarget._id}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setContacts((list) => list.filter((c) => c._id !== confirmTarget._id));
        toast.success('Emergency contact removed.');
        setConfirmTarget(null);
      } else if (res.status === 401) {
        navigate('/login');
      } else {
        toast.error('Could not delete the contact. Please try again.');
      }
    } catch (err) {
      toast.error('Could not delete the contact. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <AppShell title="Health Records">
      <div className="animate-in">
        <PageHeader
          eyebrow="Smart Health Record"
          title="Health Records"
          subtitle={`Your comprehensive digital health hub, ${firstName}. Everything in one calm place.`}
          actions={
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          }
        />

        {/* Sub-page navigation */}
        <div className="shr-section-head">
          <div className="shr-section-head__titles">
            <span className="shr-section-head__eyebrow">
              <FolderHeart size={14} /> Records
            </span>
            <h2>Manage your records</h2>
            <p className="shr-section-head__sub">Open a section to view and update your information.</p>
          </div>
        </div>

        <div className="shr-grid stagger">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const count = counts[f.key];
            return (
              <Card key={f.key} hover as={Link} to={f.to} className="shr-nav-card">
                <div className="shr-nav-card__top">
                  <span className="shr-nav-card__icon" style={{ background: f.gradient }}>
                    <Icon size={26} />
                  </span>
                  <span className="shr-nav-card__arrow" aria-hidden="true">
                    <ArrowRight size={18} />
                  </span>
                </div>
                <h3 className="shr-nav-card__title">{f.title}</h3>
                <p className="shr-nav-card__desc">{f.desc}</p>
                <div className="shr-nav-card__foot">
                  {f.endpoint && typeof count === 'number' ? (
                    <Badge tone="primary">{count} {count === 1 ? 'record' : 'records'}</Badge>
                  ) : (
                    <Badge tone="neutral">Open</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Emergency contacts */}
        <div className="shr-section-head">
          <div className="shr-section-head__titles">
            <span className="shr-section-head__eyebrow">
              <ShieldAlert size={14} /> Emergency
            </span>
            <h2>Emergency contacts</h2>
            <p className="shr-section-head__sub">People to reach quickly when it matters most.</p>
          </div>
          <Button variant="primary" onClick={openAdd}>
            <Plus size={18} /> Add contact
          </Button>
        </div>

        {contactsLoading ? (
          <div className="shr-contacts-grid">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  <Skeleton width="60%" height={20} radius={8} />
                  <Skeleton width="40%" height={14} radius={6} />
                  <Skeleton width="50%" height={16} radius={6} />
                </div>
              </Card>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <Card>
            <EmptyState
              icon={Phone}
              title="No emergency contacts yet"
              text="Add the people you'd want reached in an emergency for quick, calm access."
              action={
                <Button variant="primary" onClick={openAdd}>
                  <Plus size={18} /> Add your first contact
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="shr-contacts-grid stagger">
            {contacts.map((contact) => {
              const meta = TYPE_META[contact.type] || TYPE_META.family;
              const TypeIcon = meta.icon;
              return (
                <Card key={contact._id} hover className="shr-contact">
                  <div className="shr-contact__head">
                    <div className="shr-contact__id">
                      <span className="shr-contact__avatar" aria-hidden="true">
                        <TypeIcon size={20} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="shr-contact__name">{contact.name}</h3>
                        {contact.relationship && (
                          <p className="shr-contact__rel">{contact.relationship}</p>
                        )}
                      </div>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>

                  <a
                    className="shr-contact__phone"
                    href={`tel:${contact.phone}`}
                    aria-label={`Call ${contact.name} at ${contact.phone}`}
                  >
                    <Phone size={16} /> {contact.phone}
                  </a>

                  <div className="shr-contact__actions">
                    <Button variant="outline" size="sm" onClick={() => openEdit(contact)}>
                      <Pencil size={15} /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmTarget(contact)}>
                      <Trash2 size={15} /> Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit emergency contact' : 'Add emergency contact'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="shr-contact-form" loading={saving}>
              {editingId ? 'Save changes' : 'Add contact'}
            </Button>
          </>
        }
      >
        <form id="shr-contact-form" onSubmit={handleSubmit} noValidate>
          <div className="shr-form-grid">
            <Field
              className="shr-span-2"
              label="Full name"
              htmlFor="shr-name"
              error={errors.name}
            >
              <Input
                id="shr-name"
                icon={User}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Jane Doe"
                invalid={Boolean(errors.name)}
                required
                autoFocus
              />
            </Field>

            <Field label="Relationship" htmlFor="shr-relationship">
              <Input
                id="shr-relationship"
                value={form.relationship}
                onChange={(e) => setField('relationship', e.target.value)}
                placeholder="Spouse, parent, friend…"
              />
            </Field>

            <Field label="Contact type" htmlFor="shr-type">
              <Select
                id="shr-type"
                value={form.type}
                onChange={(e) => setField('type', e.target.value)}
              >
                <option value="family">Family</option>
                <option value="medical">Medical</option>
                <option value="friend">Friend</option>
                <option value="work">Work</option>
              </Select>
            </Field>

            <Field
              className="shr-span-2"
              label="Phone number"
              htmlFor="shr-phone"
              error={errors.phone}
            >
              <Input
                id="shr-phone"
                type="tel"
                icon={Phone}
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="(555) 123-4567"
                invalid={Boolean(errors.phone)}
                required
              />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onClose={() => !deleting && setConfirmTarget(null)}
        onConfirm={handleDelete}
        title="Remove emergency contact?"
        message={
          confirmTarget
            ? `${confirmTarget.name} will be removed from your emergency contacts. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </AppShell>
  );
}
