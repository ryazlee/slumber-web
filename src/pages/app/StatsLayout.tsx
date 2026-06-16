import { Outlet } from 'react-router-dom';
import AppHubLayout from '../../components/AppHubLayout';
import StatsZoomControls from '../../components/StatsZoomControls';
import { StatsZoomProvider, StatsZoomViewport } from '../../context/StatsZoomContext';
import { STATS_SUBNAV } from '../../lib/appNav';

export default function StatsLayout() {
  return (
    <StatsZoomProvider>
      <AppHubLayout
        title="Stats"
        hubClassName="stats-hub"
        navClassName="stats-hub-nav"
        navLabel="Stats sections"
        subnav={STATS_SUBNAV}
        toolbar={<StatsZoomControls />}
      >
        <StatsZoomViewport>
          <Outlet />
        </StatsZoomViewport>
      </AppHubLayout>
    </StatsZoomProvider>
  );
}
