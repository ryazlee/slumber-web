import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { DashboardMetrics } from '../lib/admin';
import { useAdminRefresh, useDashboardMetrics } from '../hooks/useAdmin';

type AdminContextValue = {
  metrics: DashboardMetrics | null;
  refreshing: boolean;
  refreshMetrics: () => Promise<void>;
  triggerRefresh: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const { data: metrics = null } = useDashboardMetrics(enabled);
  const { triggerRefresh, refreshMetrics, refreshing } = useAdminRefresh();

  const value = useMemo(
    () => ({ metrics, refreshing, refreshMetrics, triggerRefresh }),
    [metrics, refreshing, refreshMetrics, triggerRefresh],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
