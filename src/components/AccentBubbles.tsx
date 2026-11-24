import type { CSSProperties } from 'react';

/** Quiet accent circles — same language as the app's floating bubbles and stage dots. */

type SpeckTone = 'cool' | 'warm';

type Speck = {
  x: string;
  y: string;
  size: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
  tone?: SpeckTone;
  opacity: number;
  opacityLight: number;
};

/** Fixed dust so theme changes don't reshuffle or restart the drift. */
const SPECKS: Speck[] = [
  { x: '9%', y: '16%', size: 3, duration: 36, delay: -8, dx: 18, dy: -14, opacity: 0.22, opacityLight: 0.38 },
  { x: '24%', y: '9%', size: 4, duration: 44, delay: -21, dx: -16, dy: 20, tone: 'cool', opacity: 0.16, opacityLight: 0.32 },
  { x: '41%', y: '13%', size: 3, duration: 32, delay: -4, dx: 14, dy: 16, opacity: 0.2, opacityLight: 0.36 },
  { x: '63%', y: '7%', size: 3, duration: 40, delay: -17, dx: -12, dy: 18, tone: 'warm', opacity: 0.18, opacityLight: 0.34 },
  { x: '81%', y: '15%', size: 4, duration: 38, delay: -11, dx: 20, dy: -12, opacity: 0.24, opacityLight: 0.4 },
  { x: '91%', y: '28%', size: 3, duration: 46, delay: -29, dx: -18, dy: 14, tone: 'cool', opacity: 0.15, opacityLight: 0.3 },
  { x: '6%', y: '44%', size: 3, duration: 34, delay: -6, dx: 16, dy: -18, opacity: 0.2, opacityLight: 0.36 },
  { x: '31%', y: '38%', size: 5, duration: 48, delay: -23, dx: -14, dy: 12, opacity: 0.14, opacityLight: 0.28 },
  { x: '54%', y: '31%', size: 3, duration: 30, delay: -13, dx: 12, dy: 20, tone: 'warm', opacity: 0.18, opacityLight: 0.34 },
  { x: '73%', y: '36%', size: 4, duration: 42, delay: -2, dx: -20, dy: -10, opacity: 0.22, opacityLight: 0.38 },
  { x: '14%', y: '64%', size: 3, duration: 36, delay: -19, dx: 18, dy: 10, tone: 'cool', opacity: 0.17, opacityLight: 0.33 },
  { x: '37%', y: '71%', size: 4, duration: 40, delay: -9, dx: -10, dy: -16, opacity: 0.2, opacityLight: 0.36 },
  { x: '58%', y: '62%', size: 3, duration: 33, delay: -26, dx: 15, dy: -14, opacity: 0.16, opacityLight: 0.3 },
  { x: '78%', y: '74%', size: 3, duration: 45, delay: -15, dx: -16, dy: 12, tone: 'warm', opacity: 0.19, opacityLight: 0.35 },
  { x: '22%', y: '86%', size: 4, duration: 38, delay: -31, dx: 12, dy: -18, opacity: 0.15, opacityLight: 0.28 },
  { x: '86%', y: '88%', size: 3, duration: 34, delay: -7, dx: -14, dy: -12, opacity: 0.22, opacityLight: 0.38 },
];

export default function AccentBubbles() {
  return (
    <div className="accent-bubbles" aria-hidden="true">
      <span className="accent-bubble accent-bubble--lg accent-bubble--accent" />
      <span className="accent-bubble accent-bubble--md accent-bubble--core" />
      <span className="accent-bubble accent-bubble--sm accent-bubble--rem" />
      <span className="accent-bubble accent-bubble--xs accent-bubble--deep" />
      {SPECKS.map((speck) => (
        <span
          key={`${speck.x}-${speck.y}`}
          className={speck.tone ? `accent-speck accent-speck--${speck.tone}` : 'accent-speck'}
          style={
            {
              left: speck.x,
              top: speck.y,
              width: speck.size,
              height: speck.size,
              animationDuration: `${speck.duration}s`,
              animationDelay: `${speck.delay}s`,
              '--dx': `${speck.dx}px`,
              '--dy': `${speck.dy}px`,
              '--speck-o': speck.opacity,
              '--speck-o-light': speck.opacityLight,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
