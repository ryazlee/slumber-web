import { Link } from 'react-router-dom';
import { avatarColorFromName } from '../lib/format';
import CachedAvatar from './CachedAvatar';

type UserLinkProps = {
  userId: string;
  username: string;
  avatarUrl?: string;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md';
  className?: string;
};

export default function UserLink({
  userId,
  username,
  avatarUrl,
  showAvatar = false,
  avatarSize = 'sm',
  className = '',
}: UserLinkProps) {
  const avatarClass = avatarSize === 'md' ? 'post-avatar' : 'post-avatar post-avatar-sm';

  return (
    <Link to={`/profile/${userId}`} className={`user-link ${className}`.trim()}>
      {showAvatar && (
        <CachedAvatar
          url={avatarUrl}
          username={username}
          className={avatarClass}
          style={{ background: avatarColorFromName(username) }}
        />
      )}
      <span className="user-link-name">@{username}</span>
    </Link>
  );
}
