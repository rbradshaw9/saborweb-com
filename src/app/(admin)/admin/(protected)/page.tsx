import Link from 'next/link';
import { ExternalLink, Filter, ShieldCheck } from 'lucide-react';
import { getAdminLeadRows, type AdminLeadRow } from '@/lib/admin/dashboard';
import { requireAdminUser } from '@/lib/admin/auth';
import { signOutAdmin } from './actions';

function absoluteSiteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://saborweb.com';
  return `${siteUrl.replace(/\/$/, '')}${value.startsWith('/') ? value : `/${value}`}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'None';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusClass(value: string) {
  switch (value) {
    case 'paid':
    case 'claimed':
    case 'live':
    case 'preview_ready':
      return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
    case 'checkout_started':
    case 'claim_started':
    case 'intake_started':
    case 'draft':
      return 'border-[rgba(226,185,106,0.28)] bg-[rgba(226,185,106,0.1)] text-[var(--color-sw-gold)]';
    case 'failed':
    case 'lost':
    case 'cancelled':
      return 'border-[rgba(232,105,74,0.35)] bg-[rgba(232,105,74,0.1)] text-[var(--color-sw-coral)]';
    default:
      return 'border-white/10 bg-white/[0.04] text-[var(--color-sw-muted)]';
  }
}

function StatusChip({ value }: { value: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-sm border px-2 py-1 text-xs font-bold ${statusClass(value)}`}>
      {value.replaceAll('_', ' ')}
    </span>
  );
}

function filterRows(rows: AdminLeadRow[], status: string, payment: string) {
  return rows.filter((row) => {
    const matchesStatus = status === 'all' || row.status === status || row.request?.status === status;
    const matchesPayment = payment === 'all' || row.payment_status === payment;
    return matchesStatus && matchesPayment;
  });
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      className={`inline-flex h-9 items-center rounded-sm border px-3 text-sm font-bold transition ${
        active
          ? 'border-[var(--color-sw-coral)] bg-[rgba(232,105,74,0.12)] text-[var(--color-sw-cream)]'
          : 'border-white/10 text-[var(--color-sw-muted)] hover:border-white/25 hover:text-[var(--color-sw-cream)]'
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; payment?: string | string[] }>;
}) {
  const user = await requireAdminUser();
  const { rows, summary } = await getAdminLeadRows();
  const params = await searchParams;
  const status = Array.isArray(params.status) ? params.status[0] : params.status ?? 'all';
  const payment = Array.isArray(params.payment) ? params.payment[0] : params.payment ?? 'all';
  const filteredRows = filterRows(rows, status, payment);

  return (
    <main className="min-h-screen bg-[var(--color-sw-black)] text-[var(--color-sw-cream)]">
      <section className="mx-auto grid w-full max-w-[1480px] gap-8 px-5 py-8 md:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-3">
            <p className="eyebrow">Operations</p>
            <h1 className="text-4xl">Sabor Web Admin</h1>
            <p className="text-[var(--color-sw-muted)]">
              Signed in as {user.email}. Scan leads, preview state, claim state, and recent activity.
            </p>
          </div>

          <form action={signOutAdmin}>
            <button className="rounded-sm border border-white/15 px-4 py-2 text-sm font-bold text-[var(--color-sw-cream)] transition hover:border-[var(--color-sw-coral)]">
              Sign out
            </button>
          </form>
        </header>

        <div className="grid gap-4 md:grid-cols-5">
          {[
            ['Total', String(summary.total)],
            ['Unpaid', String(summary.unpaid)],
            ['Paid', String(summary.paid)],
            ['Draft Sites', String(summary.drafts)],
            ['Active Intakes', String(summary.activeIntakes)],
          ].map(([title, value]) => (
            <article className="rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-5" key={title}>
              <ShieldCheck className="mb-4 text-[var(--color-sw-coral)]" size={22} />
              <p className="label-muted mb-3">{title}</p>
              <p className="text-3xl font-black">{value}</p>
            </article>
          ))}
        </div>

        <section className="grid gap-4 rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-[var(--color-sw-coral)]" />
            <FilterLink href="/admin" active={status === 'all' && payment === 'all'}>
              All
            </FilterLink>
            <FilterLink href="/admin?status=draft" active={status === 'draft'}>
              Draft sites
            </FilterLink>
            <FilterLink href="/admin?status=preview_ready" active={status === 'preview_ready'}>
              Preview ready
            </FilterLink>
            <FilterLink href="/admin?payment=checkout_started" active={payment === 'checkout_started'}>
              Checkout started
            </FilterLink>
            <FilterLink href="/admin?payment=paid" active={payment === 'paid'}>
              Paid
            </FilterLink>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-white/10 text-xs uppercase tracking-[0.12em] text-[var(--color-sw-dim)]">
                  <th className="py-3 pr-4">Restaurant</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Intake</th>
                  <th className="px-4 py-3">Latest activity</th>
                  <th className="py-3 pl-4">Links</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr className="border-b border-white/5 align-top" key={row.id}>
                    <td className="py-4 pr-4">
                      <div className="grid gap-1">
                        <span className="font-bold text-[var(--color-sw-cream)]">{row.restaurant_name}</span>
                        <span className="text-xs text-[var(--color-sw-muted)]">
                          {row.city ?? 'City unknown'} · {row.slug}
                        </span>
                        <span className="text-xs text-[var(--color-sw-dim)]">
                          Created {formatDate(row.request?.created_at ?? row.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid gap-1 text-[var(--color-sw-muted)]">
                        <span className="font-semibold text-[var(--color-sw-cream)]">
                          {row.owner_name ?? 'Unknown'}
                        </span>
                        <span>{row.owner_email ?? 'No email'}</span>
                        <span>{row.owner_phone ?? 'No phone'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid gap-2">
                        <StatusChip value={row.status} />
                        <StatusChip value={row.owner_status} />
                        <span className="text-xs text-[var(--color-sw-muted)]">{row.preview_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid gap-2">
                        <StatusChip value={row.payment_status} />
                        <span className="text-xs text-[var(--color-sw-muted)]">
                          {row.selected_package ?? 'No package'} · Paid {formatDate(row.paid_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid gap-2">
                        <StatusChip value={row.intake?.status ?? row.request?.status ?? 'not started'} />
                        <span className="text-xs text-[var(--color-sw-muted)]">
                          Step {row.intake?.last_step ?? 0} · Updated {formatDate(row.intake?.updated_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid gap-1 text-[var(--color-sw-muted)]">
                        <span className="font-semibold text-[var(--color-sw-cream)]">
                          {row.latestEvent?.event_type?.replaceAll('_', ' ') ?? 'No events'}
                        </span>
                        <span className="max-w-[260px] truncate">
                          {row.latestEvent?.message ?? 'Waiting for activity'}
                        </span>
                        <span className="text-xs text-[var(--color-sw-dim)]">
                          {formatDate(row.latestEvent?.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pl-4">
                      <div className="flex flex-wrap gap-2">
                        <a
                          className="inline-flex h-8 items-center gap-1 rounded-sm border border-white/10 px-2 text-xs font-bold text-[var(--color-sw-cream)] hover:border-[var(--color-sw-coral)]"
                          href={absoluteSiteUrl(row.preview_url)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Preview <ExternalLink size={13} />
                        </a>
                        <a
                          className="inline-flex h-8 items-center gap-1 rounded-sm border border-white/10 px-2 text-xs font-bold text-[var(--color-sw-cream)] hover:border-[var(--color-sw-coral)]"
                          href={absoluteSiteUrl(row.claim_url)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Claim <ExternalLink size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredRows.length && (
              <p className="py-8 text-center text-sm text-[var(--color-sw-muted)]">
                No rows match this filter yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
