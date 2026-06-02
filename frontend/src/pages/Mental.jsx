import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Wind, Timer, NotebookPen, Palette, Sprout, Play, Pause, Square,
  RotateCcw, Plus, Trash2, Download, Eraser, Quote, Bed, Footprints,
  Apple, Users, Sparkles, Heart,
} from 'lucide-react';
import AppShell, { useAppUser } from '../components/AppShell';
import { useToast } from '../context/ToastContext';
import {
  PageHeader, Card, Button, Field, Input, Badge,
  SegmentedControl, ProgressRing, EmptyState,
} from '../components/ui';
import '../styles/Mental.css';

/* ── Static config ─────────────────────────────────────────────── */

const TABS = [
  { value: 'breathe', label: 'Breathe', icon: Wind },
  { value: 'meditate', label: 'Meditate', icon: Timer },
  { value: 'gratitude', label: 'Gratitude', icon: NotebookPen },
  { value: 'drawing', label: 'Drawing', icon: Palette },
  { value: 'healthy', label: 'Healthy Living', icon: Sprout },
];

// Box breathing: 4s each phase.
const BREATH_PHASES = [
  { key: 'inhale', label: 'Inhale', hint: 'Breathe in slowly through your nose', seconds: 4 },
  { key: 'hold1', label: 'Hold', hint: 'Hold the breath gently', seconds: 4 },
  { key: 'exhale', label: 'Exhale', hint: 'Release slowly through your mouth', seconds: 4 },
  { key: 'hold2', label: 'Hold', hint: 'Rest, empty and still', seconds: 4 },
];

const MEDITATION_PRESETS = [1, 3, 5, 10];

const GRATITUDE_KEY = 'aura-gratitude';

const SWATCHES = [
  '#0f172a', '#ef4444', '#f59e0b', '#10b981',
  '#06b6d4', '#6366f1', '#a855f7', '#ec4899',
];

const LIFESTYLE_TIPS = [
  {
    icon: Bed,
    title: 'Restful Sleep',
    tone: 'info',
    text: 'Keep a consistent sleep schedule and dim screens an hour before bed. Aim for 7–9 hours of quality rest.',
  },
  {
    icon: Footprints,
    title: 'Gentle Movement',
    tone: 'success',
    text: 'A short walk or some light stretching releases tension. Move your body in ways that feel kind, not punishing.',
  },
  {
    icon: Apple,
    title: 'Nourishing Food',
    tone: 'warning',
    text: 'Eat the rainbow, stay hydrated, and savour your meals slowly. Small, steady choices add up over time.',
  },
  {
    icon: Users,
    title: 'Real Connection',
    tone: 'accent',
    text: 'Reach out to someone you trust today. A single honest conversation can lighten a heavy day.',
  },
];

const AFFIRMATIONS = [
  'You are doing better than you think.',
  'This moment is enough. You are enough.',
  'Breathe. You have survived every hard day so far.',
  'Rest is productive. Stillness is allowed.',
  'Be gentle with yourself — you are growing.',
  'Your feelings are valid, and they will pass.',
  'Small steps still move you forward.',
];

const fmtTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/* ── Breathe module ────────────────────────────────────────────── */

function BreatheModule() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(BREATH_PHASES[0].seconds);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 1) return prev - 1;
        // advance phase
        setPhaseIndex((pi) => {
          const next = (pi + 1) % BREATH_PHASES.length;
          if (next === 0) setCycles((c) => c + 1);
          return next;
        });
        return 0; // will be reset by the phase effect below
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // when phase changes, load its duration
  useEffect(() => {
    setRemaining(BREATH_PHASES[phaseIndex].seconds);
  }, [phaseIndex]);

  const phase = BREATH_PHASES[phaseIndex];

  const toggle = () => {
    setRunning((r) => {
      const next = !r;
      if (next && cycles === 0 && phaseIndex === 0) {
        setRemaining(BREATH_PHASES[0].seconds);
      }
      return next;
    });
  };

  const reset = () => {
    setRunning(false);
    setPhaseIndex(0);
    setRemaining(BREATH_PHASES[0].seconds);
    setCycles(0);
  };

  // scale state drives the CSS animation class
  const scaleState = phase.key === 'inhale'
    ? 'expand'
    : phase.key === 'exhale'
      ? 'contract'
      : phase.key === 'hold1'
        ? 'full'
        : 'empty';

  return (
    <Card className="ms-panel" pad>
      <div className="ms-panel__head">
        <div>
          <h2 className="ms-panel__title">Box Breathing</h2>
          <p className="ms-panel__sub">Inhale 4 · Hold 4 · Exhale 4 · Hold 4</p>
        </div>
        <Badge tone="primary" dot>{cycles} {cycles === 1 ? 'cycle' : 'cycles'}</Badge>
      </div>

      <div className="ms-breathe">
        <div
          className={`ms-breathe__circle ms-breathe__circle--${scaleState} ${running ? 'is-running' : ''}`}
          aria-hidden="true"
        >
          <div className="ms-breathe__inner">
            <span className="ms-breathe__phase">{phase.label}</span>
            <span className="ms-breathe__count">{remaining || phase.seconds}</span>
          </div>
        </div>

        <p className="ms-breathe__hint" role="status" aria-live="polite">
          {running ? phase.hint : 'Find a comfortable position, then begin when you are ready.'}
        </p>

        <div className="ms-actions">
          <Button variant={running ? 'secondary' : 'primary'} onClick={toggle}>
            {running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
          </Button>
          <Button variant="ghost" onClick={reset}>
            <RotateCcw size={18} /> Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ── Meditate module ───────────────────────────────────────────── */

function MeditateModule() {
  const { toast } = useToast();
  const [minutes, setMinutes] = useState(5);
  const [remaining, setRemaining] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const audioRef = useRef(null);

  const total = minutes * 60;

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // completion side effect
  useEffect(() => {
    if (running && remaining === 0) {
      setRunning(false);
      try {
        const audio = new Audio('/bedside-clock-alarm-95792.mp3');
        audio.volume = 0.5;
        audioRef.current = audio;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => { /* autoplay may be blocked; ignore */ });
        }
      } catch {
        /* Audio unsupported; silently skip */
      }
      toast.success('Session complete. Take a moment to notice how you feel.');
    }
  }, [remaining, running, toast]);

  const choosePreset = (m) => {
    setRunning(false);
    setMinutes(m);
    setRemaining(m * 60);
  };

  const toggle = () => {
    if (remaining === 0) {
      setRemaining(total);
      setRunning(true);
      return;
    }
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(total);
  };

  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;

  return (
    <Card className="ms-panel" pad>
      <div className="ms-panel__head">
        <div>
          <h2 className="ms-panel__title">Meditation Timer</h2>
          <p className="ms-panel__sub">Pick a length, settle in, and let the chime guide you back.</p>
        </div>
        <Badge tone="accent">{minutes} min</Badge>
      </div>

      <div className="ms-presets" role="group" aria-label="Session length presets">
        {MEDITATION_PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            className={`ms-preset ${minutes === m ? 'is-active' : ''}`}
            aria-pressed={minutes === m}
            onClick={() => choosePreset(m)}
          >
            {m} min
          </button>
        ))}
      </div>

      <div className="ms-meditate">
        <ProgressRing value={progress} size={220} stroke={14}>
          <div className="ms-meditate__center">
            <span className="ms-meditate__time">{fmtTime(remaining)}</span>
            <span className="ms-meditate__label">{running ? 'breathe' : remaining === 0 ? 'done' : 'ready'}</span>
          </div>
        </ProgressRing>

        <div className="ms-actions">
          <Button variant={running ? 'secondary' : 'primary'} onClick={toggle}>
            {running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {remaining === 0 ? 'Restart' : 'Start'}</>}
          </Button>
          <Button variant="ghost" onClick={reset}>
            <Square size={16} /> Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ── Gratitude module ──────────────────────────────────────────── */

function GratitudeModule() {
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GRATITUDE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch {
      /* corrupt storage; start fresh */
    }
  }, []);

  const persist = useCallback((next) => {
    setEntries(next);
    try {
      localStorage.setItem(GRATITUDE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be full / unavailable */
    }
  }, []);

  const addEntry = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) {
      toast.error('Write a few words first.');
      return;
    }
    const entry = {
      id: Date.now(),
      text,
      date: new Date().toISOString(),
    };
    persist([entry, ...entries]);
    setDraft('');
    toast.success('Added to your gratitude journal.');
  };

  const removeEntry = (id) => {
    persist(entries.filter((it) => it.id !== id));
    toast.info('Entry removed.');
  };

  return (
    <Card className="ms-panel" pad>
      <div className="ms-panel__head">
        <div>
          <h2 className="ms-panel__title">Gratitude Journal</h2>
          <p className="ms-panel__sub">Name something good. Saved privately on this device.</p>
        </div>
        <Badge tone="success">{entries.length} {entries.length === 1 ? 'note' : 'notes'}</Badge>
      </div>

      <form className="ms-gratitude__form" onSubmit={addEntry}>
        <Field
          className="ms-gratitude__field"
          label="Today I'm grateful for…"
          htmlFor="ms-gratitude-input"
        >
          <Input
            id="ms-gratitude-input"
            icon={Heart}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="a warm cup of tea, a kind message…"
            maxLength={160}
          />
        </Field>
        <Button type="submit" variant="primary">
          <Plus size={18} /> Add
        </Button>
      </form>

      {entries.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Your journal is empty"
          text="Start with one small thing you appreciate right now."
        />
      ) : (
        <ul className="ms-gratitude__list stagger">
          {entries.map((it) => (
            <li key={it.id} className="ms-gratitude__item">
              <div className="ms-gratitude__text">
                <Quote size={16} className="ms-gratitude__quote" aria-hidden="true" />
                <div>
                  <p>{it.text}</p>
                  <time className="ms-gratitude__date" dateTime={it.date}>
                    {new Date(it.date).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </time>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Delete entry"
                onClick={() => removeEntry(it.id)}
              >
                <Trash2 size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ── Drawing module ────────────────────────────────────────────── */

function DrawingModule() {
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState('#6366f1');
  const [size, setSize] = useState(6);

  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  const pointFromEvent = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    return {
      x: (point.clientX - rect.left) * (canvas.width / rect.width),
      y: (point.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const begin = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (e.cancelable) e.preventDefault();
    drawingRef.current = true;
    const ctx = canvas.getContext('2d');
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (e.cancelable) e.preventDefault();
    const ctx = canvas.getContext('2d');
    const { x, y } = pointFromEvent(e);
    ctx.lineWidth = sizeRef.current;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colorRef.current;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const end = () => {
    drawingRef.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    toast.info('Canvas cleared.');
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'aura-drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Saved your artwork as a PNG.');
  };

  return (
    <Card className="ms-panel" pad>
      <div className="ms-panel__head">
        <div>
          <h2 className="ms-panel__title">Creative Pad</h2>
          <p className="ms-panel__sub">Let your hand wander. There is no wrong stroke.</p>
        </div>
      </div>

      <div className="ms-draw__controls">
        <Field className="ms-draw__field" label="Brush colour" htmlFor="ms-draw-color">
          <div className="ms-draw__color-row">
            <input
              id="ms-draw-color"
              className="ms-draw__colorpicker"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Pick a custom brush colour"
            />
            <div className="ms-draw__swatches" role="group" aria-label="Preset colours">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`ms-draw__swatch ${color.toLowerCase() === c.toLowerCase() ? 'is-active' : ''}`}
                  style={{ background: c }}
                  aria-label={`Use colour ${c}`}
                  aria-pressed={color.toLowerCase() === c.toLowerCase()}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </Field>

        <Field className="ms-draw__field" label={`Brush size — ${size}px`} htmlFor="ms-draw-size">
          <input
            id="ms-draw-size"
            className="ms-draw__range"
            type="range"
            min="1"
            max="40"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </Field>
      </div>

      <div className="ms-draw__stage">
        <canvas
          ref={canvasRef}
          className="ms-draw__canvas"
          width={1000}
          height={600}
          onMouseDown={begin}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={begin}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>

      <div className="ms-actions">
        <Button variant="secondary" onClick={clear}>
          <Eraser size={18} /> Clear
        </Button>
        <Button variant="primary" onClick={download}>
          <Download size={18} /> Save PNG
        </Button>
      </div>
    </Card>
  );
}

/* ── Healthy Living module ─────────────────────────────────────── */

function HealthyLivingModule() {
  const [affirmation, setAffirmation] = useState(
    () => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
  );

  useEffect(() => {
    const id = setInterval(() => {
      setAffirmation((prev) => {
        let next = prev;
        while (next === prev && AFFIRMATIONS.length > 1) {
          next = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
        }
        return next;
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ms-healthy">
      <Card className="ms-affirm" glow pad>
        <span className="ms-affirm__chip"><Sparkles size={18} /></span>
        <p className="ms-affirm__text" key={affirmation}>{affirmation}</p>
        <span className="ms-affirm__eyebrow">Daily affirmation</span>
      </Card>

      <div className="ms-tip-grid stagger">
        {LIFESTYLE_TIPS.map((tip) => {
          const Icon = tip.icon;
          return (
            <Card key={tip.title} className="ms-tip" hover pad>
              <span className={`ms-tip__icon ms-tip__icon--${tip.tone}`}>
                <Icon size={22} />
              </span>
              <h3 className="ms-tip__title">{tip.title}</h3>
              <p className="ms-tip__text">{tip.text}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function Mental() {
  const { user } = useAppUser();
  const [tab, setTab] = useState('breathe');

  const firstName = useMemo(
    () => (user?.name ? user.name.split(' ')[0] : 'friend'),
    [user]
  );

  const renderTab = () => {
    switch (tab) {
      case 'breathe': return <BreatheModule />;
      case 'meditate': return <MeditateModule />;
      case 'gratitude': return <GratitudeModule />;
      case 'drawing': return <DrawingModule />;
      case 'healthy': return <HealthyLivingModule />;
      default: return null;
    }
  };

  return (
    <AppShell title="Mindful Studio">
      <div className="ms-page animate-in">
        <PageHeader
          eyebrow="Mindful Studio"
          title={`A calm corner, ${firstName}`}
          subtitle="Breathe, meditate, reflect, create — small practices to steady your day."
        />

        <div className="ms-tabs">
          <SegmentedControl value={tab} onChange={setTab} options={TABS} />
        </div>

        <div className="ms-body">
          {renderTab()}
        </div>
      </div>
    </AppShell>
  );
}
