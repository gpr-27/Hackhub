import React from 'react';

/**
 * ProgressRing — circular progress with a gradient stroke and centered label.
 * Props: value (0-100), size, stroke, color, trackColor, children (center label).
 */
export function ProgressRing({
  value = 0,
  size = 120,
  stroke = 10,
  color = 'var(--primary)',
  trackColor = 'var(--surface-2)',
  gradient = true,
  children,
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circ - (clamped / 100) * circ;
  const gid = `ring-grad-${Math.round(radius)}-${Math.round(clamped)}`;

  return (
    <div className="ui-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {gradient && (
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradient ? `url(#${gid})` : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s var(--ease)' }}
        />
      </svg>
      <div className="ui-ring__label">{children}</div>
    </div>
  );
}

export default ProgressRing;
