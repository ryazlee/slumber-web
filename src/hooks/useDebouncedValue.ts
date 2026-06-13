import { useEffect, useState } from 'react';
import { ADMIN_SEARCH_DEBOUNCE_MS } from '../lib/adminSearch';

export function useDebouncedValue<T>(value: T, delayMs = ADMIN_SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
