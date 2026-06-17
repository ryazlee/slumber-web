import { useMemo } from 'react';
import { challengeGraceEndsAtMs } from '../lib/challengeGrace';
import { useGraceCountdown } from '../hooks/useGraceCountdown';
import type { Challenge } from '../lib/types';

type Props = {
  challenge: Pick<Challenge, 'graceEndsAt' | 'goalReachedAt' | 'expiresAt'>;
  prefix?: string;
  suffix?: string;
  className?: string;
};

export default function ChallengeGraceCountdown({
  challenge,
  prefix = '',
  suffix = '',
  className,
}: Props) {
  const endsAtMs = useMemo(() => challengeGraceEndsAtMs(challenge), [challenge]);
  const { label } = useGraceCountdown(endsAtMs);

  if (!label) return null;

  return (
    <span className={className}>
      {prefix}{label}{suffix}
    </span>
  );
}
