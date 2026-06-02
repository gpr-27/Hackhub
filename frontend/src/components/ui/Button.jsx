import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Button — variants: primary | accent | secondary | ghost | danger | outline.
 * Sizes: sm | md (default) | lg. Props: loading, block, iconOnly, as.
 * Pass `to` to render a react-router-style link via the `as` prop if needed.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  iconOnly = false,
  className,
  children,
  disabled,
  as: Comp = 'button',
  ...rest
}) {
  return (
    <Comp
      className={cn(
        'ui-btn',
        `ui-btn--${variant}`,
        size !== 'md' && `ui-btn--${size}`,
        block && 'ui-btn--block',
        iconOnly && 'ui-btn--icon',
        className
      )}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="ui-spinner" aria-hidden="true" />}
      {children}
    </Comp>
  );
}

export default Button;
