import AdminHealthSnapshot from '../../components/admin/AdminHealthSnapshot';
import AdminSection from '../../components/admin/AdminSection';

export default function AdminAnalyticsPage() {
  return (
    <AdminSection
      className="admin-overview"
      lead="Counts for the window you pick, compared with the window before it. Right now is the current total."
    >
      <AdminHealthSnapshot />
    </AdminSection>
  );
}
