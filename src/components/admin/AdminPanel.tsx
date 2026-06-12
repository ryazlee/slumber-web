import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  step?: number;
  highlighted?: boolean;
};

export default function AdminPanel({
  title,
  description,
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
        <div>
          <h2 className="admin-panel-title">
            {step != null ? <span className="admin-panel-step">{step}</span> : null}
            {title}
          </h2>
          {description ? <p className="admin-panel-desc">{description}</p> : null}
        </div>
        {headerAction}
      </div>
      <div className="admin-panel-body">{children}</div>
    </div>
  );
}
