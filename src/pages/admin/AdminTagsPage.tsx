import { useCallback, useEffect, useState } from 'react';
import AdminTags from '../../components/admin/AdminTags';
import { useAdmin } from '../../context/AdminContext';
import { fetchAdminTags, type AdminTagRow } from '../../lib/admin';

export default function AdminTagsPage() {
  const { refreshKey } = useAdmin();
  const [tags, setTags] = useState<AdminTagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTags(await fetchAdminTags());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load tags.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <AdminTags
      tags={tags}
      loading={loading}
      error={error}
      onChanged={load}
    />
  );
}
