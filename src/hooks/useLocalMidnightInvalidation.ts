import { useEffect, useState } from 'react';
import { getLocalDateISO } from '../lib/dates';

/** Tracks local calendar date; refreshes when the tab returns to foreground on a new day. */
export function useLocalMidnightInvalidation(): string {
  const [todayISO, setTodayISO] = useState(getLocalDateISO);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const next = getLocalDateISO();
      setTodayISO((prev) => (prev === next ? prev : next));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return todayISO;
}
