import { useState, type ReactNode } from 'react';

type Props = {
  title: string;
  defaultOpen?: boolean;
  onOpen?: () => void;
  children: ReactNode;
};

export default function StatsCollapsible({
  title,
  defaultOpen = false,
  onOpen,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className="stats-collapse"
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        setOpen(next);
        if (next) onOpen?.();
      }}
    >
      <summary className="stats-section-label stats-collapse-summary">{title}</summary>
      {open ? <div className="stats-collapse-body">{children}</div> : null}
    </details>
  );
}
