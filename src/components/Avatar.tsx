import type { CSSProperties } from 'react';
import CachedAvatar from './CachedAvatar';
import { resolveAvatarRole } from '../lib/avatarRoles';
import { avatarColorFromName } from '../lib/format';

/** Keep in sync with `lib/avatarLayout.ts` in the mobile app. */
export const AVATAR_SIZE = {
  compact: 28,
  tab: 32,
  inline: 36,
  row: 40,
  featured: 48,
  large: 56,
  hero: 80,
} as const;

export type AvatarSizeName = keyof typeof AVATAR_SIZE;

const SLOT_PX: Record<NonNullable<AvatarProps['size']>, number> = {
  compact: AVATAR_SIZE.compact,
  sm: AVATAR_SIZE.tab,
  md: AVATAR_SIZE.row,
  lg: AVATAR_SIZE.hero,
};

function avatarLayoutMetrics(outerSize: number) {
  const ringWidth = Math.min(4, Math.max(2, Math.round(outerSize * 0.075)));
  const innerSize = Math.max(1, outerSize - ringWidth * 2);
  const badgeSize = Math.round(outerSize * 0.32);
  const badgeBorderWidth = Math.min(2, Math.max(1, Math.round(badgeSize * 0.12)));
  const badgeInnerSize = Math.max(1, badgeSize - badgeBorderWidth * 2);
  const ringRadius = outerSize / 2;
  const badgeCornerInset = Math.max(
    0,
    Math.round(ringRadius * (1 - Math.SQRT1_2) - badgeSize / 2),
  );
  return {
    ringWidth,
    innerSize,
    badgeSize,
    badgeBorderWidth,
    badgeInnerSize,
    badgeEmojiSize: Math.round(badgeInnerSize * 0.66),
    badgeCornerInset,
  };
}

type AvatarProps = {
  userId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[] | null;
  size?: 'compact' | 'sm' | 'md' | 'lg';
  className?: string;
};

const SLOT_CLASS: Record<NonNullable<AvatarProps['size']>, string> = {
  compact: 'avatar-slot avatar-slot--compact',
  sm: 'avatar-slot avatar-slot--sm',
  md: 'avatar-slot avatar-slot--md',
  lg: 'avatar-slot avatar-slot--lg',
};

export default function Avatar({
  userId,
  username,
  avatarUrl,
  userRoles,
  size = 'md',
  className = '',
}: AvatarProps) {
  const role = resolveAvatarRole(userRoles);
  const slotClass = `${SLOT_CLASS[size]} ${className}`.trim();
  const initials = username.slice(0, 2).toUpperCase();
  const faceStyle: CSSProperties = { background: avatarColorFromName(userId || username) };
  const slotPx = SLOT_PX[size];
  const layout = avatarLayoutMetrics(slotPx);

  const face = (
    <CachedAvatar
      url={avatarUrl}
      username={username}
      className="avatar-face"
      style={faceStyle}
      fallback={initials}
    />
  );

  if (!role) {
    return (
      <span className={slotClass} aria-hidden="true">
        <span className="avatar-ring">{face}</span>
      </span>
    );
  }

  return (
    <span className={slotClass} aria-hidden="true">
      <span
        className="avatar-ring avatar-ring--styled"
        style={{
          borderColor: role.color,
          borderWidth: layout.ringWidth,
          boxShadow: `0 0 3px ${role.color}73`,
          ['--avatar-ring-width' as string]: `${layout.ringWidth * 2}px`,
        }}
      >
        {face}
      </span>
      {role.badge ? (
        <span
          className="avatar-role-badge"
          style={{
            width: layout.badgeSize,
            height: layout.badgeSize,
            fontSize: layout.badgeEmojiSize,
            bottom: layout.badgeCornerInset,
            right: layout.badgeCornerInset,
            borderWidth: layout.badgeBorderWidth,
            borderColor: role.color,
          }}
        >
          <span className="avatar-role-badge-emoji" aria-hidden="true">
            {role.badge}
          </span>
        </span>
      ) : null}
    </span>
  );
}
