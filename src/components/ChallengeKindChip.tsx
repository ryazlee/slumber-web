import { CHALLENGE_KIND_LABEL, challengeKind, type ChallengeKind } from '../lib/challengeKind';

type Props = {
  kind?: ChallengeKind;
  challenge?: { isDrawing?: boolean; isGroup?: boolean } | null;
};

export default function ChallengeKindChip({ kind, challenge }: Props) {
  const resolved = kind ?? challengeKind(challenge);
  return (
    <span className={`challenge-kind-chip challenge-kind-chip--${resolved}`}>
      {CHALLENGE_KIND_LABEL[resolved]}
    </span>
  );
}
