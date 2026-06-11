import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { timeAgo } from '../lib/format';
import type { Comment } from '../lib/types';
import MentionText from './MentionText';

type CommentRowProps = {
  comment: Comment;
};

export default function CommentRow({ comment }: CommentRowProps) {
  const profilePath = `/profile/${comment.userId}`;

  return (
    <li className="comment-row">
      <Link to={profilePath} className="comment-row-avatar" aria-label={`@${comment.username}`}>
        <Avatar
          userId={comment.userId}
          username={comment.username}
          avatarUrl={comment.avatarUrl}
          userRoles={comment.userRoles}
          size="sm"
        />
      </Link>
      <div className="comment-bubble">
        <div className="comment-header">
          <Link to={profilePath} className="comment-author">
            @{comment.username}
          </Link>
          <time className="comment-time" dateTime={comment.createdAt}>
            {timeAgo(comment.createdAt)}
          </time>
        </div>
        <MentionText className="comment-text">{comment.text}</MentionText>
      </div>
    </li>
  );
}
