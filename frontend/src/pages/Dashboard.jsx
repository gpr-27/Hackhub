import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sunrise, Sun, Sunset, Moon, Sparkles, ArrowRight, ArrowUpRight,
  CalendarDays, Flame, Gauge, Pill, HeartPulse, MessageCircleHeart,
  FolderHeart, Activity, Clock, Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import AppShell, { useAppUser } from '../components/AppShell';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import {
  PageHeader, Card, Button, Badge, StatCard, EmptyState, Skeleton,
} from '../components/ui';
import '../styles/Dashboard.css';

// Compact mood scale (1-10) for emoji + label rendering on the dashboard.
const MOOD_SCALE = [
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🙂', label: 'Content' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '😄', label: 'Joyful' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '🌟', label: 'Excited' },
  { emoji: '😍', label: 'Euphoric' },
  { emoji: '🤩', label: 'Blissful' },
];

const moodMeta = (score) => {
  const idx = Math.min(Math.max(Math.round(score || 5), 1), 10) - 1;
  return MOOD_SCALE[idx] || MOOD_SCALE[2];
};

const DAILY_TIPS = [
  'Take three slow breaths. Inhale calm, exhale tension.',
  'Name one thing you are grateful for right now.',
  'A short walk can reset your whole mood. Try five minutes.',
  'Hydrate. Your mind works better when your body is cared for.',
  'Progress, not perfection. Small steps still move you forward.',
  'Unclench your jaw and drop your shoulders. You are safe.',
  'Reach out to someone you trust. Connection is medicine.',
];

const greetingFor = (hour) => {
  if (hour < 5) return { text: 'Still up', Icon: Moon };
  if (hour < 12) return { text: 'Good morning', Icon: Sunrise };
  if (hour < 17) return { text: 'Good afternoon', Icon: Sun };
  if (hour < 21) return { text: 'Good evening', Icon: Sunset };
  return { text: 'Good night', Icon: Moon };
};

const firstNameOf = (name) => {
  const n = String(name || '').trim();
  if (!n) return 'there';
  return n.split(/\s+/)[0];
};

const dateKey = (entry) => {
  const raw = entry.timestamp || entry.date;
  if (!raw) return '';
  return String(raw).split('T')[0];
};

const sortByTime = (a, b) =>
  new Date(b.timestamp || b.date || 0) - new Date(a.timestamp || a.date || 0);

const TOOLS = [
  {
    to: '/mood-tracker', title: 'Mood Tracker', Icon: HeartPulse, tone: 'primary',
    desc: 'Log how you feel and watch your patterns unfold.',
  },
  {
    to: '/health-chat', title: 'Wellness Chat', Icon: MessageCircleHeart, tone: 'accent',
    desc: 'Talk it through with an always-on supportive companion.',
  },
  {
    to: '/mental', title: 'Mindful Studio', Icon: Sparkles, tone: 'info',
    desc: 'Guided meditation, breathing and creative calm.',
  },
  {
    to: '/medication-tracker', title: 'Medications', Icon: Pill, tone: 'success',
    desc: 'Schedule doses and never miss your routine.',
  },
  {
    to: '/smart-health-record', title: 'Health Records', Icon: FolderHeart, tone: 'warning',
    desc: 'Keep your medical history secure and in one place.',
  },
  {
    to: '/smart-health-record/vital-signs', title: 'Vital Signs', Icon: Activity, tone: 'danger',
    desc: 'Track heart rate, blood pressure and more over time.',
  },
];

export default function Dashboard() {
  const { user } = useAppUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [moods, setMoods] = useState([]);
  const [medications, setMedications] = useState([]);

  const tip = useMemo(
    () => DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length],
    []
  );
  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);
  const firstName = firstNameOf(user?.name);

  const loadData = useCallback(async () => {
    setLoading(true);
    let failed = false;

    try {
      const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/moods`, { method: 'GET' });
      if (!res.ok) throw new Error('moods');
      const data = await res.json();
      setMoods(Array.isArray(data) ? data : []);
    } catch {
      failed = true;
      setMoods([]);
    }

    try {
      const res = await makeAuthenticatedRequest(`${API_BASE_URL}/api/medications`, { method: 'GET' });
      if (!res.ok) throw new Error('medications');
      const data = await res.json();
      setMedications(Array.isArray(data) ? data : []);
    } catch {
      failed = true;
      setMedications([]);
    }

    if (failed) {
      toast.error('Some of your data could not be loaded. Showing what we have.');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived stats
  const stats = useMemo(() => {
    const now = new Date();

    // Entries this week (last 7 days inclusive of today).
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    const entriesThisWeek = moods.filter((m) => {
      const d = new Date(m.timestamp || m.date || 0);
      return d >= weekAgo;
    }).length;

    // Current check-in streak: consecutive days (back from today) with an entry.
    const daySet = new Set(moods.map(dateKey).filter(Boolean));
    let streak = 0;
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    // Allow the streak to start either today or yesterday.
    const todayKey = cursor.toISOString().split('T')[0];
    if (!daySet.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const key = cursor.toISOString().split('T')[0];
      if (daySet.has(key)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    // Average mood over the last 7 entries.
    const recent = [...moods].sort(sortByTime).slice(0, 7);
    const avg = recent.length
      ? (
          recent.reduce((sum, m) => sum + (m.mood || m.intensity || 5), 0) / recent.length
        ).toFixed(1)
      : '—';

    return {
      entriesThisWeek,
      streak,
      avg,
      meds: medications.length,
    };
  }, [moods, medications]);

  // Recent check-ins (last 4, newest first)
  const recentMoods = useMemo(
    () => [...moods].sort(sortByTime).slice(0, 4),
    [moods]
  );

  // Chart data: last 7 entries oldest→newest, labelled by date.
  const chartData = useMemo(() => {
    return [...moods]
      .sort((a, b) => new Date(a.timestamp || a.date || 0) - new Date(b.timestamp || b.date || 0))
      .slice(-7)
      .map((m) => ({
        label: new Date(m.timestamp || m.date || Date.now()).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        value: m.mood || m.intensity || 5,
      }));
  }, [moods]);

  // Today's medications grouped by time.
  const todaysMeds = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return medications
      .filter((m) => !m.tillDate || m.tillDate >= today)
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
      .slice(0, 5);
  }, [medications]);

  return (
    <AppShell title="Dashboard">
      <PageHeader
        eyebrow="Your space"
        title="Dashboard"
        subtitle="A calm overview of your wellbeing, all in one place."
        actions={
          <Button as={Link} to="/mood-tracker" variant="primary">
            <HeartPulse size={18} /> Check in
          </Button>
        }
      />

      <div className="dash-page animate-in">
        {/* Stats */}
        <section aria-label="Your wellbeing at a glance" className="dash-stats stagger">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="dash-stat-skel">
                <Skeleton width={48} height={48} radius="var(--radius-md)" />
                <div className="dash-stat-skel__lines">
                  <Skeleton width="60%" height={22} radius="8px" />
                  <Skeleton width="80%" height={12} radius="6px" />
                </div>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                icon={CalendarDays}
                label="Check-ins this week"
                value={stats.entriesThisWeek}
                tone="primary"
                gradient="var(--gradient-brand)"
              />
              <StatCard
                icon={Flame}
                label="Current streak"
                value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`}
                tone="warning"
              />
              <StatCard
                icon={Gauge}
                label="Avg mood (last 7)"
                value={stats.avg === '—' ? '—' : `${stats.avg}/10`}
                tone="accent"
              />
              <StatCard
                icon={Pill}
                label="Medications"
                value={stats.meds}
                tone="success"
              />
            </>
          )}
        </section>

        {/* Hero + recent column */}
        <div className="dash-split">
          {/* Welcome hero */}
          <Card glow className="dash-hero">
            <div className="dash-hero__glow" aria-hidden="true" />
            <div className="dash-hero__body">
              <span className="dash-hero__greet">
                <greeting.Icon size={18} />
                {greeting.text}
              </span>
              <h2 className="dash-hero__title">
                {firstName}, how are you <span className="gradient-text">feeling</span> today?
              </h2>
              <div className="dash-hero__tip">
                <span className="dash-hero__tip-icon"><Lightbulb size={18} /></span>
                <p>{tip}</p>
              </div>
              <div className="dash-hero__cta">
                <Button as={Link} to="/mood-tracker" variant="primary" size="lg">
                  How are you feeling today? <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent check-ins */}
          <Card className="dash-recent">
            <div className="dash-section-head">
              <div>
                <h3 className="dash-section-head__title">Recent check-ins</h3>
                <p className="dash-section-head__sub muted">Your latest mood entries</p>
              </div>
              <Button as={Link} to="/mood-tracker" variant="ghost" size="sm">
                View all <ArrowUpRight size={15} />
              </Button>
            </div>

            {loading ? (
              <div className="dash-recent__list">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="dash-recent__row">
                    <Skeleton width={40} height={40} radius="var(--radius-sm)" />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="50%" height={13} radius="6px" />
                      <Skeleton width="35%" height={11} radius="6px" style={{ marginTop: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentMoods.length === 0 ? (
              <EmptyState
                icon={HeartPulse}
                title="No check-ins yet"
                text="Log your first mood to start seeing your patterns here."
                action={
                  <Button as={Link} to="/mood-tracker" variant="primary" size="sm">
                    Log a mood
                  </Button>
                }
              />
            ) : (
              <ul className="dash-recent__list" aria-label="Recent mood entries">
                {recentMoods.map((m) => {
                  const score = m.mood || m.intensity || 5;
                  const meta = moodMeta(score);
                  const positive = score >= 6;
                  const when = new Date(m.timestamp || m.date || Date.now());
                  return (
                    <li key={m._id || `${m.timestamp}-${score}`} className="dash-recent__row">
                      <span className="dash-recent__emoji" aria-hidden="true">{meta.emoji}</span>
                      <div className="dash-recent__info">
                        <span className="dash-recent__label">
                          {meta.label} · {score}/10
                        </span>
                        <span className="dash-recent__date muted">
                          {when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          {' · '}
                          {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <Badge tone={positive ? 'success' : 'info'} dot>
                        {positive ? 'Positive' : 'Reflective'}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Mood trend chart */}
        <Card className="dash-chart">
          <div className="dash-section-head">
            <div>
              <h3 className="dash-section-head__title">Mood trend</h3>
              <p className="dash-section-head__sub muted">Your last 7 check-ins</p>
            </div>
            <Badge tone="primary">{chartData.length} pts</Badge>
          </div>

          {loading ? (
            <Skeleton width="100%" height={240} radius="var(--radius-md)" />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={Gauge}
              title="Nothing to chart yet"
              text="Once you log a few moods, your trend line appears here."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashMoodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'var(--text-subtle)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 12, fill: 'var(--text-subtle)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-solid)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--text)',
                  }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  formatter={(v) => [`${v}/10`, 'Mood']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#7c5cff"
                  strokeWidth={2.5}
                  fill="url(#dashMoodGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Quick actions */}
        <section aria-label="Your tools">
          <div className="dash-section-head dash-section-head--bare">
            <div>
              <h3 className="dash-section-head__title">Your tools</h3>
              <p className="dash-section-head__sub muted">Everything you need, one tap away</p>
            </div>
          </div>
          <div className="dash-tools stagger">
            {TOOLS.map(({ to, title, Icon, desc, tone }) => (
              <Card key={to} hover as={Link} to={to} className="dash-tool">
                <span className={`dash-tool__icon dash-tool__icon--${tone}`}>
                  <Icon size={22} />
                </span>
                <div className="dash-tool__text">
                  <h4 className="dash-tool__title">{title}</h4>
                  <p className="dash-tool__desc muted">{desc}</p>
                </div>
                <ArrowRight size={18} className="dash-tool__arrow" />
              </Card>
            ))}
          </div>
        </section>

        {/* Medications preview */}
        {!loading && medications.length > 0 && (
          <Card className="dash-meds animate-in">
            <div className="dash-section-head">
              <div>
                <h3 className="dash-section-head__title">Today's medications</h3>
                <p className="dash-section-head__sub muted">By scheduled time</p>
              </div>
              <Button as={Link} to="/medication-tracker" variant="ghost" size="sm">
                Manage <ArrowUpRight size={15} />
              </Button>
            </div>

            {todaysMeds.length === 0 ? (
              <EmptyState
                icon={Pill}
                title="Nothing due today"
                text="You're all clear — no active medications scheduled for today."
              />
            ) : (
              <ul className="dash-meds__list" aria-label="Today's medications">
                {todaysMeds.map((m) => (
                  <li key={m._id || `${m.name}-${m.time}`} className="dash-meds__row">
                    <span className="dash-meds__time">
                      <Clock size={14} /> {m.time || '—'}
                    </span>
                    <span className="dash-meds__name">{m.name}</span>
                    {m.dosage && <Badge tone="neutral">{m.dosage}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
