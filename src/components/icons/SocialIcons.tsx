type IconProps = {
  size?: number;
  className?: string;
};

/** Ionicons-style heart outline — inactive kudos / comment like. */
export function HeartOutlineIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth={32}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M352.92 80C328 80 312 112 256 144s-72-64-96.92-64c-26.51 0-51.39 16.86-55.53 44.73C98.44 170.55 96 192 96 219.18c0 47.35 19.86 81.78 50.25 114.39 16.4 17.79 90.25 97.38 121.35 128.6 12.5 12.7 32.83 12.7 45.33 0C343.75 441.06 417.6 361.47 434 343.68c30.39-32.61 50.25-67.04 50.25-114.39C484.28 192 484.12 169 464.08 124.8 459.34 111.06 445.15 80 352.92 80z" />
    </svg>
  );
}

/** Ionicons-style chatbubble outline. */
export function ChatBubbleOutlineIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth={32}
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M87.49 153c23.51-23.77 38.14-32.78 68.54-47.38 4.48-2.3 9.41-1.23 12.87 2.57l43.09 45.77a10 10 0 0 0 8.87 3.45h66.99a32 32 0 0 1 32 32v32a16 16 0 0 0 16 16h96a32 32 0 0 1 32 32v192a32 32 0 0 1-32 32H219.18a111.6 111.6 0 0 1-98.5-59.74L53 464a4 4 0 0 1-3-6.43l103.11-191.1A64.11 64.11 0 0 1 87.49 153z" />
      <path d="M176 416a16 16 0 0 0 16-16h96a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16h-96a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16z" />
    </svg>
  );
}
