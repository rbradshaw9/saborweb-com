'use client';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { MessageCircle } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const WHATSAPP = '+18019106171';

export default function Footer() {
  const { t, lang } = useLanguage();
  const year = new Date().getFullYear();
  const localizedHref = (href: string) => (lang === 'es' ? `/es${href}` : href);

  const services = [
    { href: '/services',     label: t.nav.services   },
    { href: '/portfolio',    label: t.nav.portfolio  },
    { href: '/how-it-works', label: t.nav.howItWorks },
    { href: '/local-seo',    label: t.nav.localSeo   },
  ];

  const company = [
    { href: '/about',    label: t.nav.about   },
    { href: '/contact',  label: t.nav.contact },
  ];

  return (
    <footer style={{ background: 'var(--color-sw-surface)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="container section" style={{ paddingTop: 'clamp(48px,6vw,80px)', paddingBottom: 'clamp(48px,6vw,80px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
          {/* Brand */}
          <div>
            <div style={{ marginBottom: '1rem' }}><BrandMark /></div>
            <p style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {t.footer.tagline}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a
                href={`https://wa.me/${WHATSAPP.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                style={{ color: 'var(--color-sw-muted)', transition: 'color 200ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#25D366')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-sw-muted)')}
              >
                <MessageCircle size={20} />
              </a>
              <a
                href="https://instagram.com/saborweb"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ color: 'var(--color-sw-muted)', transition: 'color 200ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-sw-coral)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-sw-muted)')}
              >
                <InstagramIcon size={20} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="label" style={{ marginBottom: '1.25rem' }}>
              {lang === 'es' ? 'Servicios' : 'Services'}
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {services.map(s => (
                <li key={s.href}>
                  <Link
                    href={localizedHref(s.href)}
                    style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem', transition: 'color 200ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-sw-cream)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-sw-muted)')}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="label" style={{ marginBottom: '1.25rem' }}>
              {lang === 'es' ? 'Empresa' : 'Company'}
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {company.map(s => (
                <li key={s.href}>
                  <Link
                    href={localizedHref(s.href)}
                    style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem', transition: 'color 200ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-sw-cream)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-sw-muted)')}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <p className="label" style={{ marginBottom: '1.25rem' }}>
              {lang === 'es' ? '¿Listo?' : 'Ready?'}
            </p>
            <p style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              {lang === 'es'
                ? 'Solicita tu preview gratis. Sin compromisos.'
                : 'Request your free preview. No commitment.'}
            </p>
            <Link href="/brief-builder" className="button button--primary" style={{ fontSize: '0.72rem', padding: '10px 18px' }}>
              {t.nav.cta}
            </Link>
          </div>
        </div>

        <div className="coral-divider" style={{ marginBottom: '1.5rem' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ color: 'var(--color-sw-dim)', fontSize: '0.8rem' }}>
            © {year} Sabor Web — {t.footer.rights}
          </p>
          <p style={{ color: 'var(--color-sw-dim)', fontSize: '0.8rem' }}>
            Puerto Rico
          </p>
        </div>
      </div>
    </footer>
  );
}
