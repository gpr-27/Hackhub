import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, HeartPulse, MessageCircleHeart, Sparkles, Pill, FolderHeart,
  Menu, X, PanelLeftClose, PanelLeftOpen, Sun, Moon, Activity, LogOut,
} from 'lucide-react';
import { UserButton, SignUpButton } from '@clerk/react';
import { useTheme } from '../context/ThemeContext';
import { useAppUser } from '../context/UserContext';
import { Loader } from './ui/Feedback';
import { cn } from '../lib/cn';
import '../styles/AppShell.css';

// Re-exported for backwards compatibility: pages import useAppUser from here.
export { useAppUser } from '../context/UserContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/mood-tracker', label: 'Mood Tracker', icon: HeartPulse },
  { to: '/health-chat', label: 'Wellness Chat', icon: MessageCircleHeart },
  { to: '/mental', label: 'Mindful Studio', icon: Sparkles },
  { to: '/medication-tracker', label: 'Medications', icon: Pill },
  { to: '/smart-health-record', label: 'Health Records', icon: FolderHeart },
];

function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      className={cn('shell-iconbtn', compact && 'shell-iconbtn--sm')}
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}

/**
 * AppShell — the authenticated layout (sidebar + topbar + content).
 * Wrap every protected page: <AppShell title="…"> {content} </AppShell>.
 * The signed-in user comes from Clerk via useAppUser(); the account menu and
 * sign-out are handled by Clerk's <UserButton />.
 */
export function AppShell({ children, title, subtitle, maxWidth }) {
  const { user, loading, isGuest, logout } = useAppUser();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('aura-sidebar') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      localStorage.setItem('aura-sidebar', c ? '0' : '1');
      return !c;
    });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Loader label="Preparing your space…" />
      </div>
    );
  }

  const isActive = (to) =>
    to === '/smart-health-record'
      ? location.pathname.startsWith('/smart-health-record')
      : location.pathname === to;

  return (
      <div className={cn('shell', collapsed && 'shell--collapsed', mobileOpen && 'shell--mobile-open')}>
        {/* Sidebar */}
        <aside className="shell-sidebar">
          <div className="shell-brand">
            <span className="shell-brand__mark"><Activity size={22} /></span>
            <span className="shell-brand__text">
              <strong>Aura</strong>
              <small>Mental Wellness</small>
            </span>
          </div>

          <nav className="shell-nav">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className={cn('shell-nav__link', isActive(item.to) && 'is-active')} title={item.label}>
                  <span className="shell-nav__icon"><Icon size={21} /></span>
                  <span className="shell-nav__label">{item.label}</span>
                  {isActive(item.to) && <span className="shell-nav__indicator" />}
                </Link>
              );
            })}
          </nav>

          <div className="shell-sidebar__foot">
            <div className="shell-tip">
              <Sparkles size={16} />
              <p>You showed up today. That matters. 💜</p>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        <div className="shell-backdrop" onClick={() => setMobileOpen(false)} />

        {/* Main */}
        <div className="shell-main">
          <header className="shell-topbar glass">
            <div className="shell-topbar__left">
              <button className="shell-iconbtn shell-iconbtn--mobile" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
              <button className="shell-iconbtn shell-iconbtn--desk" onClick={toggleCollapse} aria-label="Toggle sidebar">
                {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>
              {title && (
                <div className="shell-topbar__title">
                  <strong>{title}</strong>
                  {subtitle && <span>{subtitle}</span>}
                </div>
              )}
            </div>
            <div className="shell-topbar__right">
              <ThemeToggle />
              {isGuest ? (
                <>
                  <span className="shell-guest-badge">Guest</span>
                  <button
                    className="shell-iconbtn shell-iconbtn--sm"
                    onClick={logout}
                    aria-label="Exit guest session"
                    title="Exit guest session"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <>
                  {user?.name && <span className="shell-username">{user.name}</span>}
                  <UserButton afterSignOutUrl="/">
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Health Profile"
                        labelIcon={<FolderHeart size={16} />}
                        href="/smart-health-record/profile"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </>
              )}
            </div>
            {/* mobile drawer close */}
            <button className="shell-iconbtn shell-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X size={20} />
            </button>
          </header>

          {isGuest && (
            <div className="shell-guest-banner">
              <Sparkles size={15} />
              <span>
                You're using Aura as a guest. <strong>Create an account</strong> to permanently save and sync your work.
              </span>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button type="button" className="shell-guest-banner__btn">Create account</button>
              </SignUpButton>
            </div>
          )}

          <main className="shell-content">
            <div className="shell-content__inner" style={maxWidth ? { maxWidth } : undefined}>
              {children}
            </div>
          </main>
        </div>
      </div>
  );
}

export default AppShell;
