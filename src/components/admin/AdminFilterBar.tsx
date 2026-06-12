import type { ReactNode } from 'react';

type AdminFilterBarProps = {
  children: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  actions?: ReactNode;
  nested?: boolean;
};

export default function AdminFilterBar({ children, onReset, showReset, actions, nested }: AdminFilterBarProps) {
  return (
    <div className={`admin-filter-bar${nested ? ' admin-filter-bar--nested' : ''}`}>
      <div className="admin-filter-fields">{children}</div>
      <div className="admin-filter-bar-actions">
        {actions}
        {showReset && onReset ? (
          <button type="button" className="admin-button admin-button-ghost admin-filter-reset" onClick={onReset}>
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}

type AdminFilterFieldProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function AdminFilterField({ label, htmlFor, children, className = '' }: AdminFilterFieldProps) {
  return (
    <div className={`admin-filter-field ${className}`.trim()}>
      <label className="admin-label" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}
