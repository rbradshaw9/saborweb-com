import { ShieldCheck } from 'lucide-react';
import { requireAdminUser } from '@/lib/admin/auth';
import { signOutAdmin } from './actions';

export default async function AdminDashboardPage() {
  const user = await requireAdminUser();

  return (
    <main className="min-h-screen bg-[var(--color-sw-black)] text-[var(--color-sw-cream)]">
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 md:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-3">
            <p className="eyebrow">Operations</p>
            <h1 className="text-4xl">Sabor Web Admin</h1>
            <p className="text-[var(--color-sw-muted)]">
              Signed in as {user.email}. CRM screens will plug into this protected area.
            </p>
          </div>

          <form action={signOutAdmin}>
            <button className="rounded-sm border border-white/15 px-4 py-2 text-sm font-bold text-[var(--color-sw-cream)] transition hover:border-[var(--color-sw-coral)]">
              Sign out
            </button>
          </form>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Auth Gate', 'Supabase session verified against ADMIN_EMAILS.'],
            ['Lead Queue', 'Next: dense table for preview requests and intake status.'],
            ['Site Ownership', 'Next: claim, payment, and domain state in one admin view.'],
          ].map(([title, copy]) => (
            <article className="rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-5" key={title}>
              <ShieldCheck className="mb-4 text-[var(--color-sw-coral)]" size={22} />
              <h2 className="mb-2 text-xl">{title}</h2>
              <p className="text-sm text-[var(--color-sw-muted)]">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
