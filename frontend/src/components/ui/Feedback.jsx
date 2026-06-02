import React from 'react';
import { cn } from '../../lib/cn';

/** Spinner — inline loading indicator. size: md | lg */
export function Spinner({ size = 'md', className }) {
  return <span className={cn('ui-spinner', size === 'lg' && 'ui-spinner--lg', className)} aria-hidden="true" />;
}

/** Loader — centered spinner + label, for full-section loading states. */
export function Loader({ label = 'Loading…', className }) {
  return (
    <div className={cn('ui-loader', className)} role="status">
      <Spinner size="lg" />
      <span>{label}</span>
    </div>
  );
}

/** Skeleton — shimmering placeholder block. */
export function Skeleton({ width, height, radius, className, style }) {
  return (
    <span
      className={cn('ui-skeleton', className)}
      style={{ width, height, borderRadius: radius, display: 'block', ...style }}
      aria-hidden="true"
    />
  );
}

/** EmptyState — friendly nudge when a list/section has no data yet. */
export function EmptyState({ icon: Icon, title, text, action, className }) {
  return (
    <div className={cn('ui-empty', className)}>
      {Icon && (
        <div className="ui-empty__icon">
          <Icon size={34} strokeWidth={1.8} />
        </div>
      )}
      {title && <div className="ui-empty__title">{title}</div>}
      {text && <p className="ui-empty__text">{text}</p>}
      {action}
    </div>
  );
}

export default Spinner;
