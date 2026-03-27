'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Menu, X } from 'lucide-react';

export default function Nav() {
  const { t, lang, toggle } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { href: '/services',    label: t.nav.services   },
    { href: '/portfolio',   label: t.nav.portfolio  },
    { href: '/how-it-works',label: t.nav.howItWorks },
    { href: '/local-seo',   label: t.nav.localSeo   },
    { href: '/about',       label: t.nav.about      },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: 'background 300ms ease, border-color 300ms ease',
        background: scrolled ? 'rgba(12,12,12,0.95)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: '72px', gap: '2rem' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            fontWeight: 600,
            color: 'var(--color-sw-cream)',
            letterSpacing: '-0.01em',
          }}>
            Sabor<span style={{ color: 'var(--color-sw-coral)' }}>Web</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav
          aria-label="Main navigation"
          style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginLeft: 'auto' }}
          className="hidden-mobile"
        >
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.72rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-sw-muted)',
                transition: 'color 200ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-sw-cream)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-sw-muted)')}
            >
              {link.label}
            </Link>
          ))}

          {/* Language Toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle language"
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--color-sw-coral)',
              border: '1px solid var(--color-sw-coral)',
              padding: '4px 10px',
              borderRadius: '2px',
              transition: 'all 200ms ease',
            }}
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </button>

          <Link href="/contact" className="btn-primary" style={{ padding: '10px 24px' }}>
            {t.nav.cta}
          </Link>
        </nav>

        {/* Mobile right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }} className="show-mobile">
          <button onClick={toggle} style={{ fontFamily: 'var(--font-label)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-sw-coral)', border: '1px solid var(--color-sw-coral)', padding: '4px 10px', borderRadius: '2px' }}>
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
            style={{ color: 'var(--color-sw-cream)', padding: '4px' }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div style={{
          background: 'rgba(14,14,14,0.98)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '1.5rem var(--spacing-container)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{ fontFamily: 'var(--font-label)', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-sw-cream)' }}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="btn-primary" onClick={() => setOpen(false)} style={{ textAlign: 'center', justifyContent: 'center' }}>
            {t.nav.cta}
          </Link>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .hidden-mobile { display: flex !important; } .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hidden-mobile { display: none !important; } .show-mobile { display: flex !important; } }
      `}</style>
    </header>
  );
}
