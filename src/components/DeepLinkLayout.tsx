import { Outlet } from 'react-router-dom';

/** Minimal full-screen shell for invite / open-in-app pages (no marketing header). */
export default function DeepLinkLayout() {
  return (
    <div className="deeplink-shell">
      <Outlet />
    </div>
  );
}
