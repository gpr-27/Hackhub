import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, ChevronLeft, Inbox } from 'lucide-react';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Field, Input, Textarea, Select } from './ui/Field';
import { Modal, ConfirmDialog } from './ui/Modal';
import { EmptyState, Skeleton } from './ui/Feedback';
import { PageHeader } from './ui/PageHeader';
import '../styles/RecordManager.css';

/**
 * RecordManager — a complete, reusable CRUD experience for the user-owned
 * health-record collections. Drive it with a `config` object:
 *
 * {
 *   endpoint, eyebrow, title, subtitle, backTo, icon,
 *   noun, pluralNoun,
 *   titleField, subtitleField,
 *   badge: { field, tones: { value: tone } },     // optional status badge
 *   search: ['field', ...],                         // optional client search
 *   cardFields: ['field', ...],                     // rows shown on each card
 *   fields: [{ name, label, type, options, required, half, placeholder, defaultValue }],
 *   sort: (a, b) => number,                          // optional
 * }
 * Field types: text | number | date | time | textarea | select | tags.
 */
const isEmpty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

const fmtValue = (field, value) => {
  if (isEmpty(value)) return null;
  if (field?.type === 'date') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
};

const labelize = (s) => String(s).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function buildInitialForm(fields, item) {
  const form = {};
  for (const f of fields) {
    const existing = item ? item[f.name] : undefined;
    if (f.type === 'tags') form[f.name] = Array.isArray(existing) ? existing.join(', ') : existing || '';
    else form[f.name] = existing ?? f.defaultValue ?? (f.type === 'select' && f.options?.length ? '' : '');
  }
  return form;
}

function coerce(fields, form) {
  const out = {};
  for (const f of fields) {
    const raw = form[f.name];
    if (f.type === 'number') {
      if (raw !== '' && raw !== null && raw !== undefined) out[f.name] = Number(raw);
    } else if (f.type === 'tags') {
      out[f.name] = String(raw || '').split(',').map((s) => s.trim()).filter(Boolean);
    } else if (f.type === 'select') {
      // Omit an unselected dropdown so schema defaults/enums apply (no empty string).
      if (raw !== '' && raw != null) out[f.name] = raw;
    } else {
      out[f.name] = raw;
    }
  }
  return out;
}

export function RecordManager({ config }) {
  const {
    endpoint, eyebrow, title, subtitle, backTo, icon: Icon = Inbox,
    noun = 'Record', pluralNoun = 'Records',
    titleField, subtitleField, badge, search = [], cardFields = [], fields = [], sort,
  } = config;

  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const url = `${API_BASE_URL}${endpoint}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await makeAuthenticatedRequest(url, { method: 'GET' });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error(`Couldn't load your ${pluralNoun.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [url, pluralNoun, toast]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(buildInitialForm(fields, null)); setErrors({}); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(buildInitialForm(fields, item)); setErrors({}); setModalOpen(true); };

  const setField = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const validate = () => {
    const errs = {};
    for (const f of fields) {
      if (f.required && isEmpty(form[f.name])) errs[f.name] = `${f.label} is required`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const body = coerce(fields, form);
    try {
      const res = await makeAuthenticatedRequest(editing ? `${url}/${editing._id}` : url, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('save failed');
      const saved = await res.json();
      setItems((list) => (editing ? list.map((it) => (it._id === saved._id ? saved : it)) : [saved, ...list]));
      toast.success(`${noun} ${editing ? 'updated' : 'added'}.`);
      setModalOpen(false);
    } catch {
      toast.error(`Couldn't ${editing ? 'update' : 'add'} this ${noun.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await makeAuthenticatedRequest(`${url}/${deleteTarget._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setItems((list) => list.filter((it) => it._id !== deleteTarget._id));
      toast.success(`${noun} deleted.`);
      setDeleteTarget(null);
    } catch {
      toast.error(`Couldn't delete this ${noun.toLowerCase()}.`);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (query && search.length) {
      const q = query.toLowerCase();
      list = list.filter((it) => search.some((k) => String(it[k] || '').toLowerCase().includes(q)));
    }
    if (sort) list.sort(sort);
    return list;
  }, [items, query, search, sort]);

  const badgeTone = (val) => (badge?.tones && badge.tones[val]) || 'neutral';

  return (
    <>
      {backTo && (
        <Link to={backTo} className="rm-back"><ChevronLeft size={16} /> Back to Health Records</Link>
      )}
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {search.length > 0 && (
              <Input icon={Search} placeholder={`Search ${pluralNoun.toLowerCase()}…`} value={query}
                onChange={(e) => setQuery(e.target.value)} className="rm-search" />
            )}
            <Button onClick={openAdd}><Plus size={18} /> Add {noun.toLowerCase()}</Button>
          </>
        }
      />

      {loading ? (
        <div className="rm-grid">
          {[0, 1, 2].map((i) => (
            <Card key={i}><Skeleton height={22} width="55%" /><div style={{ height: 14 }} /><Skeleton height={14} /><div style={{ height: 8 }} /><Skeleton height={14} width="80%" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="animate-in">
          <EmptyState
            icon={Icon}
            title={query ? 'No matches' : `No ${pluralNoun.toLowerCase()} yet`}
            text={query ? 'Try a different search term.' : `Add your first ${noun.toLowerCase()} to keep everything in one safe place.`}
            action={!query && <Button onClick={openAdd}><Plus size={18} /> Add {noun.toLowerCase()}</Button>}
          />
        </Card>
      ) : (
        <div className="rm-grid stagger">
          {filtered.map((item) => (
            <Card key={item._id} hover className="rm-card">
              <div className="rm-card__head">
                <span className="rm-card__icon"><Icon size={20} /></span>
                <div className="rm-card__titles">
                  <h3>{item[titleField] || 'Untitled'}</h3>
                  {subtitleField && item[subtitleField] && <span>{item[subtitleField]}</span>}
                </div>
                {badge?.field && item[badge.field] && (
                  <Badge tone={badgeTone(item[badge.field])} dot>{labelize(item[badge.field])}</Badge>
                )}
              </div>
              <dl className="rm-card__fields">
                {cardFields.map((name) => {
                  const f = fields.find((x) => x.name === name);
                  const v = fmtValue(f, item[name]);
                  if (!v) return null;
                  return (
                    <div key={name} className="rm-card__row">
                      <dt>{f?.label || labelize(name)}</dt>
                      <dd>{v}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="rm-card__actions">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil size={15} /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)} className="rm-del"><Trash2 size={15} /> Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={`${editing ? 'Edit' : 'Add'} ${noun.toLowerCase()}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} loading={saving}>{editing ? 'Save changes' : `Add ${noun.toLowerCase()}`}</Button>
          </>
        }
      >
        <form className="rm-form" onSubmit={submit}>
          {fields.map((f) => (
            <Field key={f.name} label={f.label} htmlFor={f.name} error={errors[f.name]} className={f.half ? 'rm-form__half' : 'rm-form__full'} hint={f.hint}>
              {f.type === 'textarea' ? (
                <Textarea id={f.name} value={form[f.name] ?? ''} onChange={setField(f.name)} placeholder={f.placeholder} invalid={!!errors[f.name]} />
              ) : f.type === 'select' ? (
                <Select id={f.name} value={form[f.name] ?? ''} onChange={setField(f.name)} invalid={!!errors[f.name]}>
                  <option value="">Select…</option>
                  {(f.options || []).map((o) => {
                    const val = typeof o === 'string' ? o : o.value;
                    const lab = typeof o === 'string' ? labelize(o) : o.label;
                    return <option key={val} value={val}>{lab}</option>;
                  })}
                </Select>
              ) : (
                <Input
                  id={f.name}
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text'}
                  value={form[f.name] ?? ''}
                  onChange={setField(f.name)}
                  placeholder={f.type === 'tags' ? (f.placeholder || 'Comma separated…') : f.placeholder}
                  invalid={!!errors[f.name]}
                />
              )}
            </Field>
          ))}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete this ${noun.toLowerCase()}?`}
        message={`"${deleteTarget?.[titleField] || ''}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </>
  );
}

export default RecordManager;
