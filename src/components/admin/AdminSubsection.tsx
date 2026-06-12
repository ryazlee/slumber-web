import type { ReactNode } from 'react';

type Props = {
  title: string;
  meta?: string;
  footer?: ReactNode;
  children: ReactNode;
};

export default function AdminSubsection({ title, meta, footer, children }: Props) {
  return (
    <div className="admin-subsection">
      <h2 className="admin-subsection-title">
        {title}
        {meta ? <span className="admin-subsection-meta"> · {meta}</span> : null}
      </h2>
      {children}
      {footer ? <p className="admin-muted admin-subsection-foot">{footer}</p> : null}
    </div>
  );
}
