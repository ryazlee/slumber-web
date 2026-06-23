import { NavLink } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export type AdminNavItem = {
  to: string;
  label: string;
  end?: boolean;
  badge?: number;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/admin': 'Home',
  '/admin/analytics': 'Analytics',
  '/admin/posts': 'Posts',
  '/admin/reports': 'Reports',
  '/admin/users': 'Users',
  '/admin/community': 'Community',
  '/admin/premium': 'Premium',
  '/admin/notify': 'Notify',
  '/admin/configure/tags': 'Tags',
  '/admin/configure/roles': 'Roles',
};

function buildAdminNavGroups(pendingReports = 0): AdminNavGroup[] {
  return [
    {
      label: 'Overview',
      items: [
        { to: '/admin', label: 'Home', end: true },
        { to: '/admin/analytics', label: 'Analytics' },
      ],
    },
    {
      label: 'Moderation',
      items: [
        {
          to: '/admin/reports',
          label: 'Reports',
          badge: pendingReports > 0 ? pendingReports : undefined,
        },
        { to: '/admin/posts', label: 'Posts' },
      ],
    },
    {
      label: 'People',
      items: [
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/community', label: 'Community' },
        { to: '/admin/premium', label: 'Premium' },
        { to: '/admin/notify', label: 'Notify' },
      ],
    },
    {
      label: 'Configure',
      items: [
        { to: '/admin/configure/tags', label: 'Tags' },
        { to: '/admin/configure/roles', label: 'Roles' },
      ],
    },
  ];
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`;
}

export default function AdminNav() {
  const { metrics } = useAdmin();
  const pendingReports = (metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0);
  const groups = buildAdminNavGroups(pendingReports);

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      {groups.map((group) => (
        <div key={group.label} className="admin-nav-group">
          <p className="admin-nav-label">{group.label}</p>
          <ul className="admin-nav-list">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={navLinkClass}>
                  <span>{item.label}</span>
                  {item.badge != null ? (
                    <span className="admin-nav-badge">{item.badge}</span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
