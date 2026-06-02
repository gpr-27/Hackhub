import React from 'react';
import { cn } from '../../lib/cn';

/** Badge — tone: neutral | primary | success | warning | danger | info | accent. */
export function Badge({ tone = 'neutral', dot = false, className, children, ...rest }) {
  return (
    <span className={cn('ui-badge', `ui-badge--${tone}`, className)} {...rest}>
      {dot && <span className="ui-badge__dot" />}
      {children}
    </span>
  );
}

export default Badge;
