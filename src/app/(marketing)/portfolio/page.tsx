'use client';
import Link from 'next/link';
import Image from 'next/image';
import { X, Expand } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useState, useEffect } from 'react';

interface Site {
  name: string;
  location: string;
  url?: string;         // optional — omit to hide external link
  image: string;
  description: { en: string; es: string };
  tags: { en: string[]; es: string[] };
  preview?: boolean;
}

const SITES: Site[] = [
  {
    name: 'Rebar Gastronomía & Cocteles',
    location: 'Aguadilla, PR',
    url: 'https://rebarpr.com',
    image: '/images/portfolio-rebar.png',
    description: {
      en: 'Upscale cocktail bar and gastronomy restaurant in northwest Puerto Rico.',
      es: 'Bar de cocteles y restaurante gastronómico en el noroeste de Puerto Rico.',
    },
    tags: {
      en: ['Fine Dining', 'Cocktail Bar', 'Reservations'],
      es: ['Alta Cocina', 'Bar de Cocteles', 'Reservaciones'],
    },
  },
];

function Lightbox({ site, onClose }: { site: Site; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        cursor: 'zoom-out',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '50%', width: '40px', height: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        aria-label="Close preview"
      >
        <X size={18} strokeWidth={2} />
      </button>

      {/* Image container */}
      <div
        onClick={e => e.stopPropagation()} // don't close when clicking image
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '80vh',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'default',
        }}
      >
        <Image
          src={site.image}
          alt={`${site.name} full preview`}
          width={1280}
          height={800}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          priority
        />

        {/* Bottom label bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          padding: '1.5rem 1.75rem 1.25rem',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: 'var(--color-sw-cream)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.15rem' }}>
              {site.name}
            </p>
            <p style={{ color: 'var(--color-sw-coral)', fontFamily: 'var(--font-grotesk)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {site.location}
            </p>
          </div>
          {site.url && (
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem',
                fontFamily: 'var(--font-grotesk)', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                textDecoration: 'underline', textUnderlineOffset: '3px',
              }}
            >
              Visit Site ↗
            </a>
          )}
        </div>
      </div>

      {/* ESC hint */}
      <p style={{
        position: 'absolute', bottom: '1.5rem',
        color: 'rgba(255,255,255,0.25)',
        fontFamily: 'var(--font-grotesk)', fontSize: '0.65rem',
        fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        Press ESC or click outside to close
      </p>
    </div>
  );
}

export default function PortfolioPage() {
  const { t, lang } = useLanguage();
  const [lightboxSite, setLightboxSite] = useState<Site | null>(null);

  return (
    <>
      {/* Lightbox */}
      {lightboxSite && <Lightbox site={lightboxSite} onClose={() => setLightboxSite(null)} />}

      {/* Hero */}
      <section style={{ paddingTop: '140px', paddingBottom: '40px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, oklch(0.58 0.16 28 / 0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p className="label" style={{ marginBottom: '1rem' }}>{t.portfolio.heroLabel}</p>
          <h1 style={{ marginBottom: '1rem' }}>{t.portfolio.heroHeading}</h1>
          <p style={{ color: 'var(--color-sw-muted)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            {t.portfolio.heroSub}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>

            {SITES.map(site => (
              <div
                key={site.name}
                style={{
                  position: 'relative',
                  minHeight: '460px',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'transform 250ms ease, box-shadow 250ms ease',
                }}
                onClick={() => setLightboxSite(site)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.015)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 24px 48px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
                role="button"
                aria-label={`View preview of ${site.name}`}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setLightboxSite(site)}
              >
                {/* Screenshot background */}
                <Image
                  src={site.image}
                  alt={`${site.name} website preview`}
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'top center' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* Dark gradient scrim */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.7) 45%, rgba(8,8,8,0.1) 100%)',
                }} />

                {/* Expand icon top-right */}
                <div style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '6px',
                  color: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(4px)',
                }}>
                  <Expand size={14} strokeWidth={2} />
                </div>

                {/* Preview badge top-left */}
                {site.preview && (
                  <div style={{
                    position: 'absolute', top: '1.25rem', left: '1.25rem',
                    background: 'var(--color-sw-coral-dim)', color: 'var(--color-sw-coral)',
                    fontFamily: 'var(--font-grotesk)', fontSize: '0.62rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: '2px',
                  }}>
                    Preview
                  </div>
                )}

                {/* Card content */}
                <div style={{ position: 'relative', padding: '1.75rem' }}>
                  <div style={{ width: '28px', height: '2px', background: 'var(--color-sw-coral)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem', color: 'var(--color-sw-cream)' }}>{site.name}</h3>
                  <p style={{ color: 'var(--color-sw-coral)', fontFamily: 'var(--font-grotesk)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    {site.location}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                    {site.description[lang as 'en' | 'es']}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {site.tags[lang as 'en' | 'es'].map(tag => (
                      <span key={tag} style={{
                        background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)',
                        fontFamily: 'var(--font-grotesk)', fontSize: '0.62rem', fontWeight: 600,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '4px 10px', borderRadius: '2px',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>{tag}</span>
                    ))}
                  </div>
                  <p style={{
                    color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-grotesk)',
                    fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    <Expand size={11} strokeWidth={2.5} />
                    {lang === 'es' ? 'Click para ampliar' : 'Click to expand'}
                  </p>
                </div>
              </div>
            ))}

            {/* Coming Soon card */}
            <div style={{
              minHeight: '460px',
              border: '1px dashed rgba(255,255,255,0.12)',
              borderRadius: '2px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              padding: '2rem',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🍽️</div>
              <p style={{ color: 'var(--color-sw-dim)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: '240px' }}>
                {lang === 'es' ? 'Tu restaurante podría estar aquí.' : 'Your restaurant could be here.'}
              </p>
              <Link href="/contact" className="btn-primary" style={{ fontSize: '0.72rem', padding: '10px 22px' }}>
                {lang === 'es' ? 'Ver mi preview gratis' : 'Get my free preview'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
