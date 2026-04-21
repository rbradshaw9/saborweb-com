import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getAdminSiteDetail, type AdminSiteDetail } from '@/lib/admin/dashboard';
import { updateSiteStatus } from './actions';

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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-white/5 py-3">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-sw-dim)]">{label}</dt>
      <dd className="text-sm text-[var(--color-sw-cream)]">{value || 'Not provided'}</dd>
    </div>
  );
}

function JsonField({ label, value }: { label: string; value: unknown }) {
  return (
    <Field
      label={label}
      value={
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-sm bg-black/20 p-3 text-xs leading-relaxed text-[var(--color-sw-muted)]">
          {JSON.stringify(value ?? {}, null, 2)}
        </pre>
      }
    />
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--color-sw-cream)]">
      {label}
      <select
        className="h-11 rounded-sm border border-white/10 bg-[var(--color-sw-black)] px-3 text-sm text-[var(--color-sw-cream)]"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusPanel({ detail }: { detail: AdminSiteDetail }) {
  const action = updateSiteStatus.bind(null, detail.site.slug);

  return (
    <form action={action} className="grid gap-4 rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-5">
      <h2 className="text-xl">Operational status</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          defaultValue={detail.site.status}
          label="Site status"
          name="status"
          options={['draft', 'preview_building', 'preview_ready', 'claim_started', 'claimed', 'paid', 'live', 'archived']}
        />
        <SelectField
          defaultValue={detail.site.owner_status}
          label="Owner status"
          name="owner_status"
          options={['unclaimed', 'claim_started', 'claimed']}
        />
        <SelectField
          defaultValue={detail.site.payment_status}
          label="Payment status"
          name="payment_status"
          options={['unpaid', 'checkout_started', 'paid', 'failed', 'refunded', 'cancelled']}
        />
        <SelectField
          defaultValue={detail.site.selected_package ?? ''}
          label="Package"
          name="selected_package"
          options={['', 'presencia', 'visibilidad', 'crecimiento']}
        />
      </div>
      <button className="h-11 rounded-sm bg-[var(--color-sw-coral)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-sw-coral-dark)]">
        Save status
      </button>
    </form>
  );
}

export default async function AdminSiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getAdminSiteDetail(slug);

  if (!detail) notFound();

  return (
    <main className="min-h-screen bg-[var(--color-sw-black)] text-[var(--color-sw-cream)]">
      <section className="mx-auto grid w-full max-w-[1300px] gap-7 px-5 py-8 md:px-8">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-sw-muted)] hover:text-[var(--color-sw-cream)]" href="/admin">
          <ArrowLeft size={16} />
          Back to admin
        </Link>

        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3">
            <p className="eyebrow">{detail.site.preview_type} preview</p>
            <h1 className="text-4xl">{detail.site.restaurant_name}</h1>
            <p className="text-[var(--color-sw-muted)]">
              {detail.site.city ?? 'City unknown'} · {detail.site.slug} · Updated {formatDate(detail.site.updated_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-white/10 px-3 text-sm font-bold hover:border-[var(--color-sw-coral)]"
              href={absoluteSiteUrl(detail.site.preview_url)}
              rel="noreferrer"
              target="_blank"
            >
              Preview <ExternalLink size={14} />
            </a>
            <a
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-white/10 px-3 text-sm font-bold hover:border-[var(--color-sw-coral)]"
              href={absoluteSiteUrl(detail.site.claim_url)}
              rel="noreferrer"
              target="_blank"
            >
              Claim <ExternalLink size={14} />
            </a>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid content-start gap-6">
            <StatusPanel detail={detail} />

            <section className="rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-5">
              <h2 className="mb-3 text-xl">Contact</h2>
              <dl>
                <Field label="Owner" value={detail.site.owner_name ?? detail.request?.owner_name} />
                <Field label="Email" value={detail.site.owner_email ?? detail.request?.email} />
                <Field label="Phone" value={detail.site.owner_phone ?? detail.request?.phone} />
                <Field label="Source" value={detail.request?.source} />
                <Field label="Preferred language" value={detail.request?.preferred_language} />
              </dl>
            </section>

            <section className="rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-5">
              <h2 className="mb-3 text-xl">Timeline</h2>
              <ol className="grid gap-3">
                {detail.events.map((event) => (
                  <li className="border-l border-white/10 pl-4" key={event.id ?? `${event.event_type}-${event.created_at}`}>
                    <p className="font-semibold">{event.event_type.replaceAll('_', ' ')}</p>
                    <p className="text-sm text-[var(--color-sw-muted)]">{event.message ?? event.actor_type ?? 'Event recorded'}</p>
                    <p className="text-xs text-[var(--color-sw-dim)]">{formatDate(event.created_at)}</p>
                  </li>
                ))}
                {!detail.events.length && <li className="text-sm text-[var(--color-sw-muted)]">No events yet.</li>}
              </ol>
            </section>
          </div>

          <div className="grid gap-6">
            <section className="rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-5">
              <h2 className="mb-3 text-xl">Intake</h2>
              <dl className="grid gap-x-6 md:grid-cols-2">
                <Field label="Status" value={detail.intake?.status ?? detail.request?.status} />
                <Field label="Last step" value={String(detail.intake?.last_step ?? 0)} />
                <Field label="Cuisine" value={detail.intake?.cuisine} />
                <Field label="Address" value={detail.intake?.address} />
                <Field label="Neighborhood" value={detail.intake?.neighborhood} />
                <Field label="Domain status" value={detail.intake?.domain_status} />
                <Field label="Launch urgency" value={detail.intake?.launch_urgency} />
                <Field label="Brand style" value={detail.intake?.brand_style} />
                <Field label="Current website" value={detail.intake?.current_website ?? detail.request?.website_url} />
                <Field label="Instagram" value={detail.intake?.instagram_url ?? detail.request?.instagram_url} />
                <Field label="Google Business" value={detail.intake?.google_business_url ?? detail.request?.google_url} />
                <Field label="Menu URL" value={detail.intake?.menu_url} />
                <Field label="Ordering URL" value={detail.intake?.ordering_url} />
                <Field label="Reservations URL" value={detail.intake?.reservations_url} />
              </dl>
              <dl className="mt-3">
                <Field label="Brand notes" value={detail.intake?.brand_notes} />
                <Field label="Ideal guest" value={detail.intake?.ideal_guest} />
                <Field label="Differentiators" value={detail.intake?.differentiators} />
                <Field label="Owner goals" value={detail.intake?.owner_goals ?? detail.request?.notes} />
                <JsonField label="Hours" value={detail.intake?.hours} />
                <JsonField label="Menu notes" value={detail.intake?.menu_notes} />
                <JsonField label="Feature requests" value={detail.intake?.feature_requests} />
                <JsonField label="Asset links" value={detail.intake?.asset_links} />
              </dl>
            </section>

            <section className="rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-5">
              <h2 className="mb-3 text-xl">Files</h2>
              <div className="grid gap-2">
                {detail.files.map((file) => (
                  <div className="rounded-sm border border-white/10 p-3 text-sm" key={file.id}>
                    <p className="font-semibold">{file.file_name}</p>
                    <p className="text-[var(--color-sw-muted)]">
                      {file.file_role} · {file.content_type ?? 'Unknown type'} · {file.size_bytes ?? 0} bytes
                    </p>
                    <p className="break-all text-xs text-[var(--color-sw-dim)]">
                      {file.storage_bucket}/{file.storage_path}
                    </p>
                  </div>
                ))}
                {!detail.files.length && <p className="text-sm text-[var(--color-sw-muted)]">No uploaded files yet.</p>}
              </div>
            </section>

            <section className="rounded-sm border border-white/10 bg-[var(--color-sw-card)] p-5">
              <h2 className="mb-3 text-xl">Build prompt</h2>
              <textarea
                className="min-h-[420px] w-full resize-y rounded-sm border border-white/10 bg-black/25 p-4 font-mono text-xs leading-relaxed text-[var(--color-sw-cream)]"
                readOnly
                value={detail.buildBrief ?? 'Complete the intake to generate a build brief.'}
              />
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
