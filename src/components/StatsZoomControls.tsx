import { useStatsZoom } from '../context/StatsZoomContext';

export default function StatsZoomControls() {
  const {
    zoomLabel,
    isFitMode,
    canZoomOut,
    canZoomIn,
    zoomOut,
    zoomIn,
    resetFit,
  } = useStatsZoom();

  return (
    <div className="stats-zoom-controls" role="group" aria-label="Stats zoom">
      <button
        type="button"
        className="stats-zoom-btn"
        onClick={zoomOut}
        disabled={!canZoomOut}
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        className={`stats-zoom-btn stats-zoom-btn--label${isFitMode ? ' stats-zoom-btn--active' : ''}`}
        onClick={resetFit}
        aria-label="Reset zoom to fit width"
      >
        {zoomLabel}
      </button>
      <button
        type="button"
        className="stats-zoom-btn"
        onClick={zoomIn}
        disabled={!canZoomIn}
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
}
