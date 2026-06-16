import { Outlet } from 'react-router-dom';
import AppHubLayout from '../../components/AppHubLayout';
import { SOCIAL_SUBNAV } from '../../lib/appNav';

export default function SocialLayout() {
  return (
    <AppHubLayout
      title="Social"
      hubClassName="social-hub"
      navClassName="social-hub-nav"
      navLabel="Social sections"
      subnav={SOCIAL_SUBNAV}
    >
      <Outlet />
    </AppHubLayout>
  );
}
