import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/admin/auth';
import AdminLoginForm from './AdminLoginForm';

function safeNextPath(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith('/admin') || candidate.startsWith('/admin/login')) {
    return '/admin';
  }
  return candidate;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const user = await getAdminUser();
  const nextPath = safeNextPath((await searchParams).next);

  if (user) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-[var(--color-sw-black)] px-5 py-8 text-[var(--color-sw-cream)]">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-md content-center gap-8">
        <div className="grid gap-4">
          <p className="eyebrow">Sabor Web Admin</p>
          <h1 className="text-4xl">Sign in</h1>
          <p className="text-base text-[var(--color-sw-muted)]">
            Protected access for lead review, preview ownership, and launch operations.
          </p>
        </div>

        <div className="rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-6 shadow-[var(--sw-shadow)]">
          <AdminLoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
