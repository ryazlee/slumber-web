import { challengePlaceColor, formatChallengePlace } from '../lib/challengeRank';

type Props = {
  place: number;
  tied?: boolean;
  fallbackColor?: string;
  compact?: boolean;
};

export default function ChallengePlaceBadge({
  place,
  tied = false,
  fallbackColor = 'var(--text-dim)',
  compact = false,
}: Props) {
  const color = challengePlaceColor(place, fallbackColor);

  return (
    <span
      className={`challenge-place-badge${compact ? ' challenge-place-badge--compact' : ''}`}
      style={{ color }}
    >
      {formatChallengePlace(place, tied)}
    </span>
  );
}
