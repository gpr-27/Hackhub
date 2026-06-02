import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';
import { cn } from '../../lib/cn';

/**
 * StatCard — a headline metric with icon and optional trend.
 * Props: icon (lucide component), label, value, tone (color of icon chip),
 * trend ({ dir: 'up'|'down', value: string }), gradient (CSS for icon chip bg).
 */
export function StatCard({ icon: Icon, label, value, tone = 'primary', trend, gradient, className }) {
  const toneVar = {
    primary: 'var(--primary)',
    accent: 'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    info: 'var(--info)',
  }[tone] || 'var(--primary)';
  const toneSoft = {
    primary: 'var(--primary-soft)',
    accent: 'var(--accent-soft)',
    success: 'var(--success-soft)',
    warning: 'var(--warning-soft)',
    danger: 'var(--danger-soft)',
    info: 'var(--info-soft)',
  }[tone] || 'var(--primary-soft)';

  return (
    <Card pad={false} hover className={cn('ui-stat', className)}>
      <div className="ui-stat__icon" style={{ background: gradient || toneSoft, color: gradient ? '#fff' : toneVar }}>
        {Icon && <Icon size={24} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="ui-stat__value">{value}</div>
        <div className="ui-stat__label">{label}</div>
        {trend && (
          <span className="ui-stat__trend" style={{ color: trend.dir === 'down' ? 'var(--danger)' : 'var(--success)' }}>
            {trend.dir === 'down' ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
            {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}

export default StatCard;
