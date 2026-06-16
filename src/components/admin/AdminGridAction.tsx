import type { MouseEvent, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
};

export default function AdminGridAction({ children, onClick, active, danger, disabled }: Props) {
  return (
    <button
      type="button"
      className={[
        'admin-action-btn',
        active ? 'admin-action-btn--active' : '',
        danger ? 'admin-action-btn--danger' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
