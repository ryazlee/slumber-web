import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type AdminGridActionVariant = 'default' | 'ghost' | 'accent' | 'danger';

type Props = {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  /** When set, renders a link with the same action styles. */
  to?: string;
  active?: boolean;
  variant?: AdminGridActionVariant;
  /** @deprecated use variant="danger" */
  danger?: boolean;
  disabled?: boolean;
  title?: string;
};

export default function AdminGridAction({
  children,
  onClick,
  to,
  active,
  variant = 'default',
  danger,
  disabled,
  title,
}: Props) {
  const resolved = danger ? 'danger' : variant;
  const className = [
    'admin-action-btn',
    resolved !== 'default' ? `admin-action-btn--${resolved}` : '',
    active ? 'admin-action-btn--active' : '',
  ].filter(Boolean).join(' ');

  if (to) {
    return (
      <Link
        to={to}
        className={className}
        title={title}
        aria-disabled={disabled || undefined}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
