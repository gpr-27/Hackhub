import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Sparkles, HeartPulse } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import '../styles/Auth.css';

const HIGHLIGHTS = [
  { icon: HeartPulse, title: 'Mood intelligence', text: 'Track feelings and get gentle, AI-guided reflections.' },
  { icon: Sparkles, title: 'Mindful studio', text: 'Breathing, meditation and grounding exercises.' },
  { icon: ShieldCheck, title: 'Private & secure', text: 'Your data is encrypted and never sold. Ever.' },
];

/**
 * AuthLayout — split-screen frame for the sign-in / sign-up / reset screens.
 * Left: a branded showcase panel. Right: the form card (passed as children).
 */
export function AuthLayout({ title, subtitle, children, footer }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="auth-shell">
      <button className="auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Showcase */}
      <aside className="auth-showcase">
        <div className="auth-showcase__inner">
          <Link to="/" className="auth-brand">
            <span className="auth-brand__mark"><Activity size={24} /></span>
            <span>Aura</span>
          </Link>
          <h2 className="auth-showcase__title">A calmer mind starts with a single check-in.</h2>
          <p className="auth-showcase__lead">
            Your all-in-one companion for mood, mindfulness, medications and health records —
            thoughtfully designed to help you feel a little better, every day.
          </p>
          <ul className="auth-highlights">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <li key={h.title}>
                  <span className="auth-highlights__icon"><Icon size={20} /></span>
                  <div>
                    <strong>{h.title}</strong>
                    <span>{h.text}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="auth-showcase__orb auth-showcase__orb--1" />
        <div className="auth-showcase__orb auth-showcase__orb--2" />
      </aside>

      {/* Form */}
      <main className="auth-panel">
        <div className="auth-card animate-in">
          <Link to="/" className="auth-brand auth-brand--mobile">
            <span className="auth-brand__mark"><Activity size={22} /></span>
            <span>Aura</span>
          </Link>
          <div className="auth-card__head">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="auth-card__foot">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
