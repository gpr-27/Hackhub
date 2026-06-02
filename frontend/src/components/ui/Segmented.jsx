import React from 'react';
import { cn } from '../../lib/cn';

/**
 * SegmentedControl — pill-style tab switcher.
 * Props: value, onChange, options [{ value, label, icon }].
 */
export function SegmentedControl({ value, onChange, options = [], className }) {
  return (
    <div className={cn('ui-segment', className)} role="tablist">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            className={cn('ui-segment__btn', active && 'ui-segment__btn--active')}
            onClick={() => onChange?.(opt.value)}
            type="button"
          >
            {Icon && <Icon size={15} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
