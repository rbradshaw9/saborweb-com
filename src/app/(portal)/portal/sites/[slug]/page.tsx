import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { PortalAuthorizationError, assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function siteLiveHref(slug: string, liveUrl: string | null) {
  if (liveUrl) return liveUrl;
  return `https://${slug}.saborweb.com`;
}

export default async function PortalSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requirePortalUser(`/portal/sites/${slug}`);

  let access;
  try {
    access = await assertOwnsRestaurant(user.id, slug);
  } catch (error) {
    if (error instanceof PortalAuthorizationError && error.code === 'not_found') {
      notFound();
    }
    throw error;
  }

  const { site, membership } = access;
  const canEdit = membership.role === 'owner' || membership.role === 'manager';

  return (
    <section className="portal-wrap portal-grid">
      <Link className="portal-button portal-button--ghost w-fit" href="/portal/sites">
        <ArrowLeft size={16} />
        All restaurants
      </Link>

      <div className="portal-card portal-card--padded portal-grid">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Restaurant dashboard</p>
            <h1 className="text-4xl">{site.restaurantName}</h1>
            <p className="portal-muted mt-3">{site.city ?? 'Restaurant site'}</p>
          </div>
          <span className="portal-pill">{membership.role}</span>
        </div>

        <div className="portal-stat-grid">
          <p className="portal-stat">
            <span>Site status</span>
            <strong>{site.status.replaceAll('_', ' ')}</strong>
          </p>
          <p className="portal-stat">
            <span>Payment</span>
            <strong>{site.paymentStatus.replaceAll('_', ' ')}</strong>
          </p>
          <p className="portal-stat">
            <span>Package</span>
            <strong>{site.selectedPackage ?? 'Not selected'}</strong>
          </p>
          <p className="portal-stat">
            <span>Last updated</span>
            <strong>{formatDate(site.updatedAt)}</strong>
          </p>
        </div>

        <div className="portal-actions">
          <a className="portal-button portal-button--primary" href={siteLiveHref(site.slug, site.liveUrl)} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            View live site
          </a>
          <a className="portal-button portal-button--ghost" href={site.previewUrl} target="_blank" rel="noreferrer">
            Preview
          </a>
          <Link className="portal-button portal-button--ghost" href={`/portal/sites/${site.slug}/billing`}>
            Billing
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="portal-card portal-card--padded">
          <h2 className="text-xl">Restaurant basics</h2>
          <p className="portal-muted mt-2">Name, phone, address, and links</p>
          <Link className="portal-button portal-button--ghost mt-5" href={`/portal/sites/${site.slug}/settings`}>
            {canEdit ? 'Edit basics' : 'View basics'}
          </Link>
        </article>

        <article className="portal-card portal-card--padded">
          <h2 className="text-xl">Hours</h2>
          <p className="portal-muted mt-2">Weekly schedule and closed days</p>
          <Link className="portal-button portal-button--ghost mt-5" href={`/portal/sites/${site.slug}/hours`}>
            {canEdit ? 'Edit hours' : 'View hours'}
          </Link>
        </article>

        <article className="portal-card portal-card--padded">
          <h2 className="text-xl">Menu</h2>
          <p className="portal-muted mt-2">Categories, items, prices, and availability</p>
          <Link className="portal-button portal-button--ghost mt-5" href={`/portal/sites/${site.slug}/menu`}>
            {canEdit ? 'Edit menu' : 'View menu'}
          </Link>
        </article>

        <article className="portal-card portal-card--padded">
          <h2 className="text-xl">Support request</h2>
          <p className="portal-muted mt-2">Ask Sabor Web for help</p>
          <Link className="portal-button portal-button--ghost mt-5" href={`/portal/sites/${site.slug}/support`}>
            {canEdit ? 'Send request' : 'View support'}
          </Link>
        </article>
      </div>
    </section>
  );
}
