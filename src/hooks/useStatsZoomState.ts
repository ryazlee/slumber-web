import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'slumber-stats-zoom-mode';
const STORAGE_ZOOM_KEY = 'slumber-stats-zoom-level';

export const MIN_STATS_ZOOM = 0.55;
export const STATS_ZOOM_STEP = 0.08;

type ZoomMode = 'fit' | 'manual';

export type StatsZoomState = {
  outerRef: React.RefObject<HTMLDivElement | null>;
  innerRef: React.RefObject<HTMLDivElement | null>;
  effectiveScale: number;
  zoomLabel: string;
  isFitMode: boolean;
  canZoomOut: boolean;
  canZoomIn: boolean;
  zoomOut: () => void;
  zoomIn: () => void;
  resetFit: () => void;
};

function loadStoredMode(): ZoomMode {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'manual' ? 'manual' : 'fit';
  } catch {
    return 'fit';
  }
}

function loadStoredZoom(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_ZOOM_KEY);
    const n = raw ? Number.parseFloat(raw) : 1;
    if (!Number.isFinite(n)) return 1;
    return Math.max(MIN_STATS_ZOOM, Math.min(1, n));
  } catch {
    return 1;
  }
}

function measureNaturalWidth(inner: HTMLElement): number {
  const previousZoom = inner.style.zoom;
  inner.style.zoom = '1';
  const width = inner.scrollWidth;
  inner.style.zoom = previousZoom;
  return width;
}

export function useStatsZoomState(): StatsZoomState {
  const location = useLocation();
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const fitScaleRef = useRef(1);
  const [fitScale, setFitScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<ZoomMode>(loadStoredMode);
  const [manualZoom, setManualZoom] = useState(loadStoredZoom);
  const zoomModeRef = useRef(zoomMode);
  zoomModeRef.current = zoomMode;

  const effectiveScale = zoomMode === 'fit'
    ? fitScale
    : Math.max(MIN_STATS_ZOOM, Math.min(1, manualZoom));

  const applyFitScale = useCallback((nextFit: number) => {
    if (Math.abs(fitScaleRef.current - nextFit) < 0.005) return;
    fitScaleRef.current = nextFit;
    setFitScale(nextFit);
  }, []);

  const recomputeFit = useCallback(() => {
    if (zoomModeRef.current !== 'fit') return;

    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const available = outer.clientWidth;
    if (available <= 0) return;

    const needed = measureNaturalWidth(inner);
    const nextFit = needed > available + 1
      ? Math.max(MIN_STATS_ZOOM, available / needed)
      : 1;
    applyFitScale(nextFit);
  }, [applyFitScale]);

  useLayoutEffect(() => {
    fitScaleRef.current = 1;
    setFitScale(1);
  }, [location.pathname, location.search]);

  useLayoutEffect(() => {
    recomputeFit();

    const outer = outerRef.current;
    if (!outer) return;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => recomputeFit());
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(outer);

    const delayed = window.setTimeout(recomputeFit, 250);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(delayed);
      ro.disconnect();
    };
  }, [recomputeFit, location.pathname, location.search]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, zoomMode);
      sessionStorage.setItem(STORAGE_ZOOM_KEY, String(manualZoom));
    } catch {
      // ignore
    }
  }, [zoomMode, manualZoom]);

  const zoomOut = useCallback(() => {
    setZoomMode('manual');
    setManualZoom((current) => {
      const base = zoomModeRef.current === 'fit' ? fitScaleRef.current : current;
      return Math.max(MIN_STATS_ZOOM, base - STATS_ZOOM_STEP);
    });
  }, []);

  const zoomIn = useCallback(() => {
    setZoomMode('manual');
    setManualZoom((current) => {
      const base = zoomModeRef.current === 'fit' ? fitScaleRef.current : current;
      return Math.min(1, base + STATS_ZOOM_STEP);
    });
  }, []);

  const resetFit = useCallback(() => {
    setZoomMode('fit');
    setManualZoom(1);
    requestAnimationFrame(() => recomputeFit());
  }, [recomputeFit]);

  const zoomLabel = zoomMode === 'fit'
    ? (fitScale < 0.99 ? `Fit ${Math.round(fitScale * 100)}%` : '100%')
    : `${Math.round(effectiveScale * 100)}%`;

  return {
    outerRef,
    innerRef,
    effectiveScale,
    zoomLabel,
    isFitMode: zoomMode === 'fit',
    canZoomOut: effectiveScale > MIN_STATS_ZOOM + 0.001,
    canZoomIn: effectiveScale < 0.999,
    zoomOut,
    zoomIn,
    resetFit,
  };
}
