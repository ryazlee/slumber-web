import type { CSSProperties } from 'react';
import CachedAvatar from './CachedAvatar';
import { resolveAvatarRole } from '../lib/avatarRoles';
import { avatarColorFromName } from '../lib/format';

const BORDER_WIDTH = 3;

type AvatarProps = {
  userId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[] | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SLOT_CLASS: Record<NonNullable<AvatarProps['size']>, string> = {
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

  const badgeSize = size === 'lg' ? 26 : size === 'sm' ? 13 : 15;
  const badgeInset = size === 'lg' ? 4 : 2;

  return (
    <span className={slotClass} aria-hidden="true">
      <span
        className="avatar-ring avatar-ring--styled"
        style={{
          borderColor: role.color,
          boxShadow: `0 0 3px ${role.color}73`,
        }}
      >
        {face}
      </span>
      {role.badge ? (
        <span
          className="avatar-role-badge"
          style={{
            width: badgeSize,
            height: badgeSize,
            fontSize: Math.max(8, badgeSize - 5),
            lineHeight: `${badgeSize - 2}px`,
            bottom: -badgeInset,
            right: -badgeInset,
            backgroundColor: role.badgeColor ?? role.color,
          }}
        >
          {role.badge}
        </span>
      ) : null}
    </span>
  );
}

export { BORDER_WIDTH as AVATAR_RING_WIDTH };
