import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, IdCard, Ruler, Stethoscope, ShieldPlus, Save,
  CalendarDays, Droplet, Weight, TriangleAlert, Activity, Phone, X, Plus,
  Clock,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import {
  PageHeader, Card, Button, Field, Input, Select, Badge, Skeleton,
} from '../components/ui';
import '../styles/HealthRecordProfile.css';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EMPTY_FORM = {
  dateOfBirth: '',
  gender: '',
  bloodType: '',
  height: '',
  weight: '',
  allergies: [],
  chronicConditions: [],
  emergencyContact: '',
  insurance: { provider: '', policyNumber: '', groupNumber: '' },
};

function formatTimestamp(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** TagInput — turns free text into a removable-chip array (add via Enter). */
function TagInput({ id, label, hint, placeholder, icon: Icon, items, onChange }) {
  const [draft, setDraft] = useState('');

  const commit = useCallback(() => {
    const value = draft.trim();
    if (!value) return;
    if (!items.some((it) => it.toLowerCase() === value.toLowerCase())) {
      onChange([...items, value]);
    }
    setDraft('');
  }, [draft, items, onChange]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !draft && items.length) {
      onChange(items.slice(0, -1));
    }
  };

  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="hp-tagfield">
        {items.length > 0 && (
          <ul className="hp-chips" aria-label={`${label} list`}>
            {items.map((item, idx) => (
              <li key={`${item}-${idx}`}>
                <Badge tone="primary" className="hp-chip">
                  <span>{item}</span>
                  <button
                    type="button"
                    className="hp-chip__remove"
                    onClick={() => remove(idx)}
                    aria-label={`Remove ${item}`}
                  >
                    <X size={13} />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="hp-tagfield__row">
          <Input
            id={id}
            icon={Icon}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={commit}
            disabled={!draft.trim()}
            aria-label={`Add to ${label}`}
          >
            <Plus size={16} /> Add
          </Button>
        </div>
      </div>
    </Field>
  );
}

export default function HealthRecordProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchHealthProfile = async () => {
      try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/health-profile`, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          if (cancelled) return;
          setFormData({
            dateOfBirth: data.dateOfBirth || '',
            gender: data.gender || '',
            bloodType: data.bloodType || '',
            height: data.height || '',
            weight: data.weight || '',
            allergies: Array.isArray(data.allergies) ? data.allergies : [],
            chronicConditions: Array.isArray(data.chronicConditions) ? data.chronicConditions : [],
            emergencyContact: data.emergencyContact || '',
            insurance: {
              provider: data.insurance?.provider || '',
              policyNumber: data.insurance?.policyNumber || '',
              groupNumber: data.insurance?.groupNumber || '',
            },
          });
          setLastUpdated(data.lastUpdated || null);
        } else if (response.status === 401) {
          navigate('/login');
        } else {
          toast.error('We could not load your health profile.');
        }
      } catch (error) {
        if (!cancelled) toast.error('Network error while loading your profile.');
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    fetchHealthProfile();
    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  const setField = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));
  const setInsurance = (field, value) =>
    setFormData((prev) => ({ ...prev, insurance: { ...prev.insurance, [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const profileData = {
        ...formData,
        allergies: formData.allergies,
        chronicConditions: formData.chronicConditions,
      };

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/health-profile`, {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const saved = await response.json().catch(() => null);
        setLastUpdated(saved?.lastUpdated || new Date().toISOString());
        toast.success('Health profile saved successfully.');
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to save your health profile.');
      }
    } catch (error) {
      toast.error('Network error while saving your profile.');
    } finally {
      setSaving(false);
    }
  };

  const lastUpdatedLabel = formatTimestamp(lastUpdated);

  return (
    <AppShell title="Health Profile">
      <PageHeader
        eyebrow="Smart Health Record"
        title="Health Profile"
        subtitle="Keep your core medical details current so the right help is always one tap away."
        actions={
          lastUpdatedLabel ? (
            <Badge tone="info">
              <Clock size={14} /> Updated {lastUpdatedLabel}
            </Badge>
          ) : null
        }
      />

      <Link to="/smart-health-record" className="hp-back">
        <ArrowLeft size={16} /> Back to Health Records
      </Link>

      {fetching ? (
        <div className="hp-skeletons">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="hp-section">
              <Skeleton width="42%" height={22} radius={8} />
              <div className="hp-skel-grid">
                <Skeleton height={64} radius={14} />
                <Skeleton height={64} radius={14} />
                <Skeleton height={64} radius={14} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <form className="hp-form animate-in" onSubmit={handleSubmit}>
          <div className="hp-sections stagger">
            {/* Basics */}
            <Card className="hp-section">
              <div className="hp-section__head">
                <span className="hp-section__icon hp-section__icon--brand"><IdCard size={20} /></span>
                <div>
                  <h2 className="hp-section__title">Basics</h2>
                  <p className="hp-section__sub">Personal identity details for your record.</p>
                </div>
              </div>
              <div className="hp-grid hp-grid--3">
                <Field label="Date of birth" htmlFor="hp-dob">
                  <Input
                    id="hp-dob"
                    type="date"
                    icon={CalendarDays}
                    value={formData.dateOfBirth}
                    onChange={(e) => setField('dateOfBirth', e.target.value)}
                  />
                </Field>
                <Field label="Gender" htmlFor="hp-gender">
                  <Select
                    id="hp-gender"
                    value={formData.gender}
                    onChange={(e) => setField('gender', e.target.value)}
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Blood type" htmlFor="hp-blood">
                  <Select
                    id="hp-blood"
                    value={formData.bloodType}
                    onChange={(e) => setField('bloodType', e.target.value)}
                  >
                    <option value="">Select blood type</option>
                    {BLOOD_TYPES.map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </Card>

            {/* Body measurements */}
            <Card className="hp-section">
              <div className="hp-section__head">
                <span className="hp-section__icon hp-section__icon--teal"><Ruler size={20} /></span>
                <div>
                  <h2 className="hp-section__title">Body measurements</h2>
                  <p className="hp-section__sub">Used to contextualise vitals and dosages.</p>
                </div>
              </div>
              <div className="hp-grid hp-grid--2">
                <Field label="Height" htmlFor="hp-height" hint="e.g. 5'8&quot; or 173 cm">
                  <Input
                    id="hp-height"
                    type="text"
                    icon={Ruler}
                    value={formData.height}
                    placeholder="5'8&quot; or 173 cm"
                    onChange={(e) => setField('height', e.target.value)}
                  />
                </Field>
                <Field label="Weight" htmlFor="hp-weight" hint="e.g. 150 lbs or 68 kg">
                  <Input
                    id="hp-weight"
                    type="text"
                    icon={Weight}
                    value={formData.weight}
                    placeholder="150 lbs or 68 kg"
                    onChange={(e) => setField('weight', e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            {/* Medical */}
            <Card className="hp-section">
              <div className="hp-section__head">
                <span className="hp-section__icon hp-section__icon--warning"><Stethoscope size={20} /></span>
                <div>
                  <h2 className="hp-section__title">Medical</h2>
                  <p className="hp-section__sub">Add each item and press Enter to create a tag.</p>
                </div>
              </div>
              <div className="hp-grid hp-grid--2">
                <TagInput
                  id="hp-allergies"
                  label="Known allergies"
                  hint="Medications, foods, environmental, etc."
                  placeholder="Type an allergy and press Enter"
                  icon={TriangleAlert}
                  items={formData.allergies}
                  onChange={(items) => setField('allergies', items)}
                />
                <TagInput
                  id="hp-conditions"
                  label="Chronic conditions"
                  hint="Ongoing health issues you manage."
                  placeholder="Type a condition and press Enter"
                  icon={Activity}
                  items={formData.chronicConditions}
                  onChange={(items) => setField('chronicConditions', items)}
                />
              </div>
            </Card>

            {/* Emergency & Insurance */}
            <Card className="hp-section">
              <div className="hp-section__head">
                <span className="hp-section__icon hp-section__icon--danger"><ShieldPlus size={20} /></span>
                <div>
                  <h2 className="hp-section__title">Emergency &amp; insurance</h2>
                  <p className="hp-section__sub">Who to reach and how you are covered.</p>
                </div>
              </div>
              <Field label="Primary emergency contact" htmlFor="hp-emergency">
                <Input
                  id="hp-emergency"
                  type="text"
                  icon={Phone}
                  value={formData.emergencyContact}
                  placeholder="Name and phone number"
                  onChange={(e) => setField('emergencyContact', e.target.value)}
                />
              </Field>
              <div className="hp-grid hp-grid--3">
                <Field label="Insurance provider" htmlFor="hp-ins-provider">
                  <Input
                    id="hp-ins-provider"
                    type="text"
                    icon={ShieldPlus}
                    value={formData.insurance.provider}
                    placeholder="e.g. Blue Cross Blue Shield"
                    onChange={(e) => setInsurance('provider', e.target.value)}
                  />
                </Field>
                <Field label="Policy number" htmlFor="hp-ins-policy">
                  <Input
                    id="hp-ins-policy"
                    type="text"
                    icon={IdCard}
                    value={formData.insurance.policyNumber}
                    placeholder="Your policy number"
                    onChange={(e) => setInsurance('policyNumber', e.target.value)}
                  />
                </Field>
                <Field label="Group number" htmlFor="hp-ins-group">
                  <Input
                    id="hp-ins-group"
                    type="text"
                    icon={Droplet}
                    value={formData.insurance.groupNumber}
                    placeholder="Group number (if any)"
                    onChange={(e) => setInsurance('groupNumber', e.target.value)}
                  />
                </Field>
              </div>
            </Card>
          </div>

          <div className="hp-actions">
            {lastUpdatedLabel && (
              <span className="hp-actions__meta">
                <Clock size={14} /> Last updated {lastUpdatedLabel}
              </span>
            )}
            <Button type="submit" size="lg" loading={saving}>
              <Save size={18} /> Save profile
            </Button>
          </div>
        </form>
      )}
    </AppShell>
  );
}
