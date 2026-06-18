import AdminAnalytics from '../../components/admin/AdminAnalytics';
import { useAnalyticsFilterPageState } from '../../hooks/useAnalyticsFilterPageState';

export default function AdminAnalyticsPage() {
  const filterProps = useAnalyticsFilterPageState();
  return <AdminAnalytics {...filterProps} />;
}
