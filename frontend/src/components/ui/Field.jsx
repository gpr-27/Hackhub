import React from 'react';
import { cn } from '../../lib/cn';

/** Field — label + control wrapper with optional hint/error. */
export function Field({ label, hint, error, htmlFor, className, children }) {
  return (
    <div className={cn('ui-field', className)}>
      {label && (
        <label className="ui-field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span className="ui-field__error">{error}</span>
      ) : hint ? (
        <span className="ui-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

/** Input — optional leading icon. */
export function Input({ icon: Icon, invalid, className, ...rest }) {
  if (Icon) {
    return (
      <span className="ui-input-wrap">
        <span className="ui-input-wrap__icon"><Icon size={18} /></span>
        <input className={cn('ui-input', 'ui-input--with-icon', invalid && 'ui-input--invalid', className)} {...rest} />
      </span>
    );
  }
  return <input className={cn('ui-input', invalid && 'ui-input--invalid', className)} {...rest} />;
}

export function Textarea({ invalid, className, ...rest }) {
  return <textarea className={cn('ui-textarea', invalid && 'ui-textarea--invalid', className)} {...rest} />;
}

export function Select({ invalid, className, children, ...rest }) {
  return (
    <select className={cn('ui-select', invalid && 'ui-select--invalid', className)} {...rest}>
      {children}
    </select>
  );
}

export default Field;
