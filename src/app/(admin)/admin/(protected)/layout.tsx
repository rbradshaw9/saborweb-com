import { requireAdminUser } from '@/lib/admin/auth';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();

  return children;
}
