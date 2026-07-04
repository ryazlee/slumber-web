import { useEffect, useState } from 'react';
import { formatGraceRemaining } from '../lib/challengeGrace';

export function useGraceCountdown(graceEndsAtMs: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (graceEndsAtMs == null) return undefined;

    const tick = () => setNow(Date.now());
    tick();

    const remaining = graceEndsAtMs - Date.now();
    if (remaining <= 0) return undefined;

    const intervalMs = remaining > 60 * 60 * 1000 ? 60_000 : 1_000;
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [graceEndsAtMs]);

  if (graceEndsAtMs == null) {
    return { remainingMs: null, label: null, expired: false };
  }

  const remainingMs = graceEndsAtMs - now;
  const label = remainingMs <= 0 ? 'Closing…' : formatGraceRemaining(remainingMs);

  return {
    remainingMs,
    label,
    expired: remainingMs <= 0,
  };
}
