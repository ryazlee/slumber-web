import AdminHealthSnapshot from '../../components/admin/AdminHealthSnapshot';
import AdminSection from '../../components/admin/AdminSection';

export default function AdminAnalyticsPage() {
  return (
    <AdminSection
      className="admin-overview"
      lead="Counts and daily charts for the window you pick. Shorter windows also show the change from the previous one. Right now is the current total."
    >
      <AdminHealthSnapshot />
    </AdminSection>
  );
}
