import { useCallback, useEffect, useState } from 'react';
import AdminRoles from '../../components/admin/AdminRoles';
import { useAdmin } from '../../context/AdminContext';
import { fetchAdminRoleDefinitions, type AdminRoleDefinitionRow } from '../../lib/admin';

export default function AdminRolesPage() {
  const { refreshKey } = useAdmin();
  const [roles, setRoles] = useState<AdminRoleDefinitionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoles(await fetchAdminRoleDefinitions());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load roles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <AdminRoles
      roles={roles}
      loading={loading}
      error={error}
      onChanged={load}
    />
  );
}
