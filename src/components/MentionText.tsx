import { parseMentionSegments } from '../lib/mentions';

type MentionTextProps = {
  children: string;
  className?: string;
};

export default function MentionText({ children, className }: MentionTextProps) {
  const segments = parseMentionSegments(children);

  if (segments.length === 1 && segments[0].type === 'text') {
    return <span className={className}>{segments[0].value}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => (
        seg.type === 'mention' ? (
          <span key={`${seg.username}-${i}`} className="mention-handle">
            @{seg.username}
          </span>
        ) : (
          <span key={`text-${i}`}>{seg.value}</span>
        )
      ))}
    </span>
  );
}
