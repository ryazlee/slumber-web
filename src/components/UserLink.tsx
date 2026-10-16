import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { useStreak } from '../hooks/useStreak';

type UserLinkProps = {
  userId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[] | null;
  isPremium?: boolean;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
  showStreak?: boolean;
  /** When set, skip the streaks fetch (leaderboard / challenge rows). */
  streak?: number;
  minStreakToShow?: number;
  className?: string;
};

export default function UserLink({
  userId,
  username,
  avatarUrl,
  userRoles,
  isPremium,
  showAvatar = false,
  avatarSize = 'sm',
  showStreak = true,
  streak,
  minStreakToShow = 3,
  className = '',
}: UserLinkProps) {
  const { data: streakData } = useStreak(showStreak && streak == null ? userId : undefined);
  const currentStreak = streak ?? streakData?.currentStreak ?? 0;
  const shouldShowStreak = showStreak && currentStreak >= minStreakToShow;

  return (
    <Link to={`/profile/${userId}`} className={`user-link ${className}`.trim()}>
      {showAvatar && (
        <Avatar
          userId={userId}
          username={username}
          avatarUrl={avatarUrl}
          userRoles={userRoles}
          isPremium={isPremium}
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
