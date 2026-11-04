import { DRAWING_KIND_LABEL } from './drawing';

export type ChallengeKind = 'drawing' | 'race' | 'one_on_one';

export const CHALLENGE_KIND_LABEL: Record<ChallengeKind, string> = {
  drawing: DRAWING_KIND_LABEL,
  race: 'Race',
  one_on_one: '1v1',
};

export function challengeKind(challenge: {
  isDrawing?: boolean;
  isGroup?: boolean;
} | null | undefined): ChallengeKind {
  if (challenge?.isDrawing) return 'drawing';
  if (challenge?.isGroup === false) return 'one_on_one';
  return 'race';
}
