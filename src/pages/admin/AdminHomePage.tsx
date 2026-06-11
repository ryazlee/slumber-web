import { NavLink } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

type HubLink = {
  to: string;
  title: string;
  description: string;
  badge?: number;
};

function hubCardClass({ isActive }: { isActive: boolean }) {
  return `admin-hub-card${isActive ? ' admin-hub-card--active' : ''}`;
}

export default function AdminHomePage() {
  const { metrics } = useAdmin();
  const openReports = (metrics?.pending_post_reports ?? 0) + (metrics?.pending_comment_reports ?? 0);

  const links: HubLink[] = [
    {
      to: 'analytics',
      title: 'Analytics',
      description: 'Metrics, daily charts, signups, and tag usage.',
    },
    {
      to: 'reports',
      title: 'Reports',
      description: 'Review reported posts and comments.',
      badge: openReports > 0 ? openReports : undefined,
    },
    {
      to: 'users',
      title: 'Users',
      description: 'Search accounts and manage roles.',
    },
    {
      to: 'notify',
      title: 'Notify',
      description: 'Send push notifications to a user.',
    },
    {
      to: 'configure/tags',
      title: 'Tags',
      description: 'Edit composer tag catalog.',
    },
    {
      to: 'configure/roles',
      title: 'Roles',
      description: 'Manage role definitions and badges.',
    },
  ];

  return (
    <div className="admin-hub">
      <p className="admin-muted admin-hub-lead">
        Pick a section to manage Slumber.
      </p>
      <nav className="admin-hub-grid" aria-label="Admin sections">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={hubCardClass}>
            <span className="admin-hub-card-top">
              <span className="admin-hub-card-title">{link.title}</span>
              {link.badge != null && (
                <span className="admin-hub-badge">{link.badge}</span>
              )}
            </span>
            <span className="admin-hub-card-desc">{link.description}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
