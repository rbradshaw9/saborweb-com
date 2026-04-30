'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ANALYTICS_EVENTS, track } from '@/lib/analytics';
import { PreviewGate } from '@/components/PreviewGate';

// ─── RESTAURANT DATA ─────────────────────────────────────────────────────────

const RESTAURANT = {
  name: 'Cinco de Maya',
  tagline: '¡LET\'S EAT MÁS TACOS!',
  subTagline: 'Tacos · Birria · Burritos · Margaritas',
  location: 'Aguadilla, Puerto Rico',
  address: 'PR-110, Aguadilla, PR 00603',
  phone: '787-658-0033',
  instagram: '@cincodemayapuertorico',
  instagramUrl: 'https://www.instagram.com/cincodemayapuertorico/',
  facebookUrl: 'https://www.facebook.com/cincodemayapuertorico',
  hours: [
    { day: 'Monday',    closed: true  },
    { day: 'Tuesday',  closed: true  },
    { day: 'Wednesday',open: '11:30 AM', close: '9:30 PM', closed: false },
    { day: 'Thursday', open: '11:30 AM', close: '9:30 PM', closed: false },
    { day: 'Friday',   open: '11:30 AM', close: '9:30 PM', closed: false },
    { day: 'Saturday', open: '11:30 AM', close: '9:30 PM', closed: false },
    { day: 'Sunday',   open: '11:30 AM', close: '9:30 PM', closed: false },
  ],
};

// ─── MENU DATA (EDITABLE) ────────────────────────────────────────────────────

const MENU_CATEGORIES = [
  { key: 'aperitivos',  label: 'Aperitivos' },
  { key: 'tacos',      label: 'Tacos' },
  { key: 'quesadillas', label: 'Quesadillas' },
  { key: 'burritos',   label: 'Burritos' },
  { key: 'fajitas',    label: 'Fajitas' },
  { key: 'especiales', label: 'Especiales' },
  { key: 'bebidas',    label: 'Bebidas' },
  { key: 'postres',    label: 'Postres' },
];

type MenuItem = {
  name: string;
  description: string;
  price: string;
  badge?: string;
  veggie?: boolean;
};

const MENU_ITEMS: Record<string, MenuItem[]> = {
  aperitivos: [
    { name: 'Sopa de Tortilla',      description: 'Smoky tomato-chipotle broth, crispy tortilla strips, avocado, crema, cotija cheese', price: '$7.99' },
    { name: 'Queso Fundido',         description: 'Melted Mexican cheese blend, roasted poblano peppers, served with fresh tortillas',   price: '$10.99', badge: '🔥 Favorito' },
    { name: 'Nachos de la Casa',     description: 'Crispy chips, nacho cheese, pico de gallo, jalapeños, guacamole & sour cream',        price: '$12.99' },
    { name: 'Trio de Guacamole',     description: 'Classic guacamole, smoky chipotle guac, and pico de gallo with house tortilla chips', price: '$13.99', veggie: true },
    { name: 'Papas Cinco de Maya',   description: 'Crispy fries loaded with queso, pico de gallo & jalapeños. The house classic.',       price: '$11.99' },
  ],
  tacos: [
    { name: 'Birria Tacos',          description: 'Slow-braised beef birria in corn tortillas, cilantro, onion, with consomé for dipping', price: '$14.99', badge: '⭐ Best Seller' },
    { name: 'Al Pastor',             description: 'Achiote-marinated pork, fresh pineapple, cilantro, onion & salsa verde',              price: '$12.99' },
    { name: 'Carne Asada',           description: 'Grilled skirt steak, guacamole, pico de gallo, on two corn tortillas',               price: '$12.99' },
    { name: 'Carnitas',              description: 'Slow-braised pulled pork, lime, cilantro, onion, on corn tortillas',                  price: '$11.99' },
    { name: 'Pollo',                 description: 'Grilled seasoned chicken, lettuce, pico de gallo, avocado crema, corn tortillas',    price: '$11.99' },
    { name: 'Camarón',               description: 'Seasoned shrimp, cabbage slaw, chipotle aioli on corn tortillas',                    price: '$14.99' },
    { name: 'Pescado',               description: 'Beer-battered white fish, cabbage slaw, chipotle crema, pico de gallo',              price: '$13.99' },
    { name: 'Veggie',                description: 'Roasted seasonal vegetables, black beans, pico de gallo, avocado crema',             price: '$10.99', veggie: true },
  ],
  quesadillas: [
    { name: 'Quesadilla de Queso',   description: 'Three-cheese blend melted in a griddled flour tortilla, served with salsa & crema',  price: '$9.99', veggie: true },
    { name: 'Quesadilla de Pollo',   description: 'Grilled chicken, peppers, caramelized onion, Oaxacan cheese',                       price: '$11.99' },
    { name: 'Quesadilla Carne Asada',description: 'Grilled skirt steak, Oaxacan cheese, guacamole & pico de gallo',                    price: '$13.99', badge: '🔥 Favorito' },
    { name: 'Quesadilla de Carnitas',description: 'Slow-braised pulled pork, peppers, cheese blend, crema & salsa verde',              price: '$11.99' },
    { name: 'Quesadilla Veggie',     description: 'Roasted peppers, mushrooms, black beans, Oaxacan cheese',                           price: '$10.99', veggie: true },
  ],
  burritos: [
    { name: 'Burrito de Pollo',      description: 'Grilled chicken, rice, beans, cheese, pico de gallo, sour cream in a flour tortilla', price: '$11.99' },
    { name: 'Burrito de Carnitas',   description: 'Slow-braised pulled pork, rice, beans, guacamole, pico de gallo',                    price: '$11.99' },
    { name: 'Burrito Carne Asada',   description: 'Grilled skirt steak, rice, beans, cheese blend, pico de gallo, jalapeños',          price: '$13.99' },
    { name: 'Birria Chimichanga',    description: 'Crispy deep-fried birria burrito, cheese, chipotle salsa, served with consomé',      price: '$14.99', badge: '⭐ Best Seller' },
    { name: 'Burrito Veggie',        description: 'Roasted veggies, rice, black beans, cheese, guacamole, pico de gallo',              price: '$10.99', veggie: true },
  ],
  fajitas: [
    { name: 'Fajitas de Pollo',      description: 'Sizzling grilled chicken, bell peppers, onion, served with tortillas, rice & beans', price: '$15.99' },
    { name: 'Fajitas de Carne Asada',description: 'Sizzling grilled skirt steak, peppers, onion, guacamole, pico de gallo',            price: '$17.99' },
    { name: 'Fajitas de Camarón',    description: 'Sizzling shrimp, peppers, onion, chipotle butter, with tortillas, rice & beans',   price: '$18.99' },
    { name: 'Fajitas Mixtas',        description: 'Chicken, carne asada & shrimp sizzling with peppers, onion & all the fixings',      price: '$18.99', badge: '🔥 Favorito' },
  ],
  especiales: [
    { name: 'Nacho Libre',           description: 'Nacho chips smothered in pulled chicken, queso, jalapeños, pico & guacamole. Wed–Fri 11:30AM–2PM', price: '$10.99', badge: '☀️ Almuerzo' },
    { name: 'Pechuga a la Mexicana', description: 'Grilled chicken breast, sautéed tomato, jalapeño & onion sauce. Almuerzo special.',                price: '$10.99', badge: '☀️ Almuerzo' },
    { name: 'Carnita Bowl',          description: 'Carnitas over cilantro rice, black beans, pico de gallo, guacamole & crema.',                      price: '$11.99', badge: '☀️ Almuerzo' },
    { name: 'Aguacate Relleno',      description: 'Stuffed avocado with spiced chicken, queso fresco & chipotle drizzle.',                            price: '$12.99' },
    { name: 'Licuado de Pollo',      description: 'Pollo asado over rice, with grilled corn, jalapeño & fresh lime — a house specialty.',             price: '$11.99' },
    { name: 'Coronas y Nachos 2×25', description: 'Two Corona beers and a plate of loaded nachos. Because why not.',                                   price: '$25.00', badge: '🍺 Oferta' },
    { name: 'Margarita Original',    description: 'The classic Cinco de Maya margarita deal. Ask your server.',                                        price: '$5.00', badge: '🍺 Oferta' },
  ],
  bebidas: [
    { name: 'Margarita Clásica',     description: 'House tequila, fresh lime juice, triple sec, salted rim — the gold standard',       price: '$9.00', badge: '⭐ Best Seller' },
    { name: 'Margarita de Parcha',   description: 'Passion fruit margarita — tequila, passionfruit, lime, agave. Tropical and addictive', price: '$10.00' },
    { name: 'Coronarita',            description: 'A tall margarita with an upside-down Corona. The ultimate yard drink.',             price: '$14.00', badge: '🔥 Favorito' },
    { name: 'Michelada',             description: 'Beer, fresh lime, chamoy, hot sauce, tajín rim. Wake up your taste buds.',         price: '$10.00' },
    { name: 'Agua Fresca',           description: 'Rotating seasonal fresh fruit water — ask your server for today\'s flavor',        price: '$4.00', veggie: true },
    { name: 'Refresco / Soda',       description: 'Coke, Diet Coke, Sprite, or Jamaica',                                             price: '$3.00', veggie: true },
  ],
  postres: [
    { name: 'Churros & Cajetas',     description: 'Golden cinnamon-sugar churros with cajeta caramel and chocolate dipping sauce',    price: '$8.99', badge: '⭐ Best Seller' },
    { name: 'Flan de Cajeta',        description: 'House goat milk caramel flan — silky, creamy and impossibly smooth',              price: '$7.99' },
    { name: 'Helado de Vainilla',    description: 'Creamy vanilla ice cream with cajeta drizzle and cinnamon sugar',                 price: '$5.99', veggie: true },
  ],
};

// ─── SIGNATURES ──────────────────────────────────────────────────────────────

const SIGNATURES = [
  {
    name: 'Birria Chimichanga',
    category: 'Fan Favorite',
    description: 'Crispy deep-fried birria burrito with melted cheese, chipotle salsa — served with consomé for dipping.',
    price: '$14.99',
    image: '/sites/cinco-de-maya/chimichanga.png',
  },
  {
    name: 'Birria Tacos',
    category: 'Best Seller',
    description: 'Slow-braised beef in corn tortillas, topped with cilantro & onion. The consomé hits different.',
    price: '$14.99',
    image: '/sites/cinco-de-maya/tacos.png',
  },
  {
    name: 'Churros & Cajetas',
    category: 'Postres',
    description: 'Golden cinnamon-sugar churros with cajeta, chocolate sauce. The perfect ending.',
    price: '$8.99',
    image: '/sites/cinco-de-maya/churros.png',
  },
];

// ─── SPECIALS ───────────────────────────────────────────────────────────────

const SPECIALS = [
  { icon: '☀️', day: 'Wed–Fri', title: 'Almuerzo Especial', description: 'Lunch specials 11:30AM–2PM. Nacho Libre, Pechuga a la Mexicana or Carnita Bowl — all under $12.' },
  { icon: '🍹', day: 'Everyday', title: 'Coronarita for Two', description: 'Two coronaritas + loaded nachos for $25. Best deal in Aguadilla. Just add friends.' },
  { icon: '🎭', day: 'Weekends', title: 'Vibes on Full Blast', description: 'Weekend energy at Cinco de Maya is unmatched. Music, color, great food. No reservation needed.' },
];

// ─── GALLERY ────────────────────────────────────────────────────────────────

const GALLERY = [
  { src: '/sites/cinco-de-maya/bar.png',        alt: 'The Cinco de Maya bar — teal tiles, neon Tequila sign, packed with good energy', wide: true  },
  { src: '/sites/cinco-de-maya/margaritas.png', alt: 'Classic lime and passion fruit margaritas at the bar',                           wide: false },
  { src: '/sites/cinco-de-maya/nachos.png',     alt: 'Loaded nachos de la casa with guacamole and pico',                              wide: false },
  { src: '/sites/cinco-de-maya/hero.png',       alt: 'Vibrant Cinco de Maya dining room — full of colors and life',                   wide: true  },
];


// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function CincoDeMayaPage() {
  const [activeCategory, setActiveCategory] = useState('tacos');
  const [navScrolled, setNavScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]             = useState(false);

  const TODAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  useEffect(() => {
    track(ANALYTICS_EVENTS.PREVIEW_VIEWED, {
      restaurant_slug: 'cinco-de-maya',
      preview_type: 'native',
      language: 'en',
    });

    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const currentYear = new Date().getFullYear();

  return (
    <PreviewGate claimHref="/claim/cinco-de-maya" lang="es" mode="preview">
      <style>{`
        /* ══ CINCO DE MAYA ══════════════════════════════════════════ */
        .cdm {
          --teal:       #00B4B4;
          --teal-dark:  #0090A0;
          --teal-glow:  rgba(0,180,180,0.15);
          --pink:       #E83E8C;
          --orange:     #F7941D;
          --lime:       #7DC52F;
          --bg:         #0F0C0A;
          --surface:    #1A1410;
          --surface2:   #241C16;
          --cream:      #FFF8EE;
          --muted:      rgba(255,248,238,0.55);
          --border:     rgba(255,255,255,0.07);
          --bebas:      'Bebas Neue', 'Impact', sans-serif;
          --nunito:     'Nunito', 'DM Sans', system-ui, sans-serif;
          background: var(--bg);
          color: var(--cream);
          font-family: var(--nunito);
          line-height: 1.6;
          overflow-x: hidden;
        }
        .cdm *, .cdm *::before, .cdm *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .cdm a { color: inherit; text-decoration: none; }
        .cdm img { display: block; max-width: 100%; }
        .cdm button { cursor: pointer; border: none; background: none; font-family: var(--nunito); }

        /* ── NAV ────────────────────────────────────── */
        .cdm-nav {
          position: fixed; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          transition: background 0.4s, padding 0.3s, backdrop-filter 0.4s;
        }
        .cdm-nav.scrolled {
          background: rgba(15,12,10,0.97);
          padding: 12px 48px;
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
        }
        .cdm-logo {
          display: flex; align-items: center; gap: 12px;
        }
        .cdm-logo-mask {
          width: 40px; height: 40px; border-radius: 50%; overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px var(--teal);
        }
        .cdm-logo-text {
          display: flex; flex-direction: column; line-height: 1;
        }
        .cdm-logo-name {
          font-family: var(--bebas);
          font-size: 22px; letter-spacing: 0.08em;
          color: var(--cream);
        }
        .cdm-logo-sub {
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--teal); font-weight: 600; margin-top: 2px;
        }
        .cdm-nav-links {
          display: flex; align-items: center; gap: 32px;
          list-style: none;
        }
        .cdm-nav-links li button {
          font-size: 12px; font-weight: 600; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--muted);
          transition: color 0.2s;
        }
        .cdm-nav-links li button:hover { color: var(--teal); }
        .cdm-nav-cta {
          padding: 9px 22px;
          background: var(--teal); color: #0A2020;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; border-radius: 4px;
          transition: background 0.2s, transform 0.15s; white-space: nowrap;
        }
        .cdm-nav-cta:hover { background: var(--teal-dark); transform: translateY(-1px); }
        .cdm-hamburger {
          display: none; flex-direction: column; gap: 5px; padding: 4px;
        }
        .cdm-hamburger span {
          display: block; width: 22px; height: 2px;
          background: var(--cream); border-radius: 2px;
          transition: transform 0.3s, opacity 0.3s;
        }
        .cdm-mobile-menu {
          display: none; position: fixed; inset: 0;
          background: var(--bg); flex-direction: column;
          align-items: center; justify-content: center; gap: 28px; z-index: 200;
        }
        .cdm-mobile-menu.open { display: flex; }
        .cdm-mobile-menu button {
          font-family: var(--bebas); font-size: 40px;
          letter-spacing: 0.08em; color: var(--cream);
          transition: color 0.2s;
        }
        .cdm-mobile-menu button:hover { color: var(--teal); }
        .cdm-mobile-close {
          position: absolute; top: 24px; right: 28px;
          font-size: 28px; color: var(--muted);
        }

        /* ── HERO ───────────────────────────────────── */
        .cdm-hero {
          position: relative; height: 100vh; min-height: 680px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end;
          text-align: center; padding-bottom: 80px; overflow: hidden;
        }
        .cdm-hero-img {
          position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%;
        }
        .cdm-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(15,12,10,0.2) 0%,
            rgba(15,12,10,0.4) 50%,
            rgba(15,12,10,0.92) 100%
          );
          z-index: 1;
        }
        .cdm-hero-content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; align-items: center; gap: 0;
        }
        .cdm-hero-pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,180,180,0.15);
          border: 1px solid rgba(0,180,180,0.4);
          color: var(--teal); font-size: 11px; font-weight: 700;
          letter-spacing: 0.25em; text-transform: uppercase;
          padding: 6px 16px; border-radius: 30px; margin-bottom: 20px;
        }
        .cdm-hero-pill-dot {
          width: 6px; height: 6px; background: var(--teal);
          border-radius: 50%; animation: pulse 1.8s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
        .cdm-hero-title {
          font-family: var(--bebas);
          font-size: clamp(72px, 13vw, 160px);
          line-height: 0.85; letter-spacing: 0.03em;
          color: var(--cream);
        }
        .cdm-hero-title .accent { color: var(--teal); }
        .cdm-hero-tagline {
          font-family: var(--bebas);
          font-size: clamp(18px, 3vw, 32px);
          letter-spacing: 0.2em; color: var(--orange);
          margin-top: 16px; text-transform: uppercase;
        }
        .cdm-hero-sub {
          font-size: 14px; color: var(--muted);
          letter-spacing: 0.12em; text-transform: uppercase;
          font-weight: 500; margin-top: 10px;
        }
        .cdm-hero-btns {
          display: flex; gap: 12px; justify-content: center;
          margin-top: 36px; flex-wrap: wrap;
        }
        .cdm-btn-primary {
          padding: 14px 32px; background: var(--teal); color: #0A2020;
          font-size: 12px; font-weight: 800; letter-spacing: 0.15em;
          text-transform: uppercase; border-radius: 4px;
          transition: background 0.2s, transform 0.15s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .cdm-btn-primary:hover { background: var(--teal-dark); transform: translateY(-2px); }
        .cdm-btn-ghost {
          padding: 14px 32px;
          border: 1px solid rgba(255,255,255,0.25); color: var(--cream);
          font-size: 12px; font-weight: 700; letter-spacing: 0.15em;
          text-transform: uppercase; border-radius: 4px;
          transition: border-color 0.2s, background 0.2s;
        }
        .cdm-btn-ghost:hover { border-color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.05); }

        /* ── SECTION LABELS ─────────────────────────── */
        .cdm-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--teal); margin-bottom: 12px;
          display: flex; align-items: center; gap: 10px;
        }
        .cdm-label::before, .cdm-label::after {
          content: ''; flex: 1; max-width: 40px; height: 1px;
          background: var(--teal); opacity: 0.4;
        }
        .cdm-label.left::before { display: none; }
        .cdm-heading {
          font-family: var(--bebas);
          font-size: clamp(40px, 5vw, 72px);
          letter-spacing: 0.04em; line-height: 0.95;
          color: var(--cream);
        }
        .cdm-heading .teal { color: var(--teal); }
        .cdm-heading .pink { color: var(--pink); }
        .cdm-heading .orange { color: var(--orange); }

        /* ── SCROLLER STRIP ─────────────────────────── */
        .cdm-strip {
          overflow: hidden; background: var(--teal); padding: 14px 0;
          white-space: nowrap;
        }
        .cdm-strip-inner {
          display: inline-flex; gap: 0;
          animation: marquee 30s linear infinite;
        }
        .cdm-strip-item {
          font-family: var(--bebas); font-size: 20px;
          letter-spacing: 0.15em; color: #0A2020;
          padding: 0 28px;
          display: inline-flex; align-items: center; gap: 28px;
        }
        .cdm-strip-item::after { content: '✦'; color: #0A202088; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        /* ── SIGNATURE CARDS ─────────────────────────── */
        .cdm-sigs { padding: 100px 0; background: var(--surface); }
        .cdm-sigs-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
        .cdm-sigs-header { text-align: center; margin-bottom: 60px; }
        .cdm-sigs-header p { color: var(--muted); margin-top: 14px; font-size: 15px; }
        .cdm-sigs-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;
        }
        .cdm-sig-card {
          position: relative; overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .cdm-sig-card:hover { transform: scale(1.015); }
        .cdm-sig-img {
          width: 100%; aspect-ratio: 3/4; object-fit: cover;
          filter: brightness(0.85) saturate(1.1);
          transition: filter 0.5s, transform 0.6s;
          display: block;
        }
        .cdm-sig-card:hover .cdm-sig-img { filter: brightness(1) saturate(1.2); transform: scale(1.04); }
        .cdm-sig-body {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 36px 28px 28px;
          background: linear-gradient(to top, rgba(15,12,10,0.98) 60%, transparent);
        }
        .cdm-sig-category {
          font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--teal); font-weight: 700; margin-bottom: 8px;
        }
        .cdm-sig-name {
          font-family: var(--bebas); font-size: 30px;
          letter-spacing: 0.05em; color: var(--cream); margin-bottom: 10px;
        }
        .cdm-sig-desc { font-size: 13px; color: var(--muted); margin-bottom: 14px; line-height: 1.5; }
        .cdm-sig-price { font-size: 17px; font-weight: 700; color: var(--orange); }

        /* ── SPECIALS STRIP ─────────────────────────── */
        .cdm-specials {
          border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
        }
        .cdm-specials-inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr);
        }
        .cdm-special-card {
          padding: 56px 44px;
          border-right: 1px solid var(--border);
          transition: background 0.3s;
        }
        .cdm-special-card:last-child { border-right: none; }
        .cdm-special-card:hover { background: var(--surface); }
        .cdm-special-day {
          font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--pink); font-weight: 700; margin-bottom: 14px;
        }
        .cdm-special-icon { font-size: 36px; margin-bottom: 20px; }
        .cdm-special-title {
          font-family: var(--bebas); font-size: 28px;
          letter-spacing: 0.05em; color: var(--cream); margin-bottom: 12px;
        }
        .cdm-special-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }

        /* ── MENU ───────────────────────────────────── */
        .cdm-menu { padding: 100px 0; background: var(--bg); }
        .cdm-menu-inner { max-width: 1100px; margin: 0 auto; padding: 0 48px; }
        .cdm-menu-header { text-align: center; margin-bottom: 56px; }
        .cdm-menu-header p { color: var(--muted); font-size: 15px; margin-top: 14px; }
        .cdm-tabs {
          display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
          margin-bottom: 52px;
        }
        .cdm-tab {
          padding: 8px 20px; font-size: 12px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          border: 1px solid var(--border); border-radius: 30px;
          color: var(--muted); transition: all 0.2s;
        }
        .cdm-tab.active { border-color: var(--teal); color: var(--teal); background: var(--teal-glow); }
        .cdm-tab:hover:not(.active) { border-color: rgba(255,255,255,0.25); color: var(--cream); }
        .cdm-menu-list { display: flex; flex-direction: column; gap: 0; }
        .cdm-menu-item {
          display: flex; justify-content: space-between; align-items: start;
          padding: 20px 0; border-bottom: 1px solid var(--border); gap: 24px;
          transition: background 0.2s; margin: 0 -12px; padding-left: 12px; padding-right: 12px;
          border-radius: 4px;
        }
        .cdm-menu-item:last-child { border-bottom: none; }
        .cdm-menu-item:hover { background: rgba(0,180,180,0.04); }
        .cdm-item-left { flex: 1; }
        .cdm-item-name {
          font-size: 16px; font-weight: 700; color: var(--cream);
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .cdm-item-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          padding: 2px 8px; border-radius: 30px; white-space: nowrap;
          background: var(--teal-glow); border: 1px solid rgba(0,180,180,0.4); color: var(--teal);
        }
        .cdm-item-veggie {
          font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 30px;
          background: rgba(125,197,47,0.12); border: 1px solid rgba(125,197,47,0.3); color: var(--lime);
        }
        .cdm-item-desc { font-size: 13px; color: var(--muted); margin-top: 4px; line-height: 1.5; }
        .cdm-item-price {
          font-size: 15px; font-weight: 700; color: var(--orange);
          white-space: nowrap; padding-top: 2px;
        }
        .cdm-menu-footnote {
          text-align: center; margin-top: 48px; padding-top: 28px;
          border-top: 1px solid var(--border);
          font-size: 12px; color: var(--muted); letter-spacing: 0.04em; line-height: 1.7;
        }

        /* ── STORY ──────────────────────────────────── */
        .cdm-story { padding: 100px 0; background: var(--surface); }
        .cdm-story-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 48px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
        }
        .cdm-story-body { font-size: 16px; color: var(--muted); margin-top: 24px; line-height: 1.8; }
        .cdm-story-body + .cdm-story-body { margin-top: 14px; }
        .cdm-story-quote {
          margin-top: 36px; padding: 28px 28px 28px 24px;
          border-left: 3px solid var(--teal);
          background: rgba(0,180,180,0.05);
        }
        .cdm-story-quote-text {
          font-size: 18px; font-style: italic; color: var(--cream); line-height: 1.5;
          font-family: var(--nunito);
        }
        .cdm-story-quote-attr { font-size: 12px; color: var(--teal); margin-top: 10px; letter-spacing: 0.1em; font-weight: 700; }
        .cdm-story-img {
          width: 100%; height: 100%; object-fit: cover; min-height: 500px;
          border-radius: 4px;
        }

        /* ── GALLERY ────────────────────────────────── */
        .cdm-gallery { padding: 100px 0; background: var(--bg); }
        .cdm-gallery-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
        .cdm-gallery-header { text-align: center; margin-bottom: 52px; }
        .cdm-gallery-header p { color: var(--muted); font-size: 15px; margin-top: 14px; }
        .cdm-gallery-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 6px;
        }
        .cdm-gallery-item {
          overflow: hidden; position: relative;
          background: var(--surface);
        }
        .cdm-gallery-item:nth-child(1) { grid-column: span 7; }
        .cdm-gallery-item:nth-child(2) { grid-column: span 5; }
        .cdm-gallery-item:nth-child(3) { grid-column: span 5; }
        .cdm-gallery-item:nth-child(4) { grid-column: span 7; }
        .cdm-gallery-item img {
          width: 100%; height: 100%; object-fit: cover;
          display: block; min-height: 300px;
          filter: brightness(0.85) saturate(1.1);
          transition: filter 0.5s, transform 0.6s cubic-bezier(0.22,1,0.36,1);
        }
        .cdm-gallery-item:hover img { filter: brightness(1) saturate(1.25); transform: scale(1.04); }

        /* ── CONTACT ─────────────────────────────────── */
        .cdm-contact { padding: 100px 0; background: var(--surface); }
        .cdm-contact-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 48px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
        }
        .cdm-hours-table { width: 100%; border-collapse: collapse; margin-top: 28px; }
        .cdm-hours-table tr { border-bottom: 1px solid var(--border); }
        .cdm-hours-table td { padding: 12px 0; font-size: 14px; }
        .cdm-hours-table td:first-child { color: var(--muted); font-weight: 500; }
        .cdm-hours-table td:last-child { text-align: right; color: var(--cream); }
        .cdm-hours-table tr.closed td { opacity: 0.35; }
        .cdm-today td { color: var(--teal) !important; font-weight: 700 !important; }
        .cdm-contact-info { display: flex; flex-direction: column; gap: 20px; margin-top: 28px; }
        .cdm-contact-row { display: flex; flex-direction: column; gap: 4px; }
        .cdm-contact-label {
          font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase;
          color: var(--teal); font-weight: 700;
        }
        .cdm-contact-value { font-size: 15px; color: var(--cream); }
        .cdm-contact-value a { transition: color 0.2s; }
        .cdm-contact-value a:hover { color: var(--teal); }
        .cdm-contact-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 36px; }
        .cdm-contact-btn {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 20px; border: 1px solid var(--border); border-radius: 4px;
          font-size: 14px; color: var(--cream); font-weight: 500;
          transition: border-color 0.2s, background 0.2s;
        }
        .cdm-contact-btn:hover { border-color: var(--teal); background: var(--teal-glow); }
        .cdm-contact-btn-icon { font-size: 20px; }
        .cdm-contact-btn-inner { display: flex; flex-direction: column; }
        .cdm-contact-btn-label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); }
        .cdm-contact-btn-val { font-size: 14px; color: var(--cream); font-weight: 600; }

        /* ── CTA ─────────────────────────────────────── */
        .cdm-cta {
          padding: 100px 48px; text-align: center;
          background: var(--bg); border-top: 1px solid var(--border);
          position: relative; overflow: hidden;
        }
        .cdm-cta::before {
          content: '';
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(0,180,180,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .cdm-cta h2 {
          font-family: var(--bebas); font-size: clamp(44px, 6vw, 80px);
          letter-spacing: 0.05em; color: var(--cream); position: relative; z-index: 1;
        }
        .cdm-cta p {
          color: var(--muted); font-size: 16px; max-width: 500px;
          margin: 16px auto 40px; position: relative; z-index: 1;
        }
        .cdm-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }

        /* ── FOOTER ─────────────────────────────────── */
        .cdm-footer {
          padding: 56px 48px; border-top: 1px solid var(--border);
          background: var(--surface);
          display: grid; grid-template-columns: 1fr auto 1fr; gap: 40px; align-items: start;
        }
        .cdm-footer-left {}
        .cdm-footer-logo {
          display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
        }
        .cdm-footer-logo-mask { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; }
        .cdm-footer-logo-name {
          font-family: var(--bebas); font-size: 22px; letter-spacing: 0.08em;
          color: var(--cream);
        }
        .cdm-footer-address { font-size: 13px; color: var(--muted); line-height: 1.7; }
        .cdm-footer-links {
          display: flex; flex-direction: column; gap: 8px; align-items: center;
        }
        .cdm-footer-links a {
          font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--muted); transition: color 0.2s;
        }
        .cdm-footer-links a:hover { color: var(--teal); }
        .cdm-footer-right { text-align: right; }
        .cdm-footer-social { display: flex; gap: 14px; justify-content: flex-end; margin-bottom: 12px; }
        .cdm-footer-social a {
          font-size: 20px; text-decoration: none;
          transition: transform 0.2s; display: inline-block;
        }
        .cdm-footer-social a:hover { transform: scale(1.15); }
        .cdm-footer-copy { font-size: 11px; color: var(--muted); letter-spacing: 0.05em; line-height: 1.6; }
        .cdm-footer-copy a { color: var(--teal); }
        .cdm-footer-copy a:hover { text-decoration: underline; }

        /* ── RESPONSIVE ──────────────────────────────── */
        @media (max-width: 960px) {
          .cdm-nav { padding: 16px 24px; }
          .cdm-nav.scrolled { padding: 10px 24px; }
          .cdm-nav-links { display: none; }
          .cdm-nav-cta { display: none; }
          .cdm-hamburger { display: flex; }
          .cdm-sigs-grid { grid-template-columns: 1fr; }
          .cdm-sigs-inner, .cdm-menu-inner, .cdm-story-inner,
          .cdm-gallery-inner, .cdm-contact-inner { padding: 0 24px; }
          .cdm-specials-inner { grid-template-columns: 1fr; }
          .cdm-special-card { border-right: none; border-bottom: 1px solid var(--border); }
          .cdm-special-card:last-child { border-bottom: none; }
          .cdm-story-inner { grid-template-columns: 1fr; gap: 48px; }
          .cdm-story-img { min-height: 300px; }
          .cdm-gallery-grid { grid-template-columns: 1fr 1fr; }
          .cdm-gallery-item:nth-child(n) { grid-column: span 1; }
          .cdm-contact-inner { grid-template-columns: 1fr; gap: 56px; }
          .cdm-footer { grid-template-columns: 1fr; padding: 48px 24px; }
          .cdm-footer-right { text-align: left; }
          .cdm-footer-social { justify-content: flex-start; }
          .cdm-cta { padding: 80px 24px; }
        }
        @media (max-width: 540px) {
          .cdm-gallery-grid { grid-template-columns: 1fr; }
          .cdm-hero-title { font-size: clamp(60px, 18vw, 80px); }
          .cdm-footer-links { align-items: flex-start; }
        }
      `}</style>

      <div className="cdm" style={{ paddingTop: '44px' }}>

        {/* ── NAV ── */}
        <nav className={`cdm-nav ${navScrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
          <div className="cdm-logo">
            <div className="cdm-logo-mask">
              <Image src="/sites/cinco-de-maya/logo.png" alt="Cinco de Maya" width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="cdm-logo-text">
              <span className="cdm-logo-name">Cinco de Maya</span>
              <span className="cdm-logo-sub">Aguadilla, PR · PR-110</span>
            </div>
          </div>

          <ul className="cdm-nav-links">
            <li><button onClick={() => scrollTo('menu')}>Menú</button></li>
            <li><button onClick={() => scrollTo('specials')}>Especiales</button></li>
            <li><button onClick={() => scrollTo('story')}>Nosotros</button></li>
            <li><button onClick={() => scrollTo('gallery')}>Galería</button></li>
            <li><button onClick={() => scrollTo('contact')}>Contacto</button></li>
          </ul>

          <a href="tel:+17876580033" className="cdm-nav-cta">📞 Llámanos</a>

          <button
            className="cdm-hamburger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`cdm-mobile-menu ${menuOpen ? 'open' : ''}`} role="dialog" aria-label="Mobile navigation">
          <button className="cdm-mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
          <button onClick={() => scrollTo('menu')}>Menú</button>
          <button onClick={() => scrollTo('specials')}>Especiales</button>
          <button onClick={() => scrollTo('story')}>Nosotros</button>
          <button onClick={() => scrollTo('gallery')}>Galería</button>
          <button onClick={() => scrollTo('contact')}>Contacto</button>
          <a href="tel:+17876580033" className="cdm-btn-primary">📞 787-658-0033</a>
        </div>

        {/* ── HERO ── */}
        <section className="cdm-hero" aria-label="Hero">
          <Image
            src="/sites/cinco-de-maya/hero.png"
            alt="Cinco de Maya restaurant interior — vibrant, colorful, festive cantina in Aguadilla, Puerto Rico"
            fill
            className="cdm-hero-img"
            priority
            style={{ objectFit: 'cover' }}
          />
          <div className="cdm-hero-overlay" />
          <div className="cdm-hero-content">
            <div className="cdm-hero-pill">
              <span className="cdm-hero-pill-dot" />
              Aguadilla, Puerto Rico · PR-110
            </div>
            <h1 className="cdm-hero-title">
              <span className="accent">¡</span>Cinco
              <br />
              de<span className="accent"> Maya</span>
              <span className="accent">!</span>
            </h1>
            <p className="cdm-hero-tagline">Let&apos;s Eat Más Tacos</p>
            <p className="cdm-hero-sub">Tacos · Birria · Burritos · Margaritas</p>
            <div className="cdm-hero-btns">
              <button className="cdm-btn-primary" onClick={() => scrollTo('menu')}>
                Ver Menú
              </button>
              <a href="tel:+17876580033" className="cdm-btn-ghost">
                📞 787-658-0033
              </a>
            </div>
          </div>
        </section>

        {/* ── SCROLLING STRIP ── */}
        <div className="cdm-strip" aria-hidden="true">
          <div className="cdm-strip-inner">
            {[...Array(2)].map((_, i) => (
              <span key={i} style={{ display: 'inline-flex' }}>
                <span className="cdm-strip-item">Tacos</span>
                <span className="cdm-strip-item">Birria</span>
                <span className="cdm-strip-item">Burritos</span>
                <span className="cdm-strip-item">Margaritas</span>
                <span className="cdm-strip-item">Quesadillas</span>
                <span className="cdm-strip-item">Fajitas</span>
                <span className="cdm-strip-item">Churros</span>
                <span className="cdm-strip-item">Aguadilla, PR</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── SIGNATURES ── */}
        <section className="cdm-sigs">
          <div className="cdm-sigs-inner">
            <div className="cdm-sigs-header">
              <p className="cdm-label">Los Más Pedidos</p>
              <h2 className="cdm-heading">Fan <span className="teal">Favorites</span></h2>
              <p>These dishes put us on the map. Order one. Thank us later.</p>
            </div>
            <div className="cdm-sigs-grid">
              {SIGNATURES.map((item) => (
                <div key={item.name} className="cdm-sig-card">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={520}
                    height={620}
                    className="cdm-sig-img"
                  />
                  <div className="cdm-sig-body">
                    <p className="cdm-sig-category">{item.category}</p>
                    <h3 className="cdm-sig-name">{item.name}</h3>
                    <p className="cdm-sig-desc">{item.description}</p>
                    <p className="cdm-sig-price">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SPECIALS ── */}
        <section className="cdm-specials" id="specials">
          <div className="cdm-specials-inner">
            {SPECIALS.map((s) => (
              <div key={s.title} className="cdm-special-card">
                <p className="cdm-special-day">{s.day}</p>
                <div className="cdm-special-icon">{s.icon}</div>
                <h3 className="cdm-special-title">{s.title}</h3>
                <p className="cdm-special-desc">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FULL MENU ── */}
        <section className="cdm-menu" id="menu">
          <div className="cdm-menu-inner">
            <div className="cdm-menu-header">
              <p className="cdm-label">Cinco de Maya</p>
              <h2 className="cdm-heading">El <span className="teal">Menú</span></h2>
              <p>Pregúntale a tu servidor sobre los especiales del día.</p>
            </div>

            <div className="cdm-tabs" role="tablist">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  role="tab"
                  aria-selected={activeCategory === cat.key}
                  className={`cdm-tab ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                  id={`tab-${cat.key}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="cdm-menu-list" role="tabpanel">
              {(MENU_ITEMS[activeCategory] || []).map((item) => (
                <div key={item.name} className="cdm-menu-item">
                  <div className="cdm-item-left">
                    <div className="cdm-item-name">
                      {item.name}
                      {item.badge && <span className="cdm-item-badge">{item.badge}</span>}
                      {item.veggie && <span className="cdm-item-veggie">🌿 Veggie</span>}
                    </div>
                    <p className="cdm-item-desc">{item.description}</p>
                  </div>
                  <div className="cdm-item-price">{item.price}</div>
                </div>
              ))}
            </div>

            <p className="cdm-menu-footnote">
              Precios en USD · Por favor indícanos si tienes alguna alergia alimentaria.<br />
              🌿 Opciones vegetarianas disponibles · Menú sujeto a cambios según disponibilidad.
            </p>
          </div>
        </section>

        {/* ── STORY ── */}
        <section className="cdm-story" id="story">
          <div className="cdm-story-inner">
            <div>
              <p className="cdm-label left">Nuestra Historia</p>
              <h2 className="cdm-heading">Where <span className="teal">México</span><br />Meets <span className="pink">Puerto Rico</span></h2>
              <p className="cdm-story-body">
                Cinco de Maya was born from a love of bold flavors, vibrant culture, and good times. We brought the spirit of authentic Mexican street food — birria, tacos al pastor, sizzling fajitas — to the heart of Aguadilla, Puerto Rico.
              </p>
              <p className="cdm-story-body">
                Our name says it all: we celebrate every day like it&apos;s a fiesta. From our hand-crafted margaritas to our slow-braised birria, every dish and every drink is made with heart. ¡Bienvenidos a la familia!
              </p>
              <div className="cdm-story-quote">
                <p className="cdm-story-quote-text">
                  &ldquo;The best tacos in Puerto Rico, hands down. You can taste the love in every bite. The birria chimichanga changed my life.&rdquo;
                </p>
                <p className="cdm-story-quote-attr">— A regular, via Google Reviews</p>
              </div>
            </div>
            <div>
              <Image
                src="/sites/cinco-de-maya/bar.png"
                alt="Cinco de Maya vibrant bar and dining room"
                width={760}
                height={900}
                className="cdm-story-img"
              />
            </div>
          </div>
        </section>

        {/* ── GALLERY ── */}
        <section className="cdm-gallery" id="gallery">
          <div className="cdm-gallery-inner">
            <div className="cdm-gallery-header">
              <p className="cdm-label">La Experiencia</p>
              <h2 className="cdm-heading">Inside <span className="orange">Cinco de Maya</span></h2>
              <p>A meal here is more than food. It&apos;s a full-on fiesta.</p>
            </div>
            <div className="cdm-gallery-grid">
              {GALLERY.map((img) => (
                <div key={img.src} className="cdm-gallery-item">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={img.wide ? 920 : 460}
                    height={img.wide ? 560 : 560}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT & HOURS ── */}
        <section className="cdm-contact" id="contact">
          <div className="cdm-contact-inner">
            <div>
              <p className="cdm-label left">Horario</p>
              <h2 className="cdm-heading">Horas &amp; <span className="teal">Ubicación</span></h2>
              <table className="cdm-hours-table" aria-label="Hours of operation">
                <tbody>
                  {RESTAURANT.hours.map((h) => (
                    <tr key={h.day} className={`${h.closed ? 'closed' : ''} ${h.day === TODAY ? 'cdm-today' : ''}`}>
                      <td>{h.day}</td>
                      <td>{h.closed ? 'Cerrado' : `${h.open} – ${h.close}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '28px', padding: '16px 20px', background: 'rgba(0,180,180,0.06)', border: '1px solid rgba(0,180,180,0.2)', borderRadius: '4px' }}>
                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
                  🌟 <strong style={{ color: 'var(--teal)' }}>Lunch Specials</strong> available Wed–Fri from 11:30AM–2PM.<br />
                  Walk-ins welcome · Takeout available · Fully wheelchair accessible.
                </p>
              </div>
            </div>
            <div>
              <p className="cdm-label left">Contáctanos</p>
              <h2 className="cdm-heading">Visítanos &amp; <span className="teal">Ordena</span></h2>
              <div className="cdm-contact-info">
                <div className="cdm-contact-row">
                  <span className="cdm-contact-label">Dirección</span>
                  <span className="cdm-contact-value">PR-110, Aguadilla, PR 00603</span>
                </div>
                <div className="cdm-contact-row">
                  <span className="cdm-contact-label">Órdenes</span>
                  <span className="cdm-contact-value">Takeout & Dine-in · No delivery</span>
                </div>
              </div>
              <div className="cdm-contact-btns">
                <a href="tel:+17876580033" className="cdm-contact-btn">
                  <span className="cdm-contact-btn-icon">📞</span>
                  <span className="cdm-contact-btn-inner">
                    <span className="cdm-contact-btn-label">Teléfono</span>
                    <span className="cdm-contact-btn-val">787-658-0033</span>
                  </span>
                </a>
                <a
                  href={RESTAURANT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cdm-contact-btn"
                >
                  <span className="cdm-contact-btn-icon">📷</span>
                  <span className="cdm-contact-btn-inner">
                    <span className="cdm-contact-btn-label">Instagram</span>
                    <span className="cdm-contact-btn-val">@cincodemayapuertorico</span>
                  </span>
                </a>
                <a
                  href={RESTAURANT.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cdm-contact-btn"
                >
                  <span className="cdm-contact-btn-icon">👍</span>
                  <span className="cdm-contact-btn-inner">
                    <span className="cdm-contact-btn-label">Facebook</span>
                    <span className="cdm-contact-btn-val">Cinco de Maya Puerto Rico</span>
                  </span>
                </a>
                <a
                  href="https://maps.google.com/?q=Cinco+de+Maya+Aguadilla+PR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cdm-contact-btn"
                >
                  <span className="cdm-contact-btn-icon">📍</span>
                  <span className="cdm-contact-btn-inner">
                    <span className="cdm-contact-btn-label">Cómo llegar</span>
                    <span className="cdm-contact-btn-val">Ver en Google Maps</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cdm-cta">
          <h2>¿Tienes Hambre?<br /><span style={{ color: 'var(--teal)' }}>Let&apos;s Eat.</span></h2>
          <p>
            Open Wednesday through Sunday, 11:30AM–9:30PM.<br />
            No reservation needed. Just bring your appetite.
          </p>
          <div className="cdm-cta-btns">
            <a href="tel:+17876580033" className="cdm-btn-primary">
              📞 Order by Phone
            </a>
            <a
              href="https://maps.google.com/?q=Cinco+de+Maya+Aguadilla+PR"
              target="_blank"
              rel="noopener noreferrer"
              className="cdm-btn-ghost"
            >
              📍 Get Directions
            </a>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="cdm-footer">
          <div className="cdm-footer-left">
            <div className="cdm-footer-logo">
              <div className="cdm-footer-logo-mask">
                <Image src="/sites/cinco-de-maya/logo.png" alt="" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span className="cdm-footer-logo-name">Cinco de Maya</span>
            </div>
            <p className="cdm-footer-address">
              PR-110, Aguadilla, Puerto Rico 00603<br />
              Wed–Sun · 11:30AM – 9:30PM<br />
              📞 787-658-0033
            </p>
          </div>

          <div className="cdm-footer-links">
            <button
              onClick={() => scrollTo('menu')}
              style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              Menú
            </button>
            <button
              onClick={() => scrollTo('specials')}
              style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              Especiales
            </button>
            <button
              onClick={() => scrollTo('story')}
              style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              Nosotros
            </button>
            <a
              href={RESTAURANT.instagramUrl}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              Instagram
            </a>
          </div>

          <div className="cdm-footer-right">
            <div className="cdm-footer-social">
              <a
                href={RESTAURANT.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                📷
              </a>
              <a
                href={RESTAURANT.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                👍
              </a>
            </div>
            <p className="cdm-footer-copy">
              © {currentYear} Cinco de Maya · Aguadilla, PR<br />
              Sitio web por <a href="https://saborweb.com" target="_blank" rel="noopener noreferrer">Sabor Web</a>
            </p>
          </div>
        </footer>

      </div>
    </PreviewGate>
  );
}
