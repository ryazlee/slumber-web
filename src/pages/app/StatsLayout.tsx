import { NavLink, Outlet, useLocation } from 'react-router-dom';
import StatsZoomControls from '../../components/StatsZoomControls';
import { StatsZoomProvider, StatsZoomViewport } from '../../context/StatsZoomContext';
import { STATS_SUBNAV } from '../../lib/appNav';

function statsTabClass(active: boolean) {
  return active ? 'app-tab-bar-link active' : 'app-tab-bar-link';
}

export default function StatsLayout() {
  const location = useLocation();

  return (
    <StatsZoomProvider>
      <div className="app-page stats-hub">
        <div className="app-hub-head">
          <header className="app-page-header app-page-header--compact">
            <h1>Stats</h1>
          </header>

          <div className="stats-hub-toolbar">
            <nav className="app-tab-bar stats-hub-nav" aria-label="Stats sections">
              {STATS_SUBNAV.map((item) => {
                const active = item.end
                  ? location.pathname === item.to
                  : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={statsTabClass(active)}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <StatsZoomControls />
          </div>
        </div>

        <StatsZoomViewport>
          <Outlet />
        </StatsZoomViewport>
      </div>
    </StatsZoomProvider>
  );
}
