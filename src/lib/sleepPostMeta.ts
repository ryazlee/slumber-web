export type Vibe = 'CHARGED' | 'DRAGGING' | 'ZOMBIE';

export const VIBE_CONFIG: Record<Vibe, { emoji: string; label: string }> = {
  CHARGED: { emoji: '⚡️', label: 'Charged' },
  DRAGGING: { emoji: '☕️', label: 'Dragging' },
  ZOMBIE: { emoji: '🧟', label: 'Zombie' },
};

export function vibeColor(vibe: Vibe): string {
  switch (vibe) {
    case 'CHARGED': return '#34c759';
    case 'DRAGGING': return '#f59e0b';
    case 'ZOMBIE': return '#ef4444';
  }
}
