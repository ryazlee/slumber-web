type Props = {
  rows?: number;
};

export default function CommentsLoadingState({ rows = 2 }: Props) {
  return (
    <div className="comments-loading" aria-label="Loading comments">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="comments-loading-row">
          <div className="comments-loading-avatar" />
          <div className="comments-loading-body">
            <div className="comments-loading-line comments-loading-line--short" />
            <div
              className={`comments-loading-line${index % 2 === 0 ? ' comments-loading-line--medium' : ' comments-loading-line--long'}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
