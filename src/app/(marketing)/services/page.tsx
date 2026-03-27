'use client';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const PACKAGES = [
  {
    key: 'presencia',
    price: 97,
    setup: 597,
    checkout: '/api/checkout?pkg=presencia',
    features: {
      en: ['4–5 page Next.js website', 'Vercel hosting + SSL + security', 'Google Business Profile setup', 'WhatsApp chat button on site', 'Mobile-first responsive design', 'Basic on-page SEO (meta, schema)', '30 days post-launch support'],
      es: ['Sitio Next.js de 4–5 páginas', 'Hosting Vercel + SSL + seguridad', 'Configuración de Google Business Profile', 'Botón de WhatsApp en el sitio', 'Diseño responsive, mobile-first', 'SEO básico en página (meta, schema)', 'Soporte 30 días post-lanzamiento'],
    },
  },
  {
    key: 'visibilidad',
    price: 247,
    setup: 897,
    checkout: '/api/checkout?pkg=visibilidad',
    popular: true,
    features: {
      en: ['Everything in Presencia', 'Sanity CMS — edit menu, hours, photos yourself', '30+ local directory citations', '2x Google Business posts/month', 'Monthly keyword rank report', '1 content update/month'],
      es: ['Todo lo de Presencia', 'Sanity CMS — edita menú, horarios y fotos tú mismo', 'Más de 30 citas en directorios locales', '2 publicaciones en Google Business/mes', 'Reporte mensual de posicionamiento', '1 actualización de contenido/mes'],
    },
  },
  {
    key: 'crecimiento',
    price: 597,
    setup: 1247,
    checkout: '/api/checkout?pkg=crecimiento',
    features: {
      en: ['Everything in Visibilidad', '4x Google Business posts/month', 'Review monitoring + responses (Google & Yelp)', 'Priority 24hr support', 'Quarterly site audit'],
      es: ['Todo lo de Visibilidad', '4 publicaciones en Google Business/mes', 'Monitoreo + respuestas de reseñas (Google y Yelp)', 'Soporte prioritario 24hs', 'Auditoría trimestral del sitio'],
    },
  },
];

const MODULES = [
  { icon: '🛒', en: 'Online Ordering integration', es: 'Integración de pedidos en línea', setup: 297, monthly: 27 },
  { icon: '📅', en: 'Reservations integration', es: 'Integración de reservaciones', setup: 197, monthly: 17 },
  { icon: '📢', en: 'Review Collector (QR + WhatsApp)', es: 'Recolector de reseñas (QR + WhatsApp)', setup: 97, monthly: null },
  { icon: '📸', en: 'Gallery / photo refresh', es: 'Galería / actualización de fotos', setup: 97, monthly: null },
  { icon: '📝', en: 'Blog / CMS setup (Sanity)', es: 'Blog / CMS (Sanity)', setup: 297, monthly: 47 },
  { icon: '📣', en: 'Google Ads management', es: 'Manejo de Google Ads', setup: null, monthly: 197 },
];

export default function ServiciosPage() {
  const { t, lang } = useLanguage();

  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: '140px', paddingBottom: '40px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, oklch(0.58 0.16 28 / 0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p className="label" style={{ marginBottom: '1rem' }}>{t.services.heroLabel}</p>
          <h1 style={{ marginBottom: '1rem' }}>{t.services.heroHeading}</h1>
          <p style={{ color: 'var(--color-sw-muted)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>{t.services.heroSub}</p>
        </div>
      </section>

      {/* Packages */}
      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '5rem' }}>
            {PACKAGES.map(pkg => (
              <div key={pkg.key} className="card" style={{ padding: '2rem', position: 'relative', border: pkg.popular ? '1px solid var(--color-sw-coral)' : undefined }}>
                {pkg.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-sw-coral)', color: '#fff', fontFamily: 'var(--font-label)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 16px', borderRadius: '2px', whiteSpace: 'nowrap' }}>
                    {lang === 'es' ? 'Más Popular' : 'Most Popular'}
                  </div>
                )}

                <p className="label" style={{ marginBottom: '0.5rem' }}>
                  {t.services[pkg.key as keyof typeof t.services] as string}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '3.2rem', fontWeight: 700, color: 'var(--color-sw-cream)' }}>${pkg.price}</span>
                  <span style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem' }}>{t.services.perMonth}</span>
                </div>
                <p style={{ color: 'var(--color-sw-dim)', fontSize: '0.82rem', marginBottom: '2rem' }}>
                  {t.services.setupFee}: ${pkg.setup.toLocaleString()}
                </p>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                  {pkg.features[lang as 'en' | 'es'].map(f => (
                    <li key={f} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', color: 'var(--color-sw-muted)', fontSize: '0.9rem' }}>
                      <CheckCircle size={15} style={{ color: 'var(--color-sw-coral)', flexShrink: 0, marginTop: '3px' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a href={pkg.checkout} className={pkg.popular ? 'btn-primary' : 'btn-outline'} style={{ width: '100%', justifyContent: 'center' }}>
                  {t.services.getStarted} <ArrowRight size={15} />
                </a>
              </div>
            ))}
          </div>

          {/* Modules */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p className="label" style={{ marginBottom: '0.75rem' }}>{t.services.modulesLabel}</p>
            <h2>{t.services.modulesHeading}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {MODULES.map(mod => (
              <div key={mod.en} style={{ padding: '1.5rem', background: 'var(--color-sw-card)', border: '1px solid var(--color-sw-border-subtle)', borderRadius: '4px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{mod.icon}</span>
                <div>
                  <p style={{ fontFamily: 'var(--font-label)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-sw-cream)', marginBottom: '0.35rem' }}>
                    {lang === 'es' ? mod.es : mod.en}
                  </p>
                  <p style={{ color: 'var(--color-sw-dim)', fontSize: '0.78rem' }}>
                    {mod.setup != null && `$${mod.setup} setup`}
                    {mod.setup != null && mod.monthly != null && ' + '}
                    {mod.monthly != null && `$${mod.monthly}/mo`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <p style={{ color: 'var(--color-sw-muted)', marginBottom: '1.5rem' }}>
              {lang === 'es' ? '¿No estás seguro qué paquete es para ti? Escríbenos.' : "Not sure which package is right? Let's talk."}
            </p>
            <Link href="/contact" className="btn-outline">
              {lang === 'es' ? 'Contáctanos' : 'Contact Us'} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
