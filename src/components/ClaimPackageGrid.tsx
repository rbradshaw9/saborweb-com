'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ANALYTICS_EVENTS, track } from '@/lib/analytics';
import { SERVICE_PACKAGES } from '@/lib/packages';

type ClaimSite = {
  id: string;
  slug: string;
  request_id: string | null;
  preview_type: 'native' | 'external';
};

function dollars(value: number) {
  return `$${value.toLocaleString()}`;
}

function checkoutHref(site: ClaimSite, packageKey: string, includeDomainAddon: boolean) {
  const params = new URLSearchParams({
    pkg: packageKey,
    client_slug: site.slug,
    site_id: site.id,
  });

  if (site.request_id) params.set('request_id', site.request_id);
  if (includeDomainAddon) params.set('domain_addon', '1');

  return `/api/checkout?${params.toString()}`;
}

export default function ClaimPackageGrid({ site }: { site: ClaimSite }) {
  const [includeDomainAddon, setIncludeDomainAddon] = useState(false);

  useEffect(() => {
    track(ANALYTICS_EVENTS.CLAIM_PAGE_VIEWED, {
      restaurant_slug: site.slug,
      preview_type: site.preview_type,
      language: 'en',
    });
  }, [site.preview_type, site.slug]);

  return (
    <div className="package-grid">
      {SERVICE_PACKAGES.map((pkg) => {
        const canAddDomain = pkg.key === 'presencia';
        const href = checkoutHref(site, pkg.key, canAddDomain && includeDomainAddon);

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
              {canAddDomain ? (
                <li>
                  <input
                    aria-label="Add custom domain setup"
                    checked={includeDomainAddon}
                    onChange={(event) => {
                      setIncludeDomainAddon(event.target.checked);
                      if (event.target.checked) {
                        track(ANALYTICS_EVENTS.DOMAIN_ADDON_SELECTED, {
                          restaurant_slug: site.slug,
                          preview_type: site.preview_type,
                          package_key: pkg.key,
                          language: 'en',
                        });
                      }
                    }}
                    type="checkbox"
                  />
                  <span>Add custom domain setup for $197</span>
                </li>
              ) : (
                <li>
                  <span aria-hidden="true">✓</span>
                  <span>Custom domain support included</span>
                </li>
              )}
            </ul>
            <Link
              className={pkg.popular ? 'button button--primary' : 'button button--secondary'}
              href={href}
              onClick={() => {
                const payload = {
                  restaurant_slug: site.slug,
                  preview_type: site.preview_type,
                  package_key: pkg.key,
                  language: 'en',
                };
                track(ANALYTICS_EVENTS.FUNNEL_PACKAGE_SELECTED, payload);
                track(ANALYTICS_EVENTS.CHECKOUT_STARTED, payload);
              }}
            >
              Claim with {pkg.name} <ArrowRight size={16} />
            </Link>
          </article>
        );
      })}
    </div>
  );
}
