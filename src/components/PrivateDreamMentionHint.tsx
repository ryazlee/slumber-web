type Props = {
  usernames: string[];
  onMentionPress?: (username: string) => void;
};

/** Shown on blurred dreams when friends were @mentioned in the dream text. */
export default function PrivateDreamMentionHint({ usernames, onMentionPress }: Props) {
  if (!usernames.length) return null;

  return (
    <p className="post-dream-mention-hint">
      Friends mentioned{' '}
      {usernames.map((username, index) => (
        <span key={username}>
          {index > 0 ? ', ' : ''}
          {onMentionPress ? (
            <button
              type="button"
              className="mention-handle mention-handle--link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMentionPress(username);
              }}
            >
              @{username}
            </button>
          ) : (
            <span className="mention-handle">@{username}</span>
          )}
        </span>
      ))}
    </p>
  );
}
