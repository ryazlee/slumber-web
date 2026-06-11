import { useCallback } from 'react';
import AdminUsers from '../../components/admin/AdminUsers';
import { useAdmin } from '../../context/AdminContext';

export default function AdminUsersPage() {
  const { refreshKey, refreshMetrics } = useAdmin();

  const onReload = useCallback(async () => {
    await refreshMetrics();
  }, [refreshMetrics]);

  return (
    <AdminUsers
      refreshToken={refreshKey}
      onReload={onReload}
    />
  );
}
