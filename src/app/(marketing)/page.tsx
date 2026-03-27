'use client';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useEffect, useRef } from 'react';

/* ─── Packages data ──────────────────────────────────────────────────────── */
const PACKAGES = [
  {
    key: 'presencia',
    price: { en: 97,  es: 97  },
    setup: { en: 597, es: 597 },
    features: {
      en: ['4–5 page professional website', 'Vercel hosting + SSL + security', 'Google Business Profile setup', 'WhatsApp chat button', 'Mobile-first responsive', '30-day support'],
      es: ['Sitio web profesional de 4–5 páginas', 'Hosting Vercel + SSL + seguridad', 'Google Business Profile', 'Botón WhatsApp en el sitio', 'Diseño mobile-first', 'Soporte 30 días'],
    },
  },
  {
    key: 'visibilidad',
    price: { en: 247, es: 247 },
    setup: { en: 897, es: 897 },
    popular: true,
    features: {
      en: ['Everything in Presencia', 'Sanity CMS — edit your menu live', '30+ local directory listings', '2× Google Business posts/mo', 'Monthly rank report', '1 content refresh/mo'],
      es: ['Todo en Presencia', 'Sanity CMS — edita tu menú en vivo', 'Más de 30 citas en directorios', '2× publicaciones Google Business/mes', 'Informe mensual de posicionamiento', '1 actualización de contenido/mes'],
    },
  },
  {
    key: 'crecimiento',
    price: { en: 597, es: 597 },
    setup: { en: 1247, es: 1247 },
    features: {
      en: ['Everything in Visibilidad', '4× Google Business posts/mo', 'Review monitoring + responses', 'Priority 24h support', 'Quarterly site audit'],
      es: ['Todo en Visibilidad', '4× publicaciones Google Business/mes', 'Monitoreo de reseñas + respuestas', 'Soporte prioritario 24h', 'Auditoría trimestral del sitio'],
    },
  },
];

const MARQUEE = [
  'Diseño a medida', 'SEO local', 'Bilingüe', 'Google Business', 'Hosting rápido',
  'Menú digital', 'Reservaciones online', 'Puerto Rico 🇵🇷',
  'Custom design', 'Local SEO', 'Bilingual', 'Fast hosting', 'Digital menu', 'Online ordering',
];

function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('revealed'); } });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);
}

export default function Home() {
  const { t, lang } = useLanguage();
  useScrollReveal();

  const PKG_NAME: Record<string, string> = {
    presencia: 'Presencia', visibilidad: 'Visibilidad', crecimiento: 'Crecimiento',
  };

  const SETUP_LABEL = lang === 'es' ? 'configuración' : 'setup';
  const MO_LABEL = lang === 'es' ? '/mes' : '/mo';
  const POPULAR_LABEL = lang === 'es' ? 'Más Popular' : 'Most Popular';

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          HERO — full viewport, centered, one statement
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px clamp(24px, 5vw, 80px) 80px',
        background: 'var(--color-sw-black)',
        position: 'relative',
      }}>
        {/* Very subtle vignette — not a blob, just edge darkening */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,105,74,0.04) 0%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', maxWidth: '900px' }}>
          <p className="label" style={{ marginBottom: '2rem' }}>
            {t.home.heroLabel}
          </p>

          <h1 style={{
            fontSize: 'clamp(2.6rem, 6vw, 5.5rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '2rem',
            color: 'var(--color-sw-cream)',
          }}>
            {lang === 'es' ? (
              <>Páginas que llenan{' '}
                <span style={{ color: 'var(--color-sw-coral)' }}>mesas.</span>
              </>
            ) : (
              <>Websites that fill{' '}
                <span style={{ color: 'var(--color-sw-coral)' }}>tables.</span>
              </>
            )}
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--color-sw-muted)',
            lineHeight: 1.6,
            marginBottom: '3rem',
            maxWidth: '560px',
            marginInline: 'auto',
          }}>
            {t.home.heroSub}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contacto" className="btn-primary">
              {t.home.heroCta} <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
            <Link href="/portafolio" className="btn-outline">
              {t.home.heroSecondary}
            </Link>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, var(--color-sw-coral))', opacity: 0.6 }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════════════════════════ */}
      <div className="marquee-wrap" style={{
        borderTop: '1px solid var(--color-sw-rule-dark)',
        borderBottom: '1px solid var(--color-sw-rule-dark)',
        background: 'var(--color-sw-surface)',
        padding: '12px 0',
      }}>
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: '1.5rem',
              paddingRight: '1.5rem',
              fontFamily: 'var(--font-label)', fontSize: '0.68rem',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--color-sw-dim)', whiteSpace: 'nowrap',
            }}>
              {item}
              <span style={{ color: 'var(--color-sw-coral)', opacity: 0.5, fontSize: '0.4rem' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS — light section
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-light on-light">
        <div className="container">
          {/* Header */}
          <div data-reveal style={{ maxWidth: '620px', marginBottom: 'clamp(60px, 8vw, 100px)' }}>
            <p className="label" style={{ marginBottom: '1rem' }}>{t.home.howLabel}</p>
            <h2 style={{ color: '#1D1D1F', marginBottom: '1.25rem' }}>{t.home.howHeading}</h2>
            <p style={{ color: '#6E6E73', fontSize: '1.1rem', lineHeight: 1.7 }}>
              {lang === 'es'
                ? 'Dimos vuelta al modelo de agencia tradicional. Tú ves el producto terminado antes de pagar.'
                : "We flipped the traditional agency model. You see the finished product before you spend a cent."}
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px', background: 'rgba(0,0,0,0.08)' }} className="steps-grid">
            {[
              { num: '01', title: t.home.step1Title, body: t.home.step1Body },
              { num: '02', title: t.home.step2Title, body: t.home.step2Body },
              { num: '03', title: t.home.step3Title, body: t.home.step3Body },
            ].map((step, i) => (
              <div data-reveal key={step.num} style={{
                padding: 'clamp(2rem, 4vw, 3rem)',
                background: '#fff',
                transition: 'box-shadow 250ms',
                cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: '4.5rem', fontWeight: 700,
                  color: 'rgba(0,0,0,0.06)', lineHeight: 1, marginBottom: '1.5rem',
                  letterSpacing: '-0.04em',
                }}>{step.num}</p>
                <h3 style={{ color: '#1D1D1F', fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.7rem' }}>{step.title}</h3>
                <p style={{ color: '#6E6E73', fontSize: '0.95rem', lineHeight: 1.7 }}>{step.body}</p>
              </div>
            ))}
          </div>

          <div data-reveal style={{ marginTop: '3rem' }}>
            <Link href="/como-funciona" className="btn-ghost">
              {lang === 'es' ? 'Ver proceso completo' : 'See the full process'}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
        <style>{`@media (max-width: 600px) { .steps-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PACKAGES — dark section
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-dark" id="packages">
        <div className="container">
          <div data-reveal style={{ marginBottom: 'clamp(56px, 7vw, 96px)' }}>
            <p className="label" style={{ marginBottom: '1rem' }}>{t.home.packagesLabel}</p>
            <h2 style={{ marginBottom: '0.75rem' }}>{t.home.packagesHeading}</h2>
            <p style={{ color: 'var(--color-sw-muted)', fontSize: '1.1rem' }}>{t.home.packagesSub}</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1px',
            background: 'var(--color-sw-rule-dark)',
            border: '1px solid var(--color-sw-rule-dark)',
          }}>
            {PACKAGES.map((pkg) => (
              <div data-reveal key={pkg.key} style={{
                padding: 'clamp(2rem, 4vw, 2.75rem)',
                background: pkg.popular ? 'var(--color-sw-card)' : 'var(--color-sw-surface)',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
              }}>
                {pkg.popular && (
                  <span style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem',
                    background: 'var(--color-sw-coral)', color: '#fff',
                    fontFamily: 'var(--font-label)', fontSize: '0.6rem', fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: '2px',
                  }}>{POPULAR_LABEL}</span>
                )}

                <p className="label" style={{ marginBottom: '1.5rem' }}>{PKG_NAME[pkg.key]}</p>

                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '3.25rem', fontWeight: 700,
                      letterSpacing: '-0.03em', lineHeight: 1,
                      color: 'var(--color-sw-cream)',
                    }}>${pkg.price[lang as 'en' | 'es']}</span>
                    <span style={{ color: 'var(--color-sw-dim)', fontSize: '0.9rem' }}>{MO_LABEL}</span>
                  </div>
                  <p style={{ marginTop: '0.35rem', color: 'var(--color-sw-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-label)', letterSpacing: '0.06em' }}>
                    + ${pkg.setup[lang as 'en' | 'es'].toLocaleString()} {SETUP_LABEL}
                  </p>
                </div>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem', flex: 1 }}>
                  {pkg.features[lang as 'en' | 'es'].map((f) => (
                    <li key={f} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', color: 'var(--color-sw-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      <Check size={13} strokeWidth={2.5} style={{ color: 'var(--color-sw-coral)', flexShrink: 0, marginTop: '4px' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={`/api/checkout?pkg=${pkg.key}`}
                  className={pkg.popular ? 'btn-primary' : 'btn-outline'}
                  style={{ justifyContent: 'center' }}
                >
                  {t.services.getStarted} <ArrowRight size={13} strokeWidth={2.5} />
                </a>
              </div>
            ))}
          </div>

          <p data-reveal style={{ marginTop: '1.5rem', color: 'var(--color-sw-dim)', fontSize: '0.85rem', textAlign: 'center' }}>
            {lang === 'es'
              ? '* Cargo de configuración es único y se cobra al inicio. La suscripción mensual se inicia automáticamente.'
              : '* Setup fee is a one-time charge at start. Monthly subscription begins automatically after setup.'}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHY US — mid dark section
      ══════════════════════════════════════════════════════════════ */}
      <section className="section-mid" style={{ borderTop: '1px solid var(--color-sw-rule-dark)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'clamp(3rem, 8vw, 8rem)', alignItems: 'start' }} className="why-grid">
            <div data-reveal>
              <p className="label" style={{ marginBottom: '1rem' }}>{t.home.whyLabel}</p>
              <h2 style={{ marginBottom: '1.5rem' }}>{t.home.whyHeading}</h2>
              <p style={{ color: 'var(--color-sw-muted)', fontSize: '1rem', lineHeight: 1.8, marginBottom: '2.5rem' }}>
                {lang === 'es'
                  ? 'No somos una agencia genérica. Hacemos una sola cosa — páginas web para restaurantes en Puerto Rico — y la hacemos excepcionalmente bien.'
                  : "We're not a generalist agency. We do one thing — restaurant websites in Puerto Rico — and we do it exceptionally well."}
              </p>
              <Link href="/about" className="btn-ghost">
                {lang === 'es' ? 'Conoce el equipo' : 'Meet the team'} <ArrowRight size={13} />
              </Link>
            </div>

            <div data-reveal>
              {[
                { title: t.home.why1Title, body: t.home.why1Body },
                { title: t.home.why2Title, body: t.home.why2Body },
                { title: t.home.why3Title, body: t.home.why3Body },
                { title: t.home.why4Title, body: t.home.why4Body },
              ].map((item, i) => (
                <div key={item.title} style={{
                  paddingBlock: '1.5rem',
                  borderBottom: i < 3 ? '1px solid var(--color-sw-rule-dark)' : 'none',
                  display: 'grid', gridTemplateColumns: '2.5rem 1fr', gap: '0.75rem', alignItems: 'start',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-label)', fontSize: '0.65rem', fontWeight: 600,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--color-sw-coral)', paddingTop: '2px',
                  }}>0{i + 1}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-sw-cream)', marginBottom: '0.3rem', fontFamily: 'var(--font-label)', letterSpacing: '0.02em' }}>{item.title}</p>
                    <p style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem', lineHeight: 1.65 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`@media (max-width: 800px) { .why-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA — minimal, powerful
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(72px, 10vw, 120px) 0',
        background: 'var(--color-sw-coral)',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 data-reveal style={{
            color: '#fff', fontWeight: 300, fontStyle: 'italic',
            marginBottom: '1rem',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
          }}>
            {t.home.ctaHeading}
          </h2>
          <p data-reveal style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.1rem', marginBottom: '2.5rem', marginInline: 'auto' }}>
            {t.home.ctaBody}
          </p>
          <Link data-reveal href="/contacto" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '16px 40px',
            background: '#fff', color: 'var(--color-sw-coral)',
            fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            borderRadius: '2px',
            transition: 'transform 200ms, box-shadow 200ms',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            {t.home.ctaButton} <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </>
  );
}
