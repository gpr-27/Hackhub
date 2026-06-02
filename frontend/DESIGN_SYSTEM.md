# AURA Design System — Build Reference

This app uses **React 19 + react-router-dom 7 + CRA (react-scripts)**, plain CSS
driven by **design tokens** (CSS variables), **lucide-react** for icons, and
**recharts** for charts. Follow this guide EXACTLY so every page is consistent.

## Golden rules
1. **Never hard-code colors.** Only use the CSS variables (tokens) below, so light/dark themes work. e.g. `color: var(--text)`, `background: var(--surface)`.
2. **Icons:** use `lucide-react` (e.g. `import { Heart } from 'lucide-react'`). Emoji are allowed ONLY as expressive content (mood faces, affirmations) — never as primary UI controls.
3. **Every authenticated page** must render its content inside `<AppShell>` (gives the sidebar + topbar). Do NOT build your own navbar/footer.
4. Use the shared **UI kit** from `../components/ui` for all buttons, cards, inputs, modals, badges, etc. Don't reinvent them.
5. Use **`useToast()`** for all success/error feedback. Use **loading skeletons/Loader** while fetching and **EmptyState** when a list is empty.
6. **Preserve every backend API call and data shape** of the page you rewrite (see API contract). Same endpoints, same request bodies, same fields.
7. Each page owns exactly TWO files: `src/pages/<Name>.jsx` and `src/styles/<Name>.css`. Import the CSS at the top of the JSX. Page-specific class names should be prefixed to avoid clashes (e.g. `.mt-…` for MoodTracker). Rely on tokens + ui classes; only add page CSS for layout unique to that page.
8. Fully **responsive** (mobile → desktop) and **accessible** (labels, aria, keyboard). Respect `prefers-reduced-motion` (the global CSS already handles animation utilities).
9. Add tasteful entrance animation: put `className="animate-in"` on the main wrapper or `stagger` on a grid of cards. These keyframes already exist globally.

## Imports you will use
```js
import AppShell, { useAppUser } from '../components/AppShell';   // useAppUser() -> { user, logout, reload }
import { useToast } from '../context/ToastContext';             // const { toast } = useToast(); toast.success('..'); toast.error('..')
import { useTheme } from '../context/ThemeContext';             // { theme, toggleTheme }
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import { sendChat, analyzeMood } from '../lib/ai';               // Groq-backed AI helpers
import {
  Button, Card, Field, Input, Textarea, Select, Badge,
  Spinner, Loader, Skeleton, EmptyState, StatCard, PageHeader,
  Modal, ConfirmDialog, SegmentedControl, ProgressRing,
} from '../components/ui';
import RecordManager from '../components/RecordManager';          // generic CRUD (record pages only)
```

`makeAuthenticatedRequest(url, options)` is a `fetch` wrapper that attaches the JWT and JSON/CORS defaults. Always pass full URL `` `${API_BASE_URL}/api/...` ``. Body must be `JSON.stringify(...)`. It returns a raw `Response` (call `.json()` / check `.ok`).

## UI kit API (props)
- **Button** `variant=primary|accent|secondary|ghost|danger|outline`, `size=sm|md|lg`, `loading`, `block`, `iconOnly`, `as={Link} to="..."`. Put a lucide icon as a child: `<Button><Plus size={18}/> Add</Button>`.
- **Card** `pad` (default true), `hover`, `glow`, `solid`, `as`. Glassmorphism surface.
- **Field** `label`, `htmlFor`, `hint`, `error` — wraps an Input/Textarea/Select.
- **Input** `icon={LucideIcon}` (leading icon), `invalid`, plus native input props.
- **Textarea**, **Select** (`<Select><option/></Select>`), with `invalid`.
- **Badge** `tone=neutral|primary|success|warning|danger|info|accent`, `dot`.
- **Spinner** `size=md|lg`. **Loader** `label`. **Skeleton** `width`,`height`,`radius`.
- **EmptyState** `icon={LucideIcon}`, `title`, `text`, `action={<Button/>}`.
- **StatCard** `icon`, `label`, `value`, `tone`, `trend={{dir:'up'|'down', value:'+12%'}}`, `gradient` (CSS string for icon chip bg).
- **PageHeader** `eyebrow`, `title`, `subtitle`, `actions` (node). Use ONE per page, as the first child inside AppShell.
- **Modal** `open`, `onClose`, `title`, `footer`, `size=sm|md|lg`. Closes on Esc/backdrop, locks scroll.
- **ConfirmDialog** `open`, `onClose`, `onConfirm`, `title`, `message`, `confirmLabel`, `danger`, `loading`.
- **SegmentedControl** `value`, `onChange`, `options=[{value,label,icon}]` — pill tab switcher.
- **ProgressRing** `value` (0-100), `size`, `stroke`, `gradient`, `children` (center label).
- **AppShell** `title`, `subtitle`, `maxWidth`, children. Handles auth gating + chrome; access the logged-in user via `useAppUser()`.

## Design tokens (CSS variables — use these, never raw colors)
Colors: `--bg --surface --surface-2 --surface-solid --surface-hover --border --border-strong`
Text: `--text --text-muted --text-subtle --text-inverse`
Brand/semantic: `--primary --primary-strong --primary-soft --accent --accent-soft --success --success-soft --warning --warning-soft --danger --danger-soft --info --info-soft`
Gradients: `--gradient-brand --gradient-teal --gradient-sunset --gradient-aurora`
Radii: `--radius-xs(8) --radius-sm(12) --radius-md(16) --radius-lg(22) --radius-xl(30) --radius-pill`
Shadows: `--shadow-xs --shadow-sm --shadow-md --shadow-lg --shadow-xl --shadow-glow`
Type: `--font-sans --font-display --fs-xs --fs-sm --fs-base --fs-md --fs-lg --fs-xl --fs-2xl --fs-3xl`
Motion: `--dur-fast --dur --dur-slow --ease --ease-spring`
Fonts: headings use `--font-display` (Sora) automatically via h1-h4.

Utility classes available globally: `.glass .gradient-text .muted .subtle .container .animate-in .animate-fade .animate-scale .animate-pop .stagger` (stagger animates direct children in sequence). Keyframes: `fadeInUp fadeIn fadeInScale popIn slideInRight shimmer spin float pulseGlow gradientShift breathe`.

CSS pattern for a page-specific stat/grid:
```css
.xx-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 1.2rem; }
@media (max-width: 640px) { .xx-grid { grid-template-columns: 1fr; } }
```

## recharts usage (charts)
Wrap charts in `<ResponsiveContainer width="100%" height={260}>`. Use token-driven colors via `stroke="var(--primary)"`. Example:
```jsx
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
<ResponsiveContainer width="100%" height={260}>
  <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
    </linearGradient></defs>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false}/>
    <YAxis tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false}/>
    <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 12 }}/>
    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#g)"/>
  </AreaChart>
</ResponsiveContainer>
```
Charts must handle empty data gracefully (show an EmptyState instead of an empty chart).

## Page skeleton (copy this shape)
```jsx
import React, { useEffect, useState } from 'react';
import { /* lucide icons */ } from 'lucide-react';
import AppShell, { useAppUser } from '../components/AppShell';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import { PageHeader, Card, Button, /* ... */ } from '../components/ui';
import '../styles/MyPage.css';

export default function MyPage() {
  const { user } = useAppUser();
  const { toast } = useToast();
  // ... state + effects ...
  return (
    <AppShell title="My Page">
      <PageHeader eyebrow="Section" title="My Page" subtitle="…" actions={<Button>…</Button>} />
      {/* content */}
    </AppShell>
  );
}
```

---

# Backend API contract (DO NOT CHANGE — match exactly)
Base: `${API_BASE_URL}` (default http://localhost:3001). All require auth via the JWT (handled by `makeAuthenticatedRequest`). Responses are JSON.

### Auth (already implemented elsewhere; for reference)
- `POST /api/login` {email,password} → {token,id,email,name,...}
- `POST /api/register` {name,email,password} → {message}
- `GET /api/auth/check` → {isAuthenticated, user}
- `GET /api/auth/profile` → {id,name,email,avatar,phone,dateOfBirth,gender,address,...}
- `PUT /api/auth/profile` {name,email,avatar,phone,dateOfBirth,gender,address} → {message,user}
- `POST /api/auth/logout`

### AI (Groq-backed) — use `lib/ai`
- `POST /api/ai/chat` body `{mode, message}` where mode ∈ therapy|meditation|crisis|wellness → `{text, fallback}`
- `POST /api/ai/chat` body `{mode:'mood', moodData}` → `{text, fallback}` (moodData: {moodLabel,mood,intensity,notes,emotionWords,entryNumber})
- Prefer the helpers: `sendChat(message, mode)` and `analyzeMood(moodData)`.

### Chat history
- `GET /api/chat/messages` → [{_id,userId,sender:'user'|'bot',message,timestamp}]
- `POST /api/chat/messages` {message, sender} → saved message

### Moods
- `GET /api/moods` → [{_id,mood(1-10),intensity(1-10),notes,emotionWords:[String],aiInsights,date(string),timestamp,entryNumber}]
- `POST /api/moods` {mood,intensity,notes,emotionWords,aiInsights,date,timestamp,entryNumber} (mood,intensity,date required)
- `PUT /api/moods/:id` {mood,intensity,notes,emotionWords,aiInsights}
- `DELETE /api/moods/:id`

### Medications
- `GET /api/medications` → [{_id,name,time,dosage,tillDate}]
- `POST /api/medications` {name,time,dosage,tillDate}
- `PUT /api/medications/:id` {name,time,dosage,tillDate}
- `DELETE /api/medications/:id`

### Health profile (singleton upsert)
- `GET /api/health-profile` → {} or {_id,dateOfBirth,gender,bloodType,height,weight,allergies:[String],chronicConditions:[String],emergencyContact,insurance:{provider,policyNumber,groupNumber},lastUpdated}
- `POST /api/health-profile` (same body) → upserts and returns the profile

### Emergency contacts (CRUD)
- `GET/POST /api/emergency-contacts`, `PUT/DELETE /api/emergency-contacts/:id`
- Model: {_id,name(req),relationship,phone(req),type:'family'|'medical'|'friend'|'work'}

### Other record collections (CRUD; handled by RecordManager already)
- `/api/medical-history`, `/api/lab-reports`, `/api/doctor-visits`, `/api/prescriptions`, `/api/vital-signs`
- vital-signs model: {_id,date(req),heartRate,systolicBP,diastolicBP,temperature,weight,height,bloodGlucose,oxygenSaturation,respiratoryRate,status:'normal'|'abnormal',notes}
