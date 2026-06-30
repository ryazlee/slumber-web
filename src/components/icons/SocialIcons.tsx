import type { ReactNode } from 'react';
import { IoChatbubbleOutline, IoHeartOutline } from 'react-icons/io5';

type IconProps = {
  size?: number;
  className?: string;
};

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

/** Ionicons heart-outline — inactive kudos / comment like. */
export function HeartOutlineIcon({ size = 20, className }: IconProps) {
  return (
    <SocialIconSlot size={size} className={className}>
      <IoHeartOutline size={size} />
    </SocialIconSlot>
  );
}

/** Ionicons chatbubble-outline — matches Expo vector icon. */
export function ChatBubbleOutlineIcon({ size = 20, className }: IconProps) {
  return (
    <SocialIconSlot size={size} className={className}>
      <IoChatbubbleOutline size={size} />
    </SocialIconSlot>
  );
}
