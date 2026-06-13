import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  actions?: ReactNode;
};

export default function AdminListToolbar({ children, actions }: Props) {
  return (
    <div className="admin-list-toolbar">
      <div className="admin-list-toolbar-main">{children}</div>
      {actions ? <div className="admin-list-toolbar-actions">{actions}</div> : null}
    </div>
  );
}
