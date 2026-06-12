import type { MouseEvent, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  danger?: boolean;
};

export default function AdminGridAction({ children, onClick, active, danger }: Props) {
  return (
    <button
      type="button"
      className={[
        'admin-action-btn',
        active ? 'admin-action-btn--active' : '',
        danger ? 'admin-action-btn--danger' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
