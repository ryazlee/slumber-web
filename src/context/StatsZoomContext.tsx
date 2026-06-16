import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useStatsZoomState } from '../hooks/useStatsZoomState';

type StatsZoomControls = Pick<
  ReturnType<typeof useStatsZoomState>,
  'zoomLabel' | 'isFitMode' | 'canZoomOut' | 'canZoomIn' | 'zoomOut' | 'zoomIn' | 'resetFit'
>;

type StatsZoomViewportState = Pick<
  ReturnType<typeof useStatsZoomState>,
  'outerRef' | 'innerRef' | 'effectiveScale'
>;

const StatsZoomControlsContext = createContext<StatsZoomControls | null>(null);
const StatsZoomViewportContext = createContext<StatsZoomViewportState | null>(null);

export { MIN_STATS_ZOOM, STATS_ZOOM_STEP } from '../hooks/useStatsZoomState';

export function StatsZoomProvider({ children }: { children: ReactNode }) {
  const state = useStatsZoomState();
  const {
    outerRef,
    innerRef,
    effectiveScale,
    ...controls
  } = state;

  return (
    <StatsZoomControlsContext.Provider value={controls}>
      <StatsZoomViewportContext.Provider value={{ outerRef, innerRef, effectiveScale }}>
        {children}
      </StatsZoomViewportContext.Provider>
    </StatsZoomControlsContext.Provider>
  );
}

export function StatsZoomViewport({ children }: { children: ReactNode }) {
  const viewport = useContext(StatsZoomViewportContext);
  if (!viewport) {
    throw new Error('StatsZoomViewport must be used within StatsZoomProvider');
  }

  const { outerRef, innerRef, effectiveScale } = viewport;

  return (
    <div ref={outerRef} className="stats-zoom-outer">
      <div
        ref={innerRef}
        className="stats-zoom-inner"
        style={{
          zoom: effectiveScale < 0.999 ? effectiveScale : undefined,
        } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

export function useStatsZoom(): StatsZoomControls {
  const ctx = useContext(StatsZoomControlsContext);
  if (!ctx) {
    throw new Error('useStatsZoom must be used within StatsZoomProvider');
  }
  return ctx;
}
