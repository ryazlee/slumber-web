import type { CompareParticipant } from '../../lib/compareTypes';

export type CompareDensity = 'cozy' | 'compact' | 'dense';

export function getCompareDensity(count: number): CompareDensity {
  if (count >= 6) return 'dense';
  if (count >= 4) return 'compact';
  return 'cozy';
}

export function avatarSizeForDensity(density: CompareDensity): 'sm' | 'md' | 'lg' {
  if (density === 'dense') return 'sm';
  if (density === 'compact') return 'md';
  return 'lg';
}

export function participantLabel(p: CompareParticipant, density: CompareDensity): string {
  if (p.isSelf) return 'You';
  const handle = `@${p.username}`;
  if (density === 'dense') {
    return p.username.length > 8 ? `@${p.username.slice(0, 7)}…` : handle;
  }
  if (density === 'compact' && p.username.length > 11) {
    return `@${p.username.slice(0, 10)}…`;
  }
  return handle;
}
