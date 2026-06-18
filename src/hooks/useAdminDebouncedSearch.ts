import { useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

type Options = {
  /** Minimum trimmed query length before treating search as active. Default 2. */
  minLength?: number;
};

export function useAdminDebouncedSearch(initialQuery = '', options: Options = {}) {
  const minLength = options.minLength ?? 2;
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query);
  const trimmedDebounced = debouncedQuery.trim();
  const isActive = trimmedDebounced.length >= minLength;

  return {
    query,
    setQuery,
    debouncedQuery,
    trimmedDebounced,
    isActive,
  };
}
