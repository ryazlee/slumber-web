import type { MouseEvent, ReactNode } from 'react';

export type AdminGridActionVariant = 'default' | 'ghost' | 'accent' | 'danger';

type Props = {
  children: ReactNode;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
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
  active,
  variant = 'default',
  danger,
  disabled,
  title,
}: Props) {
  const resolved = danger ? 'danger' : variant;

  return (
    <button
      type="button"
      className={[
        'admin-action-btn',
        resolved !== 'default' ? `admin-action-btn--${resolved}` : '',
        active ? 'admin-action-btn--active' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
