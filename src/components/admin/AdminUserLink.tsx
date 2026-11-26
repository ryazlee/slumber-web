import type { MouseEvent, ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { adminUserPath } from './adminPaths';

type Props = {
  id?: string | null;
  username?: string | null;
  className?: string;
  /** Override the default `@username` label. */
  children?: ReactNode;
  stopPropagation?: boolean;
};

/** Clickable @username that opens the admin user detail panel. */
export default function AdminUserLink({
  id,
  username,
  className = 'admin-inline-link',
  children,
  stopPropagation = true,
}: Props) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const handle = username?.trim().replace(/^@/, '') || '';
  const label = children ?? (handle ? `@${handle}` : '—');

  let to = adminUserPath({ id, username: handle });
  // Keep active Users filters when already on that page.
  if (to && id?.trim() && location.pathname === '/admin/users') {
    const next = new URLSearchParams(searchParams);
    next.set('user', id.trim());
    to = `/admin/users?${next.toString()}`;
  }

  if (!to || !handle) {
    return <span>{label}</span>;
  }

  return (
    <Link
      to={to}
      className={className}
      onClick={(e: MouseEvent) => {
        if (stopPropagation) e.stopPropagation();
      }}
    >
      {label}
    </Link>
  );
}
