import AdminPosts from '../../components/admin/AdminPosts';
import { useAnalyticsFilterPageState } from '../../hooks/useAnalyticsFilterPageState';

export default function AdminPostsPage() {
  const filterProps = useAnalyticsFilterPageState();
  return <AdminPosts {...filterProps} />;
}
