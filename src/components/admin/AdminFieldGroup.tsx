import type { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

export default function AdminFieldGroup({ title, children, className = '' }: Props) {
  return (
    <div className={`admin-field-group${className ? ` ${className}` : ''}`}>
      <p className="admin-field-group-title">{title}</p>
      {children}
    </div>
  );
}
