import { Link } from 'react-router-dom';
import type { ChallengeContributionPost } from '../lib/types';
import { formatMins } from '../lib/format';
import Avatar from './Avatar';

type Props = {
  post: ChallengeContributionPost;
  isPrivate: boolean;
  userRoles?: string[] | null;
};

export default function ChallengeContributionRow({ post, isPrivate, userRoles }: Props) {
  const content = (
    <>
      <Avatar
        userId={post.userId}
        username={post.username}
        avatarUrl={post.avatarUrl}
        userRoles={userRoles}
        size="sm"
      />
      <div className="challenge-contribution-copy">
        <span className="challenge-contribution-user">@{post.username}</span>
        <span className={`challenge-contribution-title${isPrivate ? ' challenge-contribution-title--private' : ''}`}>
          {isPrivate ? 'Private sleep entry' : post.title}
        </span>
      </div>
      <span className="challenge-contribution-mins">{formatMins(post.asleepMinutes)}</span>
    </>
  );

  if (isPrivate) {
    return (
      <div className="challenge-contribution-row challenge-contribution-row--private" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link to={`/post/${post.postId}`} className="challenge-contribution-row">
      {content}
    </Link>
  );
}
