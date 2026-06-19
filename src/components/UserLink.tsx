import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { useStreak } from '../hooks/useStreak';

type UserLinkProps = {
  userId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[] | null;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
  showStreak?: boolean;
  minStreakToShow?: number;
  className?: string;
};

export default function UserLink({
  userId,
  username,
  avatarUrl,
  userRoles,
  showAvatar = false,
  avatarSize = 'sm',
  showStreak = true,
  minStreakToShow = 3,
  className = '',
}: UserLinkProps) {
  const { data: streakData } = useStreak(showStreak ? userId : undefined);
  const currentStreak = streakData?.currentStreak ?? 0;
  const shouldShowStreak = showStreak && currentStreak >= minStreakToShow;

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
      {shouldShowStreak ? (
        <span className="user-link-streak" aria-label={`${currentStreak}-night streak`}>
          🔥{currentStreak}
        </span>
      ) : null}
    </Link>
  );
}
