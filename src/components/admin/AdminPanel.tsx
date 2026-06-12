import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  step?: number;
  highlighted?: boolean;
};

export default function AdminPanel({
  title,
  description,
  meta,
  headerAction,
  children,
  className = '',
  step,
  highlighted,
}: Props) {
  return (
    <div
      className={[
        'admin-panel',
        highlighted ? 'admin-panel--highlighted' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="admin-panel-header">
        <div className="admin-panel-heading">
          <h2 className="admin-panel-title">
            {step != null ? <span className="admin-panel-step">{step}</span> : null}
            {title}
          </h2>
          {meta ? <p className="admin-panel-meta">{meta}</p> : null}
          {description ? <p className="admin-panel-desc">{description}</p> : null}
        </div>
        {headerAction}
      </div>
      <div className="admin-panel-body">{children}</div>
    </div>
  );
}
