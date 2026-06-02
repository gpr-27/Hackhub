import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, HeartPulse, MessageCircleHeart, Sparkles, Pill, FolderHeart, ShieldCheck,
  ArrowRight, Sun, Moon, Star, Brain, Wind, Bot, Check, UserRound,
} from 'lucide-react';
import { Show, SignInButton, SignUpButton } from '@clerk/react';
import { useTheme } from '../context/ThemeContext';
import { useAppUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import config from '../config';
import { Button } from './ui/Button';
import '../styles/LandingPage.css';

const FEATURES = [
  { icon: HeartPulse, title: 'Mood Tracker', text: 'Log how you feel, spot patterns over time, and receive gentle AI reflections on every entry.', tone: 'var(--primary)' },
  { icon: MessageCircleHeart, title: 'Wellness Chat', text: 'A warm, always-available companion for therapy-style support, grounding, and crisis guidance.', tone: 'var(--accent)' },
  { icon: Sparkles, title: 'Mindful Studio', text: 'Guided breathing, meditation timers, and calming exercises designed to reset your day.', tone: 'var(--violet-500)' },
  { icon: Pill, title: 'Medication Tracker', text: 'Never miss a dose with smart reminders, schedules, and an adherence overview.', tone: 'var(--info)' },
  { icon: FolderHeart, title: 'Smart Health Records', text: 'Lab reports, prescriptions, visits and vitals — organised, searchable, always with you.', tone: 'var(--success)' },
  { icon: ShieldCheck, title: 'Private by Design', text: 'JWT-secured, encrypted, and yours alone. We never sell or share your health data.', tone: 'var(--warning)' },
];

const STEPS = [
  { icon: Activity, title: 'Create your space', text: 'Sign up in seconds and personalise your private dashboard.' },
  { icon: Brain, title: 'Check in daily', text: 'Track moods, chat with the AI, and follow mindful routines.' },
  { icon: Star, title: 'Grow with insight', text: 'Watch your trends improve and celebrate every small win.' },
];

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const { loginAsGuest } = useAppUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      navigate('/dashboard');
    } catch {
      toast.error('Could not start a guest session. Please try again.');
      setGuestLoading(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp">
      {/* Nav */}
      <header className={`lp-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="lp-nav__inner container">
          <Link to="/" className="lp-brand">
            <span className="lp-brand__mark"><Activity size={22} /></span>
            <span className="lp-brand__name">Aura</span>
          </Link>
          <nav className="lp-nav__links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#ai">AI</a>
          </nav>
          <div className="lp-nav__actions">
            <button className="lp-theme" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Show when="signed-in">
              <Button as={Link} to="/dashboard" size="sm">Open app <ArrowRight size={16} /></Button>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button type="button" className="lp-signin">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <Button size="sm">Get started</Button>
              </SignUpButton>
            </Show>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="container lp-hero__inner">
          <div className="lp-hero__copy animate-in">
            <span className="lp-pill"><Sparkles size={14} /> Powered by {config.llm.providerLabel} — lightning-fast AI</span>
            <h1 className="lp-hero__title">Take control of your <span className="gradient-text">mental wellbeing</span></h1>
            <p className="lp-hero__lead">
              Aura brings mood tracking, an empathetic AI companion, mindful exercises, medication
              reminders and your full health record into one calm, beautiful space.
            </p>
            <div className="lp-hero__cta">
              <Button as={Link} to="/register" size="lg">Start for free <ArrowRight size={18} /></Button>
              <Button variant="secondary" size="lg" onClick={handleGuest} loading={guestLoading}>
                {!guestLoading && <UserRound size={18} />} Continue as guest
              </Button>
            </div>
            <ul className="lp-hero__trust">
              <li><Check size={16} /> No credit card</li>
              <li><Check size={16} /> Private & encrypted</li>
              <li><Check size={16} /> Free forever core</li>
            </ul>
          </div>

          <div className="lp-hero__visual">
            <div className="lp-orb lp-orb--1" />
            <div className="lp-orb lp-orb--2" />
            <div className="lp-mock lp-mock--main glass">
              <div className="lp-mock__head">
                <span className="lp-mock__dot" /><span className="lp-mock__dot" /><span className="lp-mock__dot" />
                <span className="lp-mock__title">Today's check-in</span>
              </div>
              <div className="lp-mock__mood">
                <span className="lp-mock__emoji">😊</span>
                <div>
                  <strong>Feeling good</strong>
                  <span>Mood 8/10 · calm, hopeful</span>
                </div>
              </div>
              <div className="lp-mock__bars">
                {[60, 80, 45, 90, 70, 85, 75].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="lp-mock lp-mock--chat glass">
              <span className="lp-mock__bot"><Bot size={18} /></span>
              <p>“That's a wonderful step. What's one small thing you're grateful for today?”</p>
            </div>
            <div className="lp-mock lp-mock--breathe glass">
              <span className="lp-breathe"><Wind size={18} /></span>
              <div><strong>Breathe</strong><span>Inhale · 4s</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="lp-stats container">
        {[['6', 'Wellness tools'], ['24/7', 'AI support'], ['100%', 'Private'], ['∞', 'Fresh starts']].map(([n, l]) => (
          <div key={l} className="lp-stat">
            <strong className="gradient-text">{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" className="lp-section container">
        <div className="lp-section__head">
          <span className="lp-eyebrow">Everything you need</span>
          <h2>One companion for your whole wellbeing</h2>
          <p>Thoughtfully crafted tools that work together to help you feel a little better, every day.</p>
        </div>
        <div className="lp-features stagger">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <article key={f.title} className="lp-feature ui-card ui-card--hover ui-card--pad">
                <span className="lp-feature__icon" style={{ background: `color-mix(in srgb, ${f.tone} 14%, transparent)`, color: f.tone }}>
                  <Icon size={26} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="lp-section container">
        <div className="lp-section__head">
          <span className="lp-eyebrow">Simple by design</span>
          <h2>Feel better in three steps</h2>
        </div>
        <div className="lp-steps">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="lp-step">
                <span className="lp-step__num">{i + 1}</span>
                <span className="lp-step__icon"><Icon size={26} /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI band */}
      <section id="ai" className="lp-ai">
        <div className="container lp-ai__inner glass">
          <div className="lp-ai__copy">
            <span className="lp-eyebrow">Intelligent & instant</span>
            <h2>An AI companion that actually listens</h2>
            <p>
              Aura's assistant is powered by {config.llm.providerLabel}'s ultra-low-latency LLM inference, so empathetic,
              tailored support arrives in the blink of an eye — with therapy, meditation, wellness
              and crisis modes designed for real moments.
            </p>
            <Button as={Link} to="/register" size="lg">Try the AI companion <ArrowRight size={18} /></Button>
          </div>
          <div className="lp-ai__chat">
            <div className="lp-bubble lp-bubble--user">I've been feeling really overwhelmed lately.</div>
            <div className="lp-bubble lp-bubble--bot">
              <span className="lp-bubble__bot"><Bot size={16} /></span>
              <div>
                I hear you, and it's okay to feel this way.
                <ul><li>Try one slow breath — in for 4, out for 6</li><li>Name the heaviest thing on your mind</li></ul>
                What feels most pressing right now?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta container">
        <div className="lp-cta__card">
          <h2>Your calmer mind starts today</h2>
          <p>Join Aura and turn small daily check-ins into lasting wellbeing.</p>
          <Button as={Link} to="/register" size="lg" variant="accent">Create your free account <ArrowRight size={18} /></Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="container lp-footer__inner">
          <div className="lp-brand">
            <span className="lp-brand__mark"><Activity size={20} /></span>
            <span className="lp-brand__name">Aura</span>
          </div>
          <p className="subtle">© {new Date().getFullYear()} Aura — Mental Wellness. Crafted with care. 💜</p>
          <div className="lp-footer__links">
            <a href="#features">Features</a>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
