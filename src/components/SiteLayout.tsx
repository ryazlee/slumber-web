import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader';

export default function SiteLayout() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <Outlet />
    </div>
  );
}
