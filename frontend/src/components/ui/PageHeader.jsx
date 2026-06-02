import React from 'react';
import { cn } from '../../lib/cn';

/**
 * PageHeader — consistent title block for every page.
 * Props: eyebrow (small uppercase label), title, subtitle, actions (node), icon.
 */
export function PageHeader({ eyebrow, title, subtitle, actions, className }) {
  return (
    <header className={cn('ui-pagehead animate-in', className)}>
      <div className="ui-pagehead__titles">
        {eyebrow && <span className="ui-pagehead__eyebrow">{eyebrow}</span>}
        <h1 className="ui-pagehead__title">{title}</h1>
        {subtitle && <p className="ui-pagehead__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ui-pagehead__actions">{actions}</div>}
    </header>
  );
}

export default PageHeader;
