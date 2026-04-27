import { requireAdminUser } from '@/lib/admin/auth';
import { AdminLiveSync } from './AdminLiveSync';
import './admin.css';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();

  return (
    <div className="admin-scope">
      <AdminLiveSync />
      {children}
    </div>
  );
}
