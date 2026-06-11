import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchDashboardMetrics, type DashboardMetrics } from '../lib/admin';

type AdminContextValue = {
  metrics: DashboardMetrics | null;
  refreshKey: number;
  refreshing: boolean;
  refreshMetrics: () => Promise<void>;
  triggerRefresh: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refreshMetrics = useCallback(async () => {
    if (!enabled) return;
    setRefreshing(true);
    try {
      setMetrics(await fetchDashboardMetrics());
    } catch {
      /* badge counts optional */
    } finally {
      setRefreshing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) refreshMetrics();
  }, [enabled, refreshMetrics]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((n) => n + 1);
    refreshMetrics();
  }, [refreshMetrics]);

  const value = useMemo(
    () => ({ metrics, refreshKey, refreshing, refreshMetrics, triggerRefresh }),
    [metrics, refreshKey, refreshing, refreshMetrics, triggerRefresh],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
