import type { ReactNode } from 'react';

type IconProps = {
  size?: number;
  className?: string;
};

/** Fixed square footprint — prevents flex parents from stretching SVGs. */
function SocialIconSlot({
  size = 20,
  className = '',
  children,
}: {
  size?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`social-icon-slot ${className}`.trim()}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-hidden
    >
      {children}
    </span>
  );
}

/** Ionicons heart-outline (v7) — inactive kudos / comment like. */
export function HeartOutlineIcon({ size = 20, className }: IconProps) {
  return (
    <SocialIconSlot size={size} className={className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        stroke="currentColor"
        strokeWidth={32}
        strokeLinecap="round"
        strokeLinejoin="round"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z" />
      </svg>
    </SocialIconSlot>
  );
}

/** Ionicons chatbubble-outline (v7) — matches Expo vector icon. */
export function ChatBubbleOutlineIcon({ size = 20, className }: IconProps) {
  return (
    <SocialIconSlot size={size} className={className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        stroke="currentColor"
        strokeWidth={32}
        strokeLinecap="round"
        strokeMiterlimit={10}
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M87.49 380c1.19-4.38-1.44-10.47-3.95-14.86a44.86 44.86 0 00-2.54-3.8 199.81 199.81 0 01-33-110C47.65 139.09 140.73 48 255.83 48 356.21 48 440 117.54 459.58 209.85a199 199 0 014.42 41.64c0 112.41-89.49 204.93-204.59 204.93-18.3 0-43-4.6-56.47-8.37s-26.92-8.77-30.39-10.11a31.09 31.09 0 00-11.12-2.07 30.71 30.71 0 00-12.09 2.43l-67.83 24.48a16 16 0 01-4.67 1.22 9.6 9.6 0 01-9.57-9.74 15.85 15.85 0 01.6-3.29z" />
      </svg>
    </SocialIconSlot>
  );
}
