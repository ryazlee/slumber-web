import { useState, type ReactNode } from 'react';

type Props = {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  compact?: boolean;
  embedded?: boolean;
  divided?: boolean;
  children: ReactNode;
};

export default function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  compact = false,
  embedded = false,
  divided = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const sectionClass = [
    'collapsible-section',
    compact ? 'collapsible-section--compact' : '',
    embedded ? 'collapsible-section--embedded' : '',
    divided ? 'collapsible-section--divided' : '',
  ].filter(Boolean).join(' ');

  const titleClass = compact
    ? 'collapsible-section-title collapsible-section-title--compact'
    : 'collapsible-section-title';

  return (
    <section className={sectionClass}>
      <div className="collapsible-section-header">
        <button
          type="button"
          className="collapsible-section-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="collapsible-section-chevron" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          <span className={titleClass}>{title}</span>
          {count != null && count > 0 ? (
            <span className="collapsible-section-count">{count}</span>
          ) : null}
        </button>
      </div>
      {open ? <div className="collapsible-section-body">{children}</div> : null}
    </section>
  );
}
