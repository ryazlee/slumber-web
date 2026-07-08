import { useLayoutEffect, useRef, useState } from 'react';
import MentionText from './MentionText';

const PREVIEW_LINES = 4;

type Props = {
  children: string;
  className?: string;
  prefix?: string;
  onMentionPress?: (username: string) => void;
};

export default function ExpandableMentionText({ children, className, prefix = '', onMentionPress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const text = `${prefix}${children}`;

  useLayoutEffect(() => {
    setExpanded(false);
    const el = measureRef.current;
    if (!el || !children.trim()) {
      setNeedsExpand(false);
      return;
    }
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 22;
    setNeedsExpand(el.scrollHeight > lineHeight * PREVIEW_LINES + 1);
  }, [children, prefix]);

  if (!children.trim()) return null;

  const collapsed = needsExpand && !expanded;

  return (
    <div className="expandable-mention-text">
      <p ref={measureRef} className="expandable-mention-text-measure" aria-hidden>
        <MentionText className={className} onMentionPress={onMentionPress}>{text}</MentionText>
      </p>
      <p
        className={[
          'expandable-mention-text-body',
          className,
          collapsed ? 'expandable-mention-text-body--clamped' : '',
        ].filter(Boolean).join(' ')}
        style={collapsed ? { WebkitLineClamp: PREVIEW_LINES } : undefined}
      >
        <MentionText onMentionPress={onMentionPress}>{text}</MentionText>
      </p>
      {needsExpand ? (
        <button
          type="button"
          className="expandable-mention-text-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className="expandable-mention-text-ellipsis">… </span>
          <span className="expandable-mention-text-action">{expanded ? 'less' : 'more'}</span>
        </button>
      ) : null}
    </div>
  );
}
