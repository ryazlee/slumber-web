import { Link } from 'react-router-dom';
import CachedAvatar from './CachedAvatar';
import { avatarColorFromName, timeAgo } from '../lib/format';
import type { Comment } from '../lib/types';

type CommentRowProps = {
  comment: Comment;
};

export default function CommentRow({ comment }: CommentRowProps) {
  const profilePath = `/profile/${comment.userId}`;

  return (
    <li className="comment-row">
      <Link to={profilePath} className="comment-row-avatar" aria-label={`@${comment.username}`}>
        <CachedAvatar
          url={comment.avatarUrl}
          username={comment.username}
          className="post-avatar post-avatar-sm"
          style={{ background: avatarColorFromName(comment.username) }}
        />
      </Link>
      <div className="comment-bubble">
        <Link to={profilePath} className="comment-author">
          @{comment.username}
        </Link>
        <p className="comment-text">{comment.text}</p>
      </div>
      <time className="comment-time" dateTime={comment.createdAt}>
        {timeAgo(comment.createdAt)}
      </time>
    </li>
  );
}
