'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Menu, X } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

export default function Nav() {
  const { t, lang, setLang } = useLanguage();
  const pathname = usePathname() || '/';
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const normalizedMarketingPath = pathname === '/es' ? '/' : pathname.startsWith('/es/') ? pathname.slice(3) || '/' : pathname;

  const localizedHref = (href: string) => {
    if (lang === 'es') return href === '/' ? '/es' : `/es${href}`;
    return href;
  };

  const switchLanguage = (nextLang: 'en' | 'es') => {
    setLang(nextLang);
    const query = searchParams.toString();
    const nextPath = nextLang === 'es'
      ? normalizedMarketingPath === '/'
        ? '/es'
        : `/es${normalizedMarketingPath}`
      : normalizedMarketingPath;
    router.push(query ? `${nextPath}?${query}` : nextPath);
  };

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
        <BrandMark />

        {/* Desktop Nav */}
        <nav
          aria-label="Main navigation"
          style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginLeft: 'auto' }}
          className="hidden-mobile"
        >
          {links.map(link => (
            <Link
              key={link.href}
              href={localizedHref(link.href)}
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

          <div className="language-switcher" aria-label="Site language">
            <button type="button" onClick={() => switchLanguage('es')} aria-pressed={lang === 'es'} className={lang === 'es' ? 'active' : ''}>
              Español
            </button>
            <span aria-hidden="true">/</span>
            <button type="button" onClick={() => switchLanguage('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? 'active' : ''}>
              English
            </button>
          </div>

          <Link href="/brief-builder" className="button button--primary" style={{ minHeight: '38px', padding: '8px 18px' }}>
            {t.nav.cta}
          </Link>
        </nav>

        {/* Mobile right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }} className="show-mobile">
          <div className="language-switcher language-switcher--compact" aria-label="Site language">
            <button type="button" onClick={() => switchLanguage('es')} aria-pressed={lang === 'es'} className={lang === 'es' ? 'active' : ''}>
              ES
            </button>
            <span aria-hidden="true">/</span>
            <button type="button" onClick={() => switchLanguage('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? 'active' : ''}>
              EN
            </button>
          </div>
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
              href={localizedHref(link.href)}
              onClick={() => setOpen(false)}
              style={{ fontFamily: 'var(--font-label)', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-sw-cream)' }}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/brief-builder" className="button button--primary" onClick={() => setOpen(false)} style={{ textAlign: 'center', justifyContent: 'center' }}>
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
