'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './Nav.module.css';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, toggle, setLang } = useLanguage();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const navLinks = [
    { href: '/menu',    label: lang === 'es' ? 'Menú'     : 'Menu' },
    { href: '/events',  label: lang === 'es' ? 'Eventos'  : 'Events' },
    { href: '/gallery', label: lang === 'es' ? 'Galería'  : 'Gallery' },
    { href: '/about',   label: lang === 'es' ? 'Nosotros' : 'About' },
    { href: '/contact', label: lang === 'es' ? 'Contacto' : 'Contact' },
  ];

  const reserveLabel = lang === 'es' ? 'Reservar' : 'Reserve';
  const tagline      = lang === 'es' ? 'Cocina de autor' : 'Signature cuisine';

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`} role="navigation" aria-label="Main navigation">
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="Rebar - Home">
          <span className={styles.logoMark}>×</span>
          <span className={styles.logoText}>REBAR</span>
          <span className={styles.logoSub}>{tagline}</span>
        </Link>

        {/* Desktop Links */}
        <ul className={styles.links}>
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.link} ${pathname === href ? styles.active : ''}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: Language + Reserve */}
        <div className={styles.right}>
          <button
            className={styles.langToggle}
            onClick={toggle}
            aria-label="Toggle language"
          >
            <span className={lang === 'en' ? styles.langActive : ''}>EN</span>
            <span className={styles.langDivider}>|</span>
            <span className={lang === 'es' ? styles.langActive : ''}>ES</span>
          </button>
          <Link href="/reservations" className={styles.reserveBtn}>
            {reserveLabel}
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle mobile menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="dialog" aria-label="Mobile navigation">
          <ul>
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={styles.mobileLink}>{label}</Link>
              </li>
            ))}
            <li>
              <Link href="/reservations" className={styles.mobileReserveBtn}>
                {lang === 'en' ? 'Reserve a Table' : 'Reservar Mesa'}
              </Link>
            </li>
          </ul>
          <div className={styles.mobileLang}>
            <button onClick={() => setLang('en')} className={lang === 'en' ? styles.langActive : ''}>EN</button>
            <span>|</span>
            <button onClick={() => setLang('es')} className={lang === 'es' ? styles.langActive : ''}>ES</button>
          </div>
          <div className={styles.mobileContact}>
            <a href="tel:+17876581669">787-658-1669</a>
          </div>
        </div>
      )}
    </nav>
  );
}
