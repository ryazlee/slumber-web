import AdminSection from '../../components/admin/AdminSection';
import AdminShareSummary from '../../components/admin/AdminShareSummary';

export default function AdminSummaryPage() {
  return (
    <AdminSection
      className="admin-overview"
      lead="Turn cards on or off, then export a PNG of what’s left."
    >
      <AdminShareSummary />
    </AdminSection>
  );
}
