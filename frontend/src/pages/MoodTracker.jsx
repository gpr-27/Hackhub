import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles, Save, Brain, Flame, CalendarDays, Smile, Gauge,
  Pencil, Trash2, ChevronDown, LineChart as LineChartIcon, Heart,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import AppShell, { useAppUser } from '../components/AppShell';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import { analyzeMood } from '../lib/ai';
import {
  PageHeader, Card, Button, Field, Textarea, Badge, Skeleton,
  EmptyState, StatCard, ConfirmDialog, Modal, Input,
} from '../components/ui';
import '../styles/MoodTracker.css';

// 10-level mood scale: emoji + label + token-driven color.
const MOODS = [
  { value: 1, emoji: '😰', label: 'Anxious', color: 'var(--danger)' },
  { value: 2, emoji: '😔', label: 'Sad', color: 'var(--danger)' },
  { value: 3, emoji: '😟', label: 'Down', color: 'var(--warning)' },
  { value: 4, emoji: '😐', label: 'Neutral', color: 'var(--warning)' },
  { value: 5, emoji: '🙂', label: 'Okay', color: 'var(--info)' },
  { value: 6, emoji: '😊', label: 'Content', color: 'var(--info)' },
  { value: 7, emoji: '😄', label: 'Happy', color: 'var(--primary)' },
  { value: 8, emoji: '🤗', label: 'Joyful', color: 'var(--primary)' },
  { value: 9, emoji: '🥰', label: 'Elated', color: 'var(--success)' },
  { value: 10, emoji: '🤩', label: 'Blissful', color: 'var(--success)' },
];

const EMOTION_WORDS = [
  'Happy', 'Calm', 'Grateful', 'Hopeful', 'Excited', 'Okay', 'Tired',
  'Anxious', 'Stressed', 'Sad', 'Angry', 'Lonely', 'Overwhelmed',
];

const moodMeta = (value) =>
  MOODS.find((m) => m.value === value) || MOODS[3];

const moodLabelFor = (value) => moodMeta(value).label;
const moodEmojiFor = (value) => moodMeta(value).emoji;

const toDateStr = (entry) => entry.date || (entry.timestamp ? entry.timestamp.split('T')[0] : '');
const entryTime = (entry) => new Date(entry.timestamp || entry.date).getTime();

// Tidy any markdown the model returns (## headings, **bold**, -/* bullets) into
// clean, readable plain text — rendered with white-space: pre-wrap.
const cleanInsight = (t) =>
  String(t || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();

export default function MoodTracker() {
  const { user } = useAppUser();
  const { toast } = useToast();

  // Composer state
  const [selectedMood, setSelectedMood] = useState(7);
  const [intensity, setIntensity] = useState(6);
  const [notes, setNotes] = useState('');
  const [selectedWords, setSelectedWords] = useState([]);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  // Data state
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [expanded, setExpanded] = useState(null);

  // Edit / delete state
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ mood: 7, intensity: 6, notes: '', emotionWords: [] });
  const [savingEdit, setSavingEdit] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMoods = useCallback(async () => {
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/moods`, { method: 'GET' });
      if (!res.ok) throw new Error(`Failed to load moods (${res.status})`);
      const data = await res.json();
      const sorted = [...data].sort((a, b) => entryTime(b) - entryTime(a));
      setEntries(sorted);
      const today = new Date().toISOString().split('T')[0];
      setTodayCount(sorted.filter((e) => toDateStr(e) === today).length);
    } catch (err) {
      toast.error(err.message || 'Could not load your mood history.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchMoods(); }, [fetchMoods]);

  const toggleWord = (word) =>
    setSelectedWords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setReflection('');

    const now = new Date();
    const moodData = {
      moodLabel: moodLabelFor(selectedMood),
      mood: selectedMood,
      intensity,
      notes: notes.trim(),
      emotionWords: selectedWords,
      entryNumber: todayCount + 1,
    };

    let insightText = '';
    let aiFailed = false;
    try {
      const result = await analyzeMood(moodData);
      insightText = result?.text || '';
    } catch {
      aiFailed = true;
    }

    try {
      const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/moods`, {
        method: 'POST',
        body: JSON.stringify({
          mood: selectedMood,
          intensity,
          notes: notes.trim(),
          emotionWords: selectedWords,
          aiInsights: insightText,
          date: now.toISOString().split('T')[0],
          timestamp: now.toISOString(),
          entryNumber: todayCount + 1,
        }),
      });
      if (!res.ok) throw new Error(`Failed to save (${res.status})`);
      const saved = await res.json();

      setEntries((prev) => [saved, ...prev]);
      setTodayCount((c) => c + 1);
      setReflection(insightText);

      // Reset composer
      setNotes('');
      setSelectedWords([]);
      setSelectedMood(7);
      setIntensity(6);

      if (aiFailed) {
        toast('Mood saved. AI reflection is taking a break right now.', { title: 'Saved' });
      } else {
        toast.success('Your mood was logged. Thanks for checking in.');
      }
    } catch (err) {
      toast.error(err.message || 'Could not save your mood entry.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (entry) => {
    setEditing(entry);
    setEditForm({
      mood: entry.mood || entry.intensity || 5,
      intensity: entry.intensity || 5,
      notes: entry.notes || '',
      emotionWords: entry.emotionWords || [],
    });
  };

  const toggleEditWord = (word) =>
    setEditForm((f) => ({
      ...f,
      emotionWords: f.emotionWords.includes(word)
        ? f.emotionWords.filter((w) => w !== word)
        : [...f.emotionWords, word],
    }));

  const handleEditSave = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/moods/${editing._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          mood: editForm.mood,
          intensity: editForm.intensity,
          notes: editForm.notes.trim(),
          emotionWords: editForm.emotionWords,
          aiInsights: editing.aiInsights || '',
        }),
      });
      if (!res.ok) throw new Error(`Failed to update (${res.status})`);
      setEntries((prev) =>
        prev.map((e) =>
          e._id === editing._id
            ? {
                ...e,
                mood: editForm.mood,
                intensity: editForm.intensity,
                notes: editForm.notes.trim(),
                emotionWords: editForm.emotionWords,
              }
            : e
        )
      );
      toast.success('Entry updated.');
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'Could not update this entry.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/moods/${pendingDelete._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
      const today = new Date().toISOString().split('T')[0];
      if (toDateStr(pendingDelete) === today) setTodayCount((c) => Math.max(0, c - 1));
      setEntries((prev) => prev.filter((e) => e._id !== pendingDelete._id));
      toast.success('Entry removed.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message || 'Could not delete this entry.');
    } finally {
      setDeleting(false);
    }
  };

  // ---- Derived stats ----
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const scoreOf = (e) => e.mood || e.intensity || 5;
    const last7 = entries.filter((e) => entryTime(e) >= weekAgo.getTime());

    const avg7 =
      last7.length > 0
        ? (last7.reduce((s, e) => s + scoreOf(e), 0) / last7.length).toFixed(1)
        : '—';

    // Streak: consecutive days (ending today or yesterday) with at least one entry.
    const dateSet = new Set(entries.map((e) => toDateStr(e)).filter(Boolean));
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!dateSet.has(cursor.toISOString().split('T')[0])) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dateSet.has(cursor.toISOString().split('T')[0])) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Top emotion
    const counts = {};
    entries.forEach((e) =>
      (e.emotionWords || []).forEach((w) => {
        counts[w] = (counts[w] || 0) + 1;
      })
    );
    const topEmotion =
      Object.keys(counts).length > 0
        ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
        : '—';

    return { avg7, weekCount: last7.length, streak, topEmotion };
  }, [entries]);

  const chartData = useMemo(() => {
    return [...entries]
      .sort((a, b) => entryTime(a) - entryTime(b))
      .map((e) => ({
        label: new Date(e.timestamp || e.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        value: e.mood || e.intensity || 5,
      }));
  }, [entries]);

  const current = moodMeta(selectedMood);

  return (
    <AppShell title="Mood Tracker">
      <div className="mt-page animate-in">
        <PageHeader
          eyebrow="Daily check-in"
          title="Mood Tracker"
          subtitle={
            user?.name
              ? `How are you arriving today, ${user.name.split(' ')[0]}?`
              : 'Notice it, name it, and let it pass through.'
          }
          actions={
            <Badge tone="primary" dot>
              {todayCount} {todayCount === 1 ? 'entry' : 'entries'} today
            </Badge>
          }
        />

        <div className="mt-layout">
          {/* ---------------- Composer ---------------- */}
          <Card className="mt-composer" glow>
            <div className="mt-composer__head">
              <span className="mt-composer__icon" aria-hidden="true"><Heart size={20} /></span>
              <div>
                <h2 className="mt-h2">How are you feeling?</h2>
                <p className="mt-sub">Pick the face that fits, then add a little detail.</p>
              </div>
            </div>

            {/* Mood picker */}
            <fieldset className="mt-fieldset">
              <legend className="mt-legend">Your mood</legend>
              <div className="mt-moods stagger" role="radiogroup" aria-label="Select your mood">
                {MOODS.map((m) => {
                  const active = selectedMood === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`${m.label}, ${m.value} of 10`}
                      title={`${m.label} (${m.value}/10)`}
                      className={`mt-mood ${active ? 'is-active' : ''}`}
                      style={active ? { '--mt-mood-color': m.color } : undefined}
                      onClick={() => setSelectedMood(m.value)}
                    >
                      <span className="mt-mood__emoji">{m.emoji}</span>
                      <span className="mt-mood__num">{m.value}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-mood-readout" style={{ '--mt-mood-color': current.color }}>
                <span className="mt-mood-readout__emoji">{current.emoji}</span>
                <span className="mt-mood-readout__label">{current.label}</span>
                <Badge tone="neutral">{selectedMood}/10</Badge>
              </div>
            </fieldset>

            {/* Intensity */}
            <fieldset className="mt-fieldset">
              <legend className="mt-legend">
                <Gauge size={15} /> Intensity
                <span className="mt-legend__value">{intensity}/10</span>
              </legend>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
                className="mt-range"
                aria-label="Intensity from 1 to 10"
                style={{ '--mt-range-pct': `${((intensity - 1) / 9) * 100}%` }}
              />
              <div className="mt-range-labels">
                <span>Gentle</span>
                <span>Intense</span>
              </div>
            </fieldset>

            {/* Emotion words */}
            <fieldset className="mt-fieldset">
              <legend className="mt-legend">Emotion words</legend>
              <div className="mt-chips" role="group" aria-label="Select emotion words">
                {EMOTION_WORDS.map((word) => {
                  const active = selectedWords.includes(word);
                  return (
                    <button
                      key={word}
                      type="button"
                      aria-pressed={active}
                      className={`mt-chip ${active ? 'is-active' : ''}`}
                      onClick={() => toggleWord(word)}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Notes */}
            <Field label="Notes (optional)" htmlFor="mt-notes" className="mt-fieldset">
              <Textarea
                id="mt-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What's on your mind? Any thoughts, events, or triggers that shaped today…"
              />
            </Field>

            <Button
              variant="primary"
              size="lg"
              block
              loading={saving}
              onClick={handleSave}
            >
              {!saving && <Save size={18} />}
              {saving ? 'Saving & reflecting…' : 'Save entry'}
            </Button>

            {/* AI reflection */}
            {(saving || reflection) && (
              <div className="mt-reflection animate-fade" aria-live="polite">
                <div className="mt-reflection__head">
                  <span className="mt-reflection__icon" aria-hidden="true"><Sparkles size={16} /></span>
                  <strong>AI reflection</strong>
                </div>
                {saving ? (
                  <div className="mt-reflection__loading">
                    <Skeleton height={12} radius={6} />
                    <Skeleton height={12} radius={6} style={{ width: '92%' }} />
                    <Skeleton height={12} radius={6} style={{ width: '78%' }} />
                  </div>
                ) : (
                  <p className="mt-reflection__text">{cleanInsight(reflection)}</p>
                )}
              </div>
            )}
          </Card>

          {/* ---------------- Insights column ---------------- */}
          <div className="mt-insights">
            {/* Stats */}
            <div className="mt-stats stagger">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="mt-stat-skel"><Skeleton height={56} radius={12} /></Card>
                ))
              ) : (
                <>
                  <StatCard icon={Smile} tone="primary" label="Avg mood (7d)" value={stats.avg7} />
                  <StatCard icon={CalendarDays} tone="info" label="Entries this week" value={stats.weekCount} />
                  <StatCard icon={Flame} tone="warning" label="Day streak" value={stats.streak} />
                  <StatCard icon={Heart} tone="accent" label="Top emotion" value={stats.topEmotion} />
                </>
              )}
            </div>

            {/* Trend chart */}
            <Card className="mt-chart-card">
              <div className="mt-card-head">
                <h2 className="mt-h2"><LineChartIcon size={18} /> Mood over time</h2>
                <span className="mt-sub">Every logged entry, oldest to newest</span>
              </div>
              {loading ? (
                <Skeleton height={260} radius={16} />
              ) : chartData.length === 0 ? (
                <EmptyState
                  icon={LineChartIcon}
                  title="No trend yet"
                  text="Log a few moods and your trend line will appear here."
                />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mtMoodFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.42} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: 'var(--text-subtle)' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 12, fill: 'var(--text-subtle)' }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface-solid)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        color: 'var(--text)',
                      }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                      formatter={(value) => [`${value}/10`, 'Mood']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#mtMoodFill)"
                      dot={{ r: 2.5, fill: '#8b5cf6', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* History timeline */}
            <Card className="mt-history-card">
              <div className="mt-card-head">
                <h2 className="mt-h2"><CalendarDays size={18} /> History</h2>
                {!loading && entries.length > 0 && (
                  <span className="mt-sub">{entries.length} total {entries.length === 1 ? 'entry' : 'entries'}</span>
                )}
              </div>

              {loading ? (
                <div className="mt-timeline">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="mt-tl-skel">
                      <Skeleton width={44} height={44} radius={12} />
                      <div style={{ flex: 1 }}>
                        <Skeleton height={14} radius={6} style={{ width: '40%', marginBottom: 8 }} />
                        <Skeleton height={12} radius={6} style={{ width: '70%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <EmptyState
                  icon={Brain}
                  title="No entries yet"
                  text="Your reflections will gather here. Log your first mood above to begin."
                />
              ) : (
                <ul className="mt-timeline stagger">
                  {entries.map((entry) => {
                    const score = entry.mood || entry.intensity || 5;
                    const meta = moodMeta(score);
                    const positive = score >= 6;
                    const isOpen = expanded === entry._id;
                    const hasInsight = entry.aiInsights && entry.aiInsights.trim();
                    return (
                      <li key={entry._id} className="mt-tl-item">
                        <span
                          className="mt-tl-emoji"
                          style={{ '--mt-mood-color': meta.color }}
                          aria-hidden="true"
                        >
                          {moodEmojiFor(score)}
                        </span>
                        <div className="mt-tl-body">
                          <div className="mt-tl-top">
                            <div className="mt-tl-headline">
                              <span className="mt-tl-label">{meta.label}</span>
                              <Badge tone="neutral">{score}/10</Badge>
                              <Badge tone={positive ? 'success' : 'warning'}>
                                Intensity {entry.intensity || score}
                              </Badge>
                            </div>
                            <div className="mt-tl-actions">
                              <button
                                type="button"
                                className="mt-icon-btn"
                                onClick={() => openEdit(entry)}
                                aria-label="Edit entry"
                                title="Edit"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="mt-icon-btn mt-icon-btn--danger"
                                onClick={() => setPendingDelete(entry)}
                                aria-label="Delete entry"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-tl-date">
                            {new Date(entry.timestamp || entry.date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                            {' · '}
                            {new Date(entry.timestamp || entry.date).toLocaleTimeString([], {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </div>

                          {entry.notes && <p className="mt-tl-notes">{entry.notes}</p>}

                          {entry.emotionWords && entry.emotionWords.length > 0 && (
                            <div className="mt-tl-chips">
                              {entry.emotionWords.map((w) => (
                                <span key={w} className="mt-tl-chip">{w}</span>
                              ))}
                            </div>
                          )}

                          {hasInsight && (
                            <div className="mt-tl-insight">
                              <button
                                type="button"
                                className={`mt-insight-toggle ${isOpen ? 'is-open' : ''}`}
                                onClick={() => setExpanded(isOpen ? null : entry._id)}
                                aria-expanded={isOpen}
                              >
                                <Sparkles size={14} />
                                {isOpen ? 'Hide AI reflection' : 'Show AI reflection'}
                                <ChevronDown size={15} className="mt-insight-chev" />
                              </button>
                              {isOpen && (
                                <p className="mt-insight-text animate-fade">{cleanInsight(entry.aiInsights)}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {/* ---------------- Edit modal ---------------- */}
        <Modal
          open={!!editing}
          onClose={() => !savingEdit && setEditing(null)}
          title="Edit entry"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleEditSave} loading={savingEdit}>
                Save changes
              </Button>
            </>
          }
        >
          <Field label={`Mood — ${moodLabelFor(editForm.mood)} (${editForm.mood}/10)`} htmlFor="mt-edit-mood">
            <input
              id="mt-edit-mood"
              type="range"
              min="1"
              max="10"
              step="1"
              value={editForm.mood}
              onChange={(e) => setEditForm((f) => ({ ...f, mood: parseInt(e.target.value, 10) }))}
              className="mt-range"
              style={{ '--mt-range-pct': `${((editForm.mood - 1) / 9) * 100}%` }}
            />
          </Field>

          <Field label={`Intensity (${editForm.intensity}/10)`} htmlFor="mt-edit-int">
            <input
              id="mt-edit-int"
              type="range"
              min="1"
              max="10"
              step="1"
              value={editForm.intensity}
              onChange={(e) => setEditForm((f) => ({ ...f, intensity: parseInt(e.target.value, 10) }))}
              className="mt-range"
              style={{ '--mt-range-pct': `${((editForm.intensity - 1) / 9) * 100}%` }}
            />
          </Field>

          <Field label="Emotion words">
            <div className="mt-chips" role="group" aria-label="Edit emotion words">
              {EMOTION_WORDS.map((word) => {
                const active = editForm.emotionWords.includes(word);
                return (
                  <button
                    key={word}
                    type="button"
                    aria-pressed={active}
                    className={`mt-chip ${active ? 'is-active' : ''}`}
                    onClick={() => toggleEditWord(word)}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Notes" htmlFor="mt-edit-notes">
            <Input
              id="mt-edit-notes"
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Add a note…"
            />
          </Field>
        </Modal>

        {/* ---------------- Delete confirm ---------------- */}
        <ConfirmDialog
          open={!!pendingDelete}
          onClose={() => !deleting && setPendingDelete(null)}
          onConfirm={handleDelete}
          title="Delete this entry?"
          message="This mood entry will be permanently removed. This can't be undone."
          confirmLabel="Delete"
          danger
          loading={deleting}
        />
      </div>
    </AppShell>
  );
}
