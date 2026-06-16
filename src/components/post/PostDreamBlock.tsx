type Props = {
  dreamLog: string;
  canReadDream: boolean;
  blurDream: boolean;
  isOwnPost: boolean;
};

export default function PostDreamBlock({ dreamLog, canReadDream, blurDream, isOwnPost }: Props) {
  if (!dreamLog) return null;

  return (
    <div className="post-dream">
      {canReadDream ? (
        <>
          {blurDream && isOwnPost ? (
            <span className="post-dream-badge">Private dream</span>
          ) : null}
          <p className="post-dream-text">
            <span className="post-dream-icon" aria-hidden>💭</span>
            {dreamLog}
          </p>
        </>
      ) : (
        <div className="post-dream-private">
          <span className="post-dream-badge">Private dream</span>
          <p className="post-dream-hint">Dream logged (only they can read it)</p>
        </div>
      )}
    </div>
  );
}
