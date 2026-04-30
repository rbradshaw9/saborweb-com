import Link from 'next/link';
import { ExternalLink, LogOut } from 'lucide-react';
import { listPortalSites, requirePortalUser } from '@/lib/portal/auth';
import { signOutPortal } from '../actions';

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

export default async function PortalSitesPage() {
  const user = await requirePortalUser('/portal/sites');
  const sites = await listPortalSites(user.id);

  return (
    <section className="portal-wrap portal-grid">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="portal-grid">
          <p className="eyebrow">Your restaurants</p>
          <h1 className="text-4xl">Portal dashboard</h1>
          <p className="portal-muted">Site status, billing, and owner updates for your Sabor Web restaurants.</p>
        </div>

        <form action={signOutPortal}>
          <button className="portal-button portal-button--ghost" type="submit">
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </div>

      {sites.length ? (
        <div className="portal-grid">
          {sites.map((site) => (
            <article className="portal-card portal-site-card" key={site.id}>
              <div className="portal-site-card__top">
                <div>
                  <h2 className="text-2xl">{site.restaurantName}</h2>
                  <p className="portal-muted">{site.city ?? 'Restaurant site'}</p>
                </div>
                <span className="portal-pill">{site.role}</span>
              </div>

              <div className="portal-stat-grid">
                <p className="portal-stat">
                  <span>Status</span>
                  <strong>{site.status.replaceAll('_', ' ')}</strong>
                </p>
                <p className="portal-stat">
                  <span>Payment</span>
                  <strong>{site.paymentStatus.replaceAll('_', ' ')}</strong>
                </p>
                <p className="portal-stat">
                  <span>Updated</span>
                  <strong>{formatDate(site.updatedAt)}</strong>
                </p>
              </div>

              <div className="portal-actions">
                <Link className="portal-button portal-button--primary" href={`/portal/sites/${site.slug}`}>
                  Open dashboard
                </Link>
                <a className="portal-button portal-button--ghost" href={siteLiveHref(site.slug, site.liveUrl)} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} />
                  View live site
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="portal-card portal-card--padded">
          <h2 className="text-2xl">No active restaurants yet</h2>
          <p className="portal-muted mt-3">
            Once your preview is claimed, your restaurant will appear here with update and billing tools.
          </p>
        </div>
      )}
    </section>
  );
}
