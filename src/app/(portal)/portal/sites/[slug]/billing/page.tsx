import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { getServicePackage } from '@/lib/packages';
import { PortalAuthorizationError, assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';
import { createStripeBillingPortalSession } from './actions';

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function label(value: string | null) {
  if (!value) return 'Not selected';
  return value.replaceAll('_', ' ');
}

function statusMessage(searchParams: { error?: string | string[] }) {
  const error = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  if (error === 'owner-required') return 'Only the account owner can manage billing.';
  if (error === 'missing-customer') return 'Billing management is not connected for this restaurant yet.';
  if (error === 'stripe-not-configured') return 'Stripe billing is not configured in this environment.';
  if (error === 'portal-unavailable') return 'Stripe could not open billing management. Try again or contact support.';
  return null;
}

export default async function PortalBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { slug } = await params;
  const user = await requirePortalUser(`/portal/sites/${slug}/billing`);

  let access;
  try {
    access = await assertOwnsRestaurant(user.id, slug);
  } catch (error) {
    if (error instanceof PortalAuthorizationError && error.code === 'not_found') notFound();
    throw error;
  }

  const pkg = getServicePackage(access.site.selectedPackage);
  const isOwner = access.membership.role === 'owner';
  const hasStripeCustomer = Boolean(access.site.stripeCustomerId);
  const error = statusMessage(await searchParams);

  return (
    <section className="portal-wrap portal-grid">
      <Link className="portal-button portal-button--ghost w-fit" href={`/portal/sites/${slug}`}>
        <ArrowLeft size={16} />
        Restaurant dashboard
      </Link>

      <div className="portal-card portal-card--padded portal-grid">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Billing</p>
            <h1 className="text-4xl">{access.site.restaurantName}</h1>
            <p className="portal-muted mt-3">Package and payment status for this restaurant.</p>
          </div>
          <span className="portal-pill">{access.membership.role}</span>
        </div>

        {error ? <p className="portal-error">{error}</p> : null}

        <div className="portal-stat-grid">
          <p className="portal-stat">
            <span>Package</span>
            <strong>{pkg?.name ?? label(access.site.selectedPackage)}</strong>
          </p>
          <p className="portal-stat">
            <span>Payment</span>
            <strong>{label(access.site.paymentStatus)}</strong>
          </p>
          <p className="portal-stat">
            <span>Setup</span>
            <strong>{pkg ? formatMoney(pkg.setup) : 'Not available'}</strong>
          </p>
          <p className="portal-stat">
            <span>Monthly</span>
            <strong>{pkg ? `${formatMoney(pkg.monthly)} / mo` : 'Not available'}</strong>
          </p>
        </div>

        <div className="portal-panel portal-grid">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-1 shrink-0 text-[var(--color-sw-coral)]" size={20} />
            <div>
              <h2 className="text-xl">Stripe-hosted billing</h2>
              <p className="portal-muted mt-2">
                Manage payment methods, invoices, and subscription details in Stripe.
              </p>
            </div>
          </div>

          {hasStripeCustomer ? (
            <form action={createStripeBillingPortalSession}>
              <input name="slug" type="hidden" value={slug} />
              <button className="portal-button portal-button--primary" disabled={!isOwner} type="submit">
                <ExternalLink size={16} />
                Manage billing
              </button>
            </form>
          ) : (
            <Link className="portal-button portal-button--ghost w-fit" href={`/portal/sites/${slug}/support`}>
              Contact support
            </Link>
          )}

          {!isOwner ? <p className="portal-pill w-fit">Owner only</p> : null}
        </div>
      </div>
    </section>
  );
}
