import AdminNotify from '../../components/admin/AdminNotify';
import { useAdmin } from '../../context/AdminContext';

export default function AdminNotifyPage() {
  const { refreshKey } = useAdmin();
  return <AdminNotify refreshToken={refreshKey} />;
}
