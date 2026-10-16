import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import AppHubLayout from '../../components/AppHubLayout';
import { useAuth } from '../../context/AuthContext';
import { useBoardUnreadBadges } from '../../hooks/useBoardUnreadBadges';
import { SOCIAL_SUBNAV } from '../../lib/appNav';

export default function SocialLayout() {
  const { session } = useAuth();
  const { clubBoardUnread } = useBoardUnreadBadges(Boolean(session));
  const subnav = useMemo(
    () => SOCIAL_SUBNAV.map((item) => (
      item.to === '/social/clubs'
        ? { ...item, badgeCount: clubBoardUnread }
        : item
    )),
    [clubBoardUnread],
  );

  return (
    <AppHubLayout
      title="Social"
      hubClassName="social-hub"
      navClassName="social-hub-nav"
      navLabel="Social sections"
      subnav={subnav}
    >
      <Outlet />
    </AppHubLayout>
  );
}
