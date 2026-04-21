'use client';

import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { SERVICE_PACKAGES } from '@/lib/packages';
import { ANALYTICS_EVENTS, track } from '@/lib/analytics';

export default function PackageGrid({
  homeMode = false,
  requestHref = '#request',
}: {
  homeMode?: boolean;
  requestHref?: string;
}) {
  const { lang } = useLanguage();
  const copy = {
    en: {
      popular: 'Most chosen',
      setup: 'setup',
      monthly: '/mo',
      cta: 'Start with this plan',
      homeCta: 'Request a preview',
      note: 'Stripe checkout is available for restaurants ready to claim a preview. Most owners start with a free preview request first.',
      homeNote: 'Pricing is shown for clarity, but the homepage stays focused on the free preview request.',
    },
    es: {
      popular: 'Mas elegido',
      setup: 'configuracion',
      monthly: '/mes',
      cta: 'Empezar con este plan',
      homeCta: 'Solicitar preview',
      note: 'Stripe checkout esta disponible para restaurantes listos para reclamar un preview. La mayoria empieza con el preview gratis.',
      homeNote: 'Mostramos precios para claridad, pero aqui el enfoque es pedir el preview gratis.',
    },
  }[lang];

  const handlePackageCtaClick = (pkg: (typeof SERVICE_PACKAGES)[number]) => {
    const item = {
      item_id: pkg.key,
      item_name: pkg.name,
      item_category: 'service_plan',
      price: pkg.setup,
      quantity: 1,
    };

    if (homeMode) {
      track(ANALYTICS_EVENTS.PREVIEW_CTA_CLICKED, {
        location: 'package_grid',
        package_key: pkg.key,
        package_name: pkg.name,
      });
      return;
    }

    track(ANALYTICS_EVENTS.PACKAGE_SELECTED, {
      item_list_name: 'service_packages',
      package_key: pkg.key,
      package_name: pkg.name,
      currency: 'USD',
      value: pkg.setup,
      monthly_value: pkg.monthly,
      items: [item],
    });
    track(ANALYTICS_EVENTS.CHECKOUT_STARTED, {
      package_key: pkg.key,
      package_name: pkg.name,
      currency: 'USD',
      value: pkg.setup,
      monthly_value: pkg.monthly,
      items: [item],
    });
  };

  return (
    <div>
      <div className="package-grid">
        {SERVICE_PACKAGES.map((pkg) => (
          <article className={`package-card ${pkg.popular ? 'package-card--featured' : ''}`} key={pkg.key}>
            {pkg.popular && <span className="package-badge">{copy.popular}</span>}
            <p className="eyebrow">{pkg.name}</p>
            <h3>{pkg.summary[lang]}</h3>
            <div className="price-line">
              <span>${pkg.monthly}</span>
              <small>{copy.monthly}</small>
            </div>
            <p className="setup-line">+ ${pkg.setup.toLocaleString()} {copy.setup}</p>
            <ul className="check-list">
              {pkg.features[lang].map((feature) => (
                <li key={feature}>
                  <Check size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a
              className={pkg.popular ? 'button button--primary' : 'button button--secondary'}
              href={homeMode ? requestHref : `/api/checkout?pkg=${pkg.key}`}
              onClick={() => handlePackageCtaClick(pkg)}
            >
              {homeMode ? copy.homeCta : copy.cta} <ArrowRight size={16} />
            </a>
          </article>
        ))}
      </div>
      <p className="fine-print">{homeMode ? copy.homeNote : copy.note}</p>
    </div>
  );
}
