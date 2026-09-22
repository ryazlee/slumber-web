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
  '/admin': 'Health',
  '/admin/analytics': 'Activity',
  '/admin/tag-usage': 'Tag usage',
  '/admin/dreams': 'Dreams',
  '/admin/posts': 'Posts',
  '/admin/reports': 'Reports',
  '/admin/users': 'Users',
  '/admin/community': 'Clubs',
  '/admin/premium': 'Premium',
  '/admin/notify': 'Notify',
  '/admin/campaigns': 'Campaigns',
  '/admin/configure/tags': 'Tag catalog',
  '/admin/configure/roles': 'Roles',
};

function buildAdminNavGroups(pendingReports = 0): AdminNavGroup[] {
  return [
    {
      label: 'Health',
      items: [
        { to: '/admin', label: 'Snapshot', end: true },
      ],
    },
    {
      label: 'People',
      items: [
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/analytics', label: 'Activity' },
        { to: '/admin/tag-usage', label: 'Tag usage' },
        { to: '/admin/dreams', label: 'Dreams' },
        { to: '/admin/community', label: 'Clubs' },
        { to: '/admin/premium', label: 'Premium' },
      ],
    },
    {
      label: 'Actions',
      items: [
        { to: '/admin/notify', label: 'Notify' },
        { to: '/admin/campaigns', label: 'Campaigns' },
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
      label: 'Configure',
      items: [
        { to: '/admin/configure/tags', label: 'Tag catalog' },
        { to: '/admin/configure/roles', label: 'Roles' },
      ],
    },
  ];
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`;
}

type Props = {
  onNavigate?: () => void;
};

export default function AdminNav({ onNavigate }: Props) {
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
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={navLinkClass}
                  onClick={onNavigate}
                >
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
