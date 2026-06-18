import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Horizontal row of compact table action buttons. */
export default function AdminGridActions({ children, className }: Props) {
  return (
    <div className={['admin-grid-actions', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
