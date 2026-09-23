import AdminHealthSnapshot from '../../components/admin/AdminHealthSnapshot';
import AdminSection from '../../components/admin/AdminSection';

export default function AdminAnalyticsPage() {
  return (
    <AdminSection
      className="admin-overview"
      lead="Are people joining, posting, coming back, and using friends, clubs, and challenges? Day / Week / Month are rolling windows. Deltas compare this window to the one before it."
    >
      <AdminHealthSnapshot />
    </AdminSection>
  );
}
