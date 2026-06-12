import AdminTags from '../../components/admin/AdminTags';
import { useAdminTagsCatalog } from '../../hooks/useAdmin';

export default function AdminTagsPage() {
  const tagsQuery = useAdminTagsCatalog();
  const errorMessage = tagsQuery.error instanceof Error
    ? tagsQuery.error.message
    : tagsQuery.error
      ? 'Could not load tags.'
      : null;

  return (
    <AdminTags
      tags={tagsQuery.data ?? []}
      loading={tagsQuery.isLoading}
      error={errorMessage}
    />
  );
}
