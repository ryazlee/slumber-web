import { NavLink, useLocation } from 'react-router-dom';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { isNavActive } from '../lib/appNav';

export default function HeaderProfileLink() {
  const { user } = useAuth();
  const profileQuery = useProfile(user?.id ?? null);
  const location = useLocation();
  const path = user ? `/profile/${user.id}` : '/profile';
  const active = isNavActive(location.pathname, { to: path, matchPrefix: '/profile' });

  if (!user) return null;

  const profile = profileQuery.data;

  return (
    <NavLink
      to={path}
      className={`header-profile-link${active ? ' header-profile-link--active' : ''}`}
      aria-label="Your profile"
      aria-current={active ? 'page' : undefined}
    >
      <Avatar
        userId={user.id}
        username={profile?.username ?? 'you'}
        avatarUrl={profile?.avatarUrl}
        userRoles={profile?.userRoles}
        size="sm"
      />
    </NavLink>
  );
}
