import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { SERVICE_PACKAGES } from '@/lib/packages';
import { getRestaurantSiteBySlug, siteHref } from '@/lib/sites';

export const dynamic = 'force-dynamic';

function dollars(value: number) {
  return `$${value.toLocaleString()}`;
}

export default async function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getRestaurantSiteBySlug(slug);

  if (!site) notFound();

  const previewHref = siteHref(site.external_preview_url ?? site.preview_url);
  const statusLabel = site.payment_status === 'paid' ? 'Claimed' : 'Ready to claim';

  return (
    <div className="page-shell">
      <section className="section-v2 section-v2--dark" style={{ paddingTop: '150px' }}>
        <div className="section-v2__inner">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{statusLabel}</p>
              <h1>Claim {site.restaurant_name}</h1>
            </div>
            <p>
              Choose the package that fits this preview. The setup fee is charged today, then monthly service begins
              30 days later.
            </p>
          </div>
          <div className="button-row">
            <Link className="button button--secondary" href={previewHref} target={previewHref.startsWith('http') ? '_blank' : undefined}>
              View preview <ExternalLink size={16} />
            </Link>
            <Link className="button button--primary" href="#packages">
              Choose package <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-v2 section-v2--paper">
        <div className="section-v2__inner">
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Preview</h3>
              <p>{site.preview_type === 'external' ? 'External preview deployment' : 'Native SaborWeb preview'}</p>
            </article>
            <article className="feature-card">
              <h3>Restaurant</h3>
              <p>{[site.restaurant_name, site.city].filter(Boolean).join(' · ')}</p>
            </article>
            <article className="feature-card">
              <h3>Terms</h3>
              <p>Setup today. Hosting, care, and monthly service begin 30 days after checkout.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-v2" id="packages">
        <div className="section-v2__inner">
          <div className="section-heading">
            <h2>Pick your launch package</h2>
            <p>All packages include production launch, SSL, hosting setup, care, and a direct path to request changes.</p>
          </div>

          <div className="package-grid">
            {SERVICE_PACKAGES.map((pkg) => {
              const checkoutHref = `/api/checkout?pkg=${pkg.key}&client_slug=${encodeURIComponent(site.slug)}&site_id=${encodeURIComponent(site.id)}${site.request_id ? `&request_id=${encodeURIComponent(site.request_id)}` : ''}`;

              return (
                <article className={`package-card ${pkg.popular ? 'package-card--featured' : ''}`} key={pkg.key}>
                  {pkg.popular && <span className="package-badge">Most chosen</span>}
                  <p className="eyebrow">{pkg.name}</p>
                  <h3>{pkg.summary.en}</h3>
                  <div className="price-line">
                    <span>{dollars(pkg.monthly)}</span>
                    <small>/mo</small>
                  </div>
                  <p className="setup-line">+ {dollars(pkg.setup)} setup today</p>
                  <ul className="check-list">
                    {pkg.features.en.map((feature) => (
                      <li key={feature}>
                        <span aria-hidden="true">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link className={pkg.popular ? 'button button--primary' : 'button button--secondary'} href={checkoutHref}>
                    Claim with {pkg.name} <ArrowRight size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
