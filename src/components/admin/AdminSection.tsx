import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  lead?: ReactNode;
  error?: string | null;
};

export default function AdminSection({
  children,
  className = '',
  lead,
  error,
}: Props) {
  return (
    <section className={`admin-section${className ? ` ${className}` : ''}`}>
      {lead ? <p className="admin-section-lead">{lead}</p> : null}
      {error ? <p className="admin-error admin-error-banner">{error}</p> : null}
      {children}
    </section>
  );
}

export function AdminTableSummary({ children }: { children: ReactNode }) {
  return <p className="admin-muted admin-table-summary">{children}</p>;
}
