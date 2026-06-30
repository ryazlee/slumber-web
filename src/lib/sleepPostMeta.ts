import type { DreamMood, Vibe } from './types';

export type { Vibe, DreamMood };

export const VIBE_CONFIG: Record<Vibe, { emoji: string; label: string }> = {
  CHARGED: { emoji: '⚡️', label: 'Charged' },
  SOLID: { emoji: '😌', label: 'Solid' },
  MEH: { emoji: '😐', label: 'Meh' },
  DRAGGING: { emoji: '☕️', label: 'Dragging' },
  ZOMBIE: { emoji: '🧟', label: 'Zombie' },
};

export const DREAM_MOOD_CONFIG: Record<DreamMood, { emoji: string; label: string }> = {
  NIGHTMARE: { emoji: '😱', label: 'Nightmare' },
  WEIRD: { emoji: '🌀', label: 'Weird' },
  NEUTRAL: { emoji: '😶', label: 'Neutral' },
  GOOD: { emoji: '✨', label: 'Good' },
  VIVID: { emoji: '🌙', label: 'Vivid' },
};

const VIBE_CSS_VAR: Record<Vibe, string> = {
  CHARGED: '--vibe-charged',
  SOLID: '--vibe-solid',
  MEH: '--vibe-meh',
  DRAGGING: '--vibe-dragging',
  ZOMBIE: '--vibe-zombie',
};

const DREAM_MOOD_CSS_VAR: Record<DreamMood, string> = {
  NIGHTMARE: '--dream-nightmare',
  WEIRD: '--dream-weird',
  NEUTRAL: '--dream-neutral',
  GOOD: '--dream-good',
  VIVID: '--dream-vivid',
};

export function vibeMeta(vibe?: Vibe) {
  return vibe ? VIBE_CONFIG[vibe] : undefined;
}

export function vibeColor(vibe: Vibe): string {
  return `var(${VIBE_CSS_VAR[vibe]})`;
}

export function dreamMoodColor(mood: DreamMood): string {
  return `var(${DREAM_MOOD_CSS_VAR[mood]})`;
}

export function dreamLogPrefix(dreamMood?: DreamMood): string {
  if (dreamMood && DREAM_MOOD_CONFIG[dreamMood]) {
    return `${DREAM_MOOD_CONFIG[dreamMood].emoji} `;
  }
  return '💭 ';
}
