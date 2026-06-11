import type { ReactNode } from 'react';

type AdminFilterBarProps = {
  children: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
};

export default function AdminFilterBar({ children, onReset, showReset }: AdminFilterBarProps) {
  return (
    <div className="admin-filter-bar">
      <div className="admin-filter-fields">{children}</div>
      {showReset && onReset ? (
        <button type="button" className="admin-button admin-button-ghost admin-filter-reset" onClick={onReset}>
          Reset filters
        </button>
      ) : null}
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
