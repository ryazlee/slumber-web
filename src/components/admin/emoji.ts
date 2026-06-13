/** Keep a single emoji — when users pick a new one, replace instead of appending. */
export function singleEmoji(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segments = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(trimmed)];
    return segments[segments.length - 1]?.segment ?? '';
  }

  return [...trimmed][0] ?? '';
}

export const EMOJI_PRESETS = [
  '🌙', '☕', '🔥', '🌅', '🦉', '💭', '✨', '💎', '🏆', '🧪',
  '🐸', '✦', '🛌', '💤', '🌯', '🐑', '🍕', '🐻', '🌀', '☁️',
  '🧟', '⏰', '🏰', '🔕', '🙏', '😴', '⭐', '👑', '🎯', '💜',
] as const;
