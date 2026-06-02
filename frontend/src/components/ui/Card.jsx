import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Card — glassmorphism surface. Props:
 *  - pad (default true): internal padding
 *  - hover: lift on hover
 *  - glow / solid: style variants
 *  - as: element/component to render
 */
export function Card({ pad = true, hover = false, glow = false, solid = false, className, children, as: Comp = 'div', ...rest }) {
  return (
    <Comp
      className={cn(
        'ui-card',
        pad && 'ui-card--pad',
        hover && 'ui-card--hover',
        glow && 'ui-card--glow',
        solid && 'ui-card--solid',
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export default Card;
