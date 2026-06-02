// Tiny classNames helper: joins truthy class fragments into one string.
// Usage: cn('base', cond && 'active', { 'is-x': flag })
export function cn(...parts) {
  const out = [];
  for (const part of parts) {
    if (!part) continue;
    if (typeof part === 'string' || typeof part === 'number') {
      out.push(String(part));
    } else if (typeof part === 'object') {
      for (const key in part) {
        if (part[key]) out.push(key);
      }
    }
  }
  return out.join(' ');
}

export default cn;
