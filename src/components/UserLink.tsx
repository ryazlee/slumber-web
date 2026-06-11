import { Link } from 'react-router-dom';
import Avatar from './Avatar';

type UserLinkProps = {
  userId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[] | null;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
  className?: string;
};

export default function UserLink({
  userId,
  username,
  avatarUrl,
  userRoles,
  showAvatar = false,
  avatarSize = 'sm',
  className = '',
}: UserLinkProps) {
  return (
    <Link to={`/profile/${userId}`} className={`user-link ${className}`.trim()}>
      {showAvatar && (
        <Avatar
          userId={userId}
          username={username}
          avatarUrl={avatarUrl}
          userRoles={userRoles}
          size={avatarSize}
        />
      )}
      <span className="user-link-name">@{username}</span>
    </Link>
  );
}
