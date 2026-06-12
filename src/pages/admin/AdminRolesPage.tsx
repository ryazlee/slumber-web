import AdminRoles from '../../components/admin/AdminRoles';
import { useAdminRoleDefinitions } from '../../hooks/useAdmin';

export default function AdminRolesPage() {
  const rolesQuery = useAdminRoleDefinitions();
  const errorMessage = rolesQuery.error instanceof Error
    ? rolesQuery.error.message
    : rolesQuery.error
      ? 'Could not load roles.'
      : null;

  return (
    <AdminRoles
      roles={rolesQuery.data ?? []}
      loading={rolesQuery.isLoading}
      error={errorMessage}
    />
  );
}
