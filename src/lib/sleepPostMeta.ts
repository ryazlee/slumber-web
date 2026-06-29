export type Vibe = 'CHARGED' | 'SOLID' | 'MEH' | 'DRAGGING' | 'ZOMBIE';

export type DreamMood = 'NIGHTMARE' | 'WEIRD' | 'NEUTRAL' | 'GOOD' | 'VIVID';

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

export function vibeColor(vibe: Vibe): string {
  switch (vibe) {
    case 'CHARGED': return '#34c759';
    case 'SOLID': return '#2D7A4F';
    case 'MEH': return '#64748B';
    case 'DRAGGING': return '#f59e0b';
    case 'ZOMBIE': return '#ef4444';
  }
}

export function dreamMoodColor(mood: DreamMood): string {
  switch (mood) {
    case 'NIGHTMARE': return '#D97757';
    case 'WEIRD': return '#7C3AED';
    case 'NEUTRAL': return '#64748B';
    case 'GOOD': return '#C9920A';
    case 'VIVID': return '#7C3AED';
  }
}

export function dreamLogPrefix(dreamMood?: DreamMood): string {
  if (dreamMood && DREAM_MOOD_CONFIG[dreamMood]) {
    return `${DREAM_MOOD_CONFIG[dreamMood].emoji} `;
  }
  return '💭 ';
}
