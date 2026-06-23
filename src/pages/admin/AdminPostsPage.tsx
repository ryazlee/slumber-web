import { useSearchParams } from 'react-router-dom';
import AdminPosts from '../../components/admin/AdminPosts';
import { useAnalyticsFilterPageState } from '../../hooks/useAnalyticsFilterPageState';

export default function AdminPostsPage() {
  const filterProps = useAnalyticsFilterPageState();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('user');

  return <AdminPosts {...filterProps} userId={userId} />;
}
