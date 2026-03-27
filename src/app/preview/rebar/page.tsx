'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

// ─── DATA ────────────────────────────────────────────────────────────────────

const REBAR = {
  name: 'Rebar',
  tagline: 'Gastronomía & Cocteles',
  subTagline: 'Chef-driven cuisine. Handcrafted cocktails. Aguadilla, Puerto Rico.',
  address: 'Carr. 110 Km 32.4 · Bo. Maleza Alta',
  city: 'Aguadilla, Puerto Rico 00603',
  phone: '787-658-1669',
  email: 'rebargastronomia@gmail.com',
  instagram: '@rebarpr',
  instagramUrl: 'https://www.instagram.com/rebarpr',
  facebookUrl: 'https://www.facebook.com/p/Rebar-Gastronom%C3%ADa-100093088920480/',
  hours: [
    { day: 'Monday',    open: '4:00 PM', close: '10:00 PM', closed: false },
    { day: 'Tuesday',   open: '',        close: '',          closed: true  },
    { day: 'Wednesday', open: '4:00 PM', close: '10:00 PM', closed: false },
    { day: 'Thursday',  open: '4:00 PM', close: '10:00 PM', closed: false },
    { day: 'Friday',    open: '4:00 PM', close: '11:00 PM', closed: false },
    { day: 'Saturday',  open: '4:00 PM', close: '11:00 PM', closed: false },
    { day: 'Sunday',    open: '2:30 PM', close: '9:00 PM',  closed: false },
  ],
  story: {
    heading: 'Where Puerto Rico Meets the World',
    body: `Rebar was born from a simple obsession: to bring the full spectrum of global flavors to the northwest corner of Puerto Rico, without ever losing the warmth of where we come from. Our kitchen is driven by seasonal ingredients, classical technique, and an unapologetic love for bold flavor.`,
    body2: `The bar is our heart. Owner Ivan Sáez — part alchemist, part host — has spent years perfecting cocktails that don't just accompany a meal. They complete it. From the tobacco-kissed Querido Viejo to our rotating Coctel Secreto every Wednesday, the bar at Rebar is unlike anything else on the island.`,
    quote: `"This is our happy place — and we want it to be yours."`,
    attribution: '— A Regular, NJ via Puerto Rico',
  },
};

const SIGNATURES = [
  {
    name: 'Ribeye 16oz',
    description: 'Prime 16oz ribeye grilled to order. The definitive Rebar cut — ask for medium-rare.',
    price: '$58',
    image: '/sites/rebar/ribeye.png',
    category: 'Carnes',
  },
  {
    name: 'Querido Viejo',
    description: 'Abuelo rum, espresso, tobacco bitters, demerara. Puerto Rico\'s answer to the Old Fashioned.',
    price: '$14',
    image: '/sites/rebar/querido-viejo.png',
    category: 'Cocktails',
  },
  {
    name: 'Pulpo a la Brasa',
    description: 'Char-grilled octopus, chimichurri verde, lemon oil. Simple perfection.',
    price: '$28',
    image: '/sites/rebar/pulpo.png',
    category: 'Mariscos',
  },
];

const MENU_CATEGORIES = [
  { key: 'tapas', label: 'Tapas' },
  { key: 'bao', label: 'Bao' },
  { key: 'mains', label: 'Mains' },
  { key: 'pasta', label: 'Pasta' },
  { key: 'seafood', label: 'Mariscos' },
  { key: 'cocktails', label: 'Cocktails' },
  { key: 'desserts', label: 'Postres' },
  { key: 'wine', label: 'Bebidas' },
];

const MENU_ITEMS: Record<string, Array<{ name: string; description: string; price: string; featured?: boolean }>> = {
  tapas: [
    { name: 'Dragonfire Wings',    description: 'Crispy wings tossed in our signature spicy glaze, served with ranch or blue cheese', price: '$12', featured: true },
    { name: 'Calamari Frito',      description: 'Crispy fried calamari with house aioli',                                            price: '$12' },
    { name: 'Monkey Nachos',       description: 'Crispy malanga chips loaded with churrasco or chicken, pico de gallo, guacamole & queso', price: '$16' },
    { name: 'Croquetas de Chorizo',description: 'Chorizo & manchego croquettes, golden-fried to perfection',                        price: '$14' },
    { name: 'Ceviche de Mero',     description: 'Fresh grouper, citrus leche de tigre, crispy plantain chips',                      price: '$14' },
    { name: 'Chorizo al Vino',     description: 'Pan-seared Spanish chorizo in red wine reduction, served with manchego & warm pita', price: '$14' },
    { name: 'Bruschetta',          description: 'Toasted baguette with fresh tomato, basil, and a drizzle of aged balsamic',        price: '$12' },
  ],
  bao: [
    { name: 'Mongolian Beef Bao',    description: 'Steamed bao buns with glazed Mongolian beef, scallions & sesame',            price: '$16', featured: true },
    { name: 'Crispy Pork Belly Bao', description: 'Steamed bao with slow-braised crispy pork belly, pickled daikon & sriracha mayo', price: '$16' },
    { name: 'Shrimp Tempura Bao',    description: 'Steamed bao with crispy shrimp tempura, avocado & yuzu aioli',               price: '$15' },
  ],
  mains: [
    { name: 'Ribeye 16oz',           description: 'Prime 16oz ribeye grilled to order, with chef\'s choice accompaniment',     price: '$58', featured: true },
    { name: 'New York Strip 10oz',   description: '10oz New York strip with house seasoning, red wine reduction & roasted garlic butter', price: '$36' },
    { name: 'Churrasco',             description: 'Skirt steak grilled over open flame with chimichurri, tostones & house salad', price: '$28' },
    { name: 'Costillas — Half Rack', description: 'Slow-braised baby back ribs with house BBQ glaze & fries',                  price: '$18' },
    { name: 'Costillas — Full Rack', description: 'Full rack of slow-braised baby back ribs with house BBQ glaze & fries',     price: '$34' },
    { name: 'Mongolian Beef Entrée', description: 'Glazed Mongolian beef served over fried rice with tostones & scallions',    price: '$22' },
  ],
  pasta: [
    { name: 'Manhattan Lo-Mein',  description: 'Stir-fried lo-mein noodles with New York strip, seasonal vegetables & house sauce', price: '$36', featured: true },
    { name: 'Fettuccine Alfredo', description: 'Classic house alfredo — add chicken, churrasco, New York strip or shrimp',           price: 'from $18' },
  ],
  seafood: [
    { name: 'Pulpo a la Brasa', description: 'Char-grilled octopus with chimichurri verde, lemon oil & house petite salad', price: '$28', featured: true },
    { name: 'Mahi Mahi',        description: 'Grilled fresh mahi with tropical butter, seasonal vegetables & rice',         price: '$24' },
    { name: 'Salmon',           description: 'Pan-seared salmon filet with potato gnocchi & herb cream sauce',              price: '$24' },
    { name: 'Shrimp al Ajillo', description: 'Sautéed shrimp in garlic white wine butter with fresh herbs & crusty bread',  price: '$22' },
  ],
  cocktails: [
    { name: 'Querido Viejo',       description: 'Abuelo rum, espresso, tobacco bitters, demerara — the house signature',   price: '$14', featured: true },
    { name: 'Passion Fruit Mojito',description: 'White rum, fresh passion fruit, mint, lime, house soda',                   price: '$13' },
    { name: 'Rebar Spritz',        description: 'Aperol, prosecco, fresh orange, soda — the aperitivo hour essential',      price: '$12' },
    { name: 'House Old Fashioned', description: 'Small-batch bourbon, house aromatic bitters, smoked orange peel, demerara', price: '$9' },
    { name: 'House Margarita',     description: 'Premium tequila, fresh lime, agave nectar — 2×1 on Thursdays',             price: '$12' },
    { name: 'Coctel Secreto',      description: 'The Wednesday mystery cocktail — ask your server. Only $8.',               price: '$8' },
  ],
  desserts: [
    { name: 'Tres Leches',       description: 'Classic Puerto Rican tres leches, house whipped cream & seasonal berry compote', price: '$9', featured: true },
    { name: 'Volcán de Chocolate', description: 'Warm chocolate lava cake with vanilla ice cream & caramel drizzle',            price: '$10' },
    { name: 'Cheesecake del Chef', description: 'House cheesecake with seasonal topping — ask your server for today\'s flavor', price: '$9' },
  ],
  wine: [
    { name: 'House Red Wine',  description: 'Ask your server about tonight\'s selection by the glass or bottle', price: '$9' },
    { name: 'House White Wine',description: 'Ask your server about tonight\'s selection by the glass or bottle', price: '$9' },
    { name: 'Craft Beer',      description: 'Rotating selection of local and imported craft beers — ask your server', price: '$7' },
  ],
};

const WEEKLY_SPECIALS = [
  { day: 'Wednesday', icon: '🔮', title: 'Coctel Secreto', description: 'Mystery cocktail of the week. Only $8. Ask your server.' },
  { day: 'Thursday',  icon: '🍹', title: 'Margaritas 2×1', description: 'Two house margaritas for the price of one. Plus Old Fashioned $9.' },
  { day: 'Friday',    icon: '🕯️', title: 'Slow Vibes Friday', description: 'Dim lights, slow music. Food for the soul — cocktails that enchant.' },
];

const GALLERY = [
  { src: '/sites/rebar/images/bar-interior.jpg',  alt: 'The Rebar bar — warm amber light, dark wood, bottles backlit in gold', wide: true  },
  { src: '/sites/rebar/images/cocktail.jpg',       alt: 'House smoked Old Fashioned — Querido Viejo',                          wide: false },
  { src: '/sites/rebar/images/plated-dish.jpg',    alt: 'Chef-plated entrée on dark slate',                                    wide: false },
  { src: '/sites/rebar/images/dining-room.jpg',    alt: 'The dining room by candlelight',                                      wide: true  },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function RebarPage() {
  const [activeCategory, setActiveCategory] = useState('tapas');
  const [navScrolled, setNavScrolled] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  // Highlight today's hours
  const TODAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      <style>{`
        /* ── Elegante: Rebar ── */
        .rebar-root {
          --bg:          #0D0C0A;
          --surface:     #181510;
          --cream:       #F5F0E8;
          --muted:       #8A7E6E;
          --gold:        #C4923A;
          --gold-light:  #D4A84A;
          --border:      rgba(255,255,255,0.07);
          --cormorant:   'Cormorant Garamond', Georgia, serif;
          --dm-sans:     'DM Sans', system-ui, sans-serif;
          background: var(--bg);
          color: var(--cream);
          font-family: var(--dm-sans);
          font-weight: 300;
          line-height: 1.7;
        }
        /* Reset */
        .rebar-root *, .rebar-root *::before, .rebar-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .rebar-root a { color: inherit; text-decoration: none; }
        .rebar-root img { display: block; max-width: 100%; }
        .rebar-root button { cursor: pointer; border: none; background: none; font-family: var(--dm-sans); }

        /* ── Preview Banner ── */
        .preview-banner {
          position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
          background: rgba(196,146,58,0.97);
          padding: 10px 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          font-family: var(--dm-sans); font-size: 13px; font-weight: 500;
          color: #1C1208; letter-spacing: 0.05em;
          backdrop-filter: blur(8px);
        }
        .preview-banner-left { display: flex; align-items: center; gap: 10px; }
        .preview-banner-badge { 
          background: #1C1208; color: var(--gold); 
          padding: 3px 8px; border-radius: 30px; 
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .preview-banner-cta {
          background: #1C1208; color: var(--gold);
          padding: 6px 16px; border-radius: 4px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
        }
        .preview-banner-close {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          border-radius: 50%; color: #1C1208; font-size: 18px; opacity: 0.6;
          transition: opacity 0.2s;
        }
        .preview-banner-close:hover { opacity: 1; }

        /* ── Nav ── */
        .rebar-nav {
          position: fixed; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 48px;
          transition: background 0.4s, padding 0.3s, backdrop-filter 0.4s;
        }
        .rebar-nav.scrolled {
          background: rgba(13,12,10,0.96);
          padding: 16px 48px;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .rebar-nav-logo {
          font-family: var(--cormorant);
          font-size: 22px; font-weight: 400; letter-spacing: 0.06em;
          color: var(--cream);
        }
        .rebar-nav-logo span { color: var(--gold); font-style: italic; }
        .rebar-nav-links {
          display: flex; align-items: center; gap: 36px;
          list-style: none;
        }
        .rebar-nav-links li a {
          font-size: 12px; font-weight: 500; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--muted);
          transition: color 0.2s;
        }
        .rebar-nav-links li a:hover { color: var(--cream); }
        .rebar-nav-cta {
          padding: 9px 22px; border: 1px solid var(--gold);
          font-size: 11px; font-weight: 600; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--gold);
          border-radius: 2px; transition: background 0.2s, color 0.2s;
          white-space: nowrap;
        }
        .rebar-nav-cta:hover { background: var(--gold); color: #0D0C0A; }
        .rebar-hamburger { display: none; flex-direction: column; gap: 5px; padding: 4px; }
        .rebar-hamburger span { display: block; width: 22px; height: 1.5px; background: var(--cream); }
        .rebar-mobile-menu {
          display: none; position: fixed; inset: 0; background: var(--bg);
          flex-direction: column; align-items: center; justify-content: center; gap: 32px;
          z-index: 200;
        }
        .rebar-mobile-menu.open { display: flex; }
        .rebar-mobile-menu a {
          font-size: 28px; font-family: var(--cormorant); font-weight: 400;
          letter-spacing: 0.04em; color: var(--cream);
        }
        .rebar-mobile-close { position: absolute; top: 24px; right: 28px; font-size: 28px; color: var(--muted); }

        /* ── Hero ── */
        .rebar-hero {
          position: relative; height: 100vh; min-height: 640px;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
          text-align: center; padding-bottom: 96px; overflow: hidden;
        }
        .rebar-hero-bg {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(13,12,10,0.85) 100%);
          z-index: 1;
        }
        .rebar-hero-img {
          position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%;
        }
        .rebar-hero-content { position: relative; z-index: 2; }
        .rebar-hero-location {
          font-size: 11px; letter-spacing: 0.35em; text-transform: uppercase;
          color: var(--gold); font-weight: 500; margin-bottom: 20px;
        }
        .rebar-hero-name {
          font-family: var(--cormorant); font-size: clamp(72px, 10vw, 130px);
          font-weight: 300; line-height: 0.9;
          color: var(--cream); letter-spacing: -0.01em;
        }
        .rebar-hero-name em { font-style: italic; color: var(--gold); }
        .rebar-hero-sub {
          font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--muted); margin-top: 24px; font-weight: 400;
        }
        .rebar-hero-btns {
          display: flex; gap: 16px; justify-content: center; margin-top: 40px; flex-wrap: wrap;
        }
        .rebar-btn-primary {
          padding: 14px 32px; background: var(--gold); color: #0D0C0A;
          font-size: 12px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;
          border-radius: 2px; transition: background 0.2s, transform 0.2s;
        }
        .rebar-btn-primary:hover { background: var(--gold-light); transform: translateY(-1px); }
        .rebar-btn-ghost {
          padding: 14px 32px; border: 1px solid rgba(255,255,255,0.25);
          color: var(--cream); font-size: 12px; font-weight: 500; letter-spacing: 0.15em;
          text-transform: uppercase; border-radius: 2px; transition: border-color 0.2s;
          background: transparent;
        }
        .rebar-btn-ghost:hover { border-color: var(--cream); }

        /* ── Section Labels ── */
        .rebar-section-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--gold); margin-bottom: 16px;
        }
        .rebar-section-heading {
          font-family: var(--cormorant); font-size: clamp(36px, 4.5vw, 58px);
          font-weight: 400; line-height: 1.05; color: var(--cream);
        }
        .rebar-section-heading em { font-style: italic; color: var(--gold); }

        /* ── Signatures ── */
        .signatures-section { padding: 100px 0; background: var(--surface); }
        .signatures-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
        .signatures-header { text-align: center; margin-bottom: 64px; }
        .signatures-header p { color: var(--muted); margin-top: 14px; font-size: 15px; max-width: 480px; margin-left: auto; margin-right: auto; }
        .signatures-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .signature-card {
          position: relative; overflow: hidden;
          background: var(--bg);
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .signature-card:hover { transform: scale(1.01); }
        .signature-card-img {
          width: 100%; aspect-ratio: 3/4; object-fit: cover;
          filter: brightness(0.85) saturate(0.9);
          transition: filter 0.4s, transform 0.6s;
        }
        .signature-card:hover .signature-card-img { filter: brightness(0.95) saturate(1); transform: scale(1.03); }
        .signature-card-body {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 32px 28px 28px;
          background: linear-gradient(to top, rgba(13,12,10,0.97) 60%, transparent);
        }
        .signature-card-category {
          font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--gold); font-weight: 600; margin-bottom: 8px;
        }
        .signature-card-name {
          font-family: var(--cormorant); font-size: 26px; font-weight: 400;
          color: var(--cream); line-height: 1.1; margin-bottom: 10px;
        }
        .signature-card-desc { font-size: 13px; color: var(--muted); margin-bottom: 14px; line-height: 1.5; }
        .signature-card-price { font-size: 15px; font-weight: 500; color: var(--gold); }

        /* ── Story ── */
        .story-section { padding: 120px 0; }
        .story-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 48px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 96px; align-items: center;
        }
        .story-left { }
        .story-right { }
        .story-body { color: var(--muted); font-size: 16px; margin-top: 28px; line-height: 1.8; }
        .story-body + .story-body { margin-top: 16px; }
        .story-quote {
          margin-top: 40px; padding: 32px; border-left: 2px solid var(--gold);
          background: var(--surface); border-radius: 0 4px 4px 0;
        }
        .story-quote-text {
          font-family: var(--cormorant); font-size: 22px; font-style: italic;
          color: var(--cream); line-height: 1.4;
        }
        .story-quote-attr { font-size: 12px; color: var(--muted); margin-top: 12px; letter-spacing: 0.1em; }
        .story-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 0; }
        .story-img-wrap { position: relative; }
        .story-img-label {
          position: absolute; bottom: 24px; left: -24px;
          background: var(--gold); color: #0D0C0A;
          padding: 12px 20px; font-size: 11px; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase;
        }

        /* ── Gallery ── */
        .gallery-section { padding: 100px 0; }
        .gallery-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
        .gallery-header { text-align: center; margin-bottom: 56px; }
        .gallery-header p { color: var(--muted); font-size: 15px; margin-top: 14px; }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: auto auto;
          gap: 6px;
        }
        .gallery-item {
          overflow: hidden;
          position: relative;
          background: var(--surface);
        }
        .gallery-item:nth-child(1) { grid-column: span 7; }
        .gallery-item:nth-child(2) { grid-column: span 5; }
        .gallery-item:nth-child(3) { grid-column: span 5; }
        .gallery-item:nth-child(4) { grid-column: span 7; }
        .gallery-item img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          aspect-ratio: unset;
          min-height: 300px;
          filter: brightness(0.88) saturate(0.9);
          transition: filter 0.5s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1);
        }
        .gallery-item:hover img { filter: brightness(1) saturate(1.05); transform: scale(1.03); }
        @media (max-width: 900px) {
          .gallery-grid { grid-template-columns: 1fr 1fr; }
          .gallery-item:nth-child(n) { grid-column: span 1; }
          .gallery-inner { padding: 0 24px; }
        }
        @media (max-width: 540px) {
          .gallery-grid { grid-template-columns: 1fr; }
        }

        /* ── Weekly Specials ── */
        .specials-section {
          padding: 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
        }
        .specials-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 48px;
          display: grid; grid-template-columns: repeat(3, 1fr);
        }
        .special-card {
          padding: 52px 40px;
          border-right: 1px solid var(--border);
          transition: background 0.3s;
        }
        .special-card:last-child { border-right: none; }
        .special-card:hover { background: var(--surface); }
        .special-day { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); font-weight: 600; margin-bottom: 12px; }
        .special-icon { font-size: 32px; margin-bottom: 20px; }
        .special-title { font-family: var(--cormorant); font-size: 28px; font-weight: 400; color: var(--cream); margin-bottom: 12px; }
        .special-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }

        /* ── Menu ── */
        .menu-section { padding: 100px 0; background: var(--surface); }
        .menu-inner { max-width: 1100px; margin: 0 auto; padding: 0 48px; }
        .menu-header { text-align: center; margin-bottom: 56px; }
        .menu-header p { color: var(--muted); font-size: 15px; margin-top: 14px; }
        .menu-tabs {
          display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;
          margin-bottom: 56px;
        }
        .menu-tab {
          padding: 9px 20px; font-size: 11px; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase;
          border: 1px solid var(--border); border-radius: 30px;
          color: var(--muted); transition: all 0.2s;
        }
        .menu-tab.active { border-color: var(--gold); color: var(--gold); background: rgba(196,146,58,0.08); }
        .menu-tab:hover:not(.active) { border-color: rgba(255,255,255,0.2); color: var(--cream); }
        .menu-items { display: flex; flex-direction: column; gap: 0; }
        .menu-item {
          display: flex; justify-content: space-between; align-items: start;
          padding: 22px 0; border-bottom: 1px solid var(--border);
          gap: 24px;
          transition: background 0.2s;
        }
        .menu-item:last-child { border-bottom: none; }
        .menu-item-left { flex: 1; }
        .menu-item-name {
          font-family: var(--cormorant); font-size: 20px; font-weight: 400; color: var(--cream);
          display: flex; align-items: center; gap: 10px;
        }
        .menu-item-badge {
          font-family: var(--dm-sans); font-size: 9px; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          background: var(--gold); color: #0D0C0A;
          padding: 2px 8px; border-radius: 30px; vertical-align: middle;
          white-space: nowrap;
        }
        .menu-item-desc { font-size: 13px; color: var(--muted); margin-top: 5px; line-height: 1.5; }
        .menu-item-price { font-size: 14px; font-weight: 500; color: var(--gold); white-space: nowrap; padding-top: 4px; }
        .menu-footnote { 
          text-align: center; margin-top: 48px; padding-top: 32px;
          border-top: 1px solid var(--border);
          font-size: 11px; color: var(--muted); letter-spacing: 0.05em; line-height: 1.6;
        }

        /* ── Contact / Hours ── */
        .contact-section { padding: 100px 0; }
        .contact-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 48px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
        }
        .hours-table { width: 100%; border-collapse: collapse; margin-top: 32px; }
        .hours-table tr { border-bottom: 1px solid var(--border); }
        .hours-table td { padding: 14px 0; font-size: 14px; }
        .hours-table td:first-child { color: var(--muted); font-weight: 400; }
        .hours-table td:last-child { text-align: right; color: var(--cream); font-weight: 400; }
        .hours-table tr.closed td { color: var(--muted); opacity: 0.5; }
        .hours-today { color: var(--gold) !important; font-weight: 600 !important; }
        .contact-info { margin-top: 32px; display: flex; flex-direction: column; gap: 20px; }
        .contact-row { display: flex; flex-direction: column; gap: 4px; }
        .contact-label { font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); font-weight: 600; }
        .contact-value { font-size: 15px; color: var(--cream); }
        .contact-value a:hover { color: var(--gold); transition: color 0.2s; }
        .contact-btns { display: flex; flex-direction: column; gap: 12px; margin-top: 40px; }
        .contact-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 24px; border: 1px solid var(--border);
          font-size: 13px; font-weight: 500; color: var(--cream);
          border-radius: 2px; transition: border-color 0.2s, background 0.2s;
        }
        .contact-btn:hover { border-color: var(--gold); background: rgba(196,146,58,0.06); }
        .contact-btn-icon { font-size: 18px; }
        .contact-btn-text { display: flex; flex-direction: column; }
        .contact-btn-label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); }
        .contact-btn-val { font-size: 14px; color: var(--cream); }

        /* ── Reserve CTA ── */
        .reserve-section {
          padding: 100px 48px; text-align: center;
          background: var(--surface); border-top: 1px solid var(--border);
        }
        .reserve-section h2 { font-family: var(--cormorant); font-size: clamp(40px, 5vw, 64px); font-weight: 300; color: var(--cream); }
        .reserve-section h2 em { font-style: italic; color: var(--gold); }
        .reserve-section p { color: var(--muted); font-size: 15px; margin-top: 16px; margin-bottom: 40px; }
        .reserve-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

        /* ── Footer ── */
        .rebar-footer { 
          padding: 56px 48px; border-top: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: start;
          flex-wrap: wrap; gap: 40px;
          background: var(--bg);
        }
        .footer-logo { font-family: var(--cormorant); font-size: 24px; font-weight: 300; color: var(--cream); margin-bottom: 10px; }
        .footer-logo span { font-style: italic; color: var(--gold); }
        .footer-address { font-size: 13px; color: var(--muted); line-height: 1.7; }
        .footer-links { display: flex; flex-direction: column; gap: 8px; }
        .footer-links a { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); transition: color 0.2s; }
        .footer-links a:hover { color: var(--cream); }
        .footer-social { display: flex; gap: 16px; margin-top: 8px; }
        .footer-social a { font-size: 13px; color: var(--muted); transition: color 0.2s; }
        .footer-social a:hover { color: var(--gold); }
        .footer-copy { font-size: 11px; color: var(--muted); letter-spacing: 0.05em; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .rebar-nav { padding: 20px 24px; }
          .rebar-nav.scrolled { padding: 14px 24px; }
          .rebar-nav-links { display: none; }
          .rebar-nav-cta { display: none; }
          .rebar-hamburger { display: flex; }
          .signatures-grid { grid-template-columns: 1fr; }
          .story-inner { grid-template-columns: 1fr; gap: 48px; }
          .story-img-wrap { display: none; }
          .specials-inner { grid-template-columns: 1fr; }
          .special-card { border-right: none; border-bottom: 1px solid var(--border); }
          .special-card:last-child { border-bottom: none; }
          .contact-inner { grid-template-columns: 1fr; gap: 56px; }
          .signatures-inner, .story-inner, .menu-inner, .contact-inner { padding: 0 24px; }
          .specials-inner { padding: 0; }
          .rebar-footer { padding: 48px 24px; flex-direction: column; }
          .reserve-section { padding: 80px 24px; }
        }
      `}</style>

      <div className="rebar-root" style={{ paddingTop: bannerVisible ? '44px' : '0' }}>

        {/* ── Preview Banner ── */}
        {bannerVisible && (
          <div className="preview-banner">
            <div className="preview-banner-left">
              <span className="preview-banner-badge">Preview</span>
              <span>This is a site preview built by Sabor Web. Like what you see?</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a href="https://saborweb.com/services" className="preview-banner-cta">
                ✦ Claim Your Site
              </a>
              <button className="preview-banner-close" onClick={() => setBannerVisible(false)} aria-label="Dismiss">✕</button>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className={`rebar-nav ${navScrolled ? 'scrolled' : ''}`} ref={menuRef}>
          <div className="rebar-nav-logo">
            Rebar <span>Gastronomía</span>
          </div>
          <ul className="rebar-nav-links">
            <li><button onClick={() => scrollTo('menu')} style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>Menu</button></li>
            <li><button onClick={() => scrollTo('specials')} style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>Events</button></li>
            <li><button onClick={() => scrollTo('story')} style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>About</button></li>
            <li><button onClick={() => scrollTo('contact')} style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>Contact</button></li>
          </ul>
          <a href="tel:+17876581669" className="rebar-nav-cta">Reserve a Table</a>
          <button className="rebar-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`rebar-mobile-menu ${menuOpen ? 'open' : ''}`}>
          <button className="rebar-mobile-close" onClick={() => setMenuOpen(false)}>✕</button>
          <button onClick={() => scrollTo('menu')} style={{ all: 'unset', cursor: 'pointer', fontSize: '28px', fontFamily: 'var(--cormorant)', color: 'var(--cream)' }}>Menu</button>
          <button onClick={() => scrollTo('specials')} style={{ all: 'unset', cursor: 'pointer', fontSize: '28px', fontFamily: 'var(--cormorant)', color: 'var(--cream)' }}>Events</button>
          <button onClick={() => scrollTo('story')} style={{ all: 'unset', cursor: 'pointer', fontSize: '28px', fontFamily: 'var(--cormorant)', color: 'var(--cream)' }}>About</button>
          <button onClick={() => scrollTo('contact')} style={{ all: 'unset', cursor: 'pointer', fontSize: '28px', fontFamily: 'var(--cormorant)', color: 'var(--cream)' }}>Contact</button>
          <a href="tel:+17876581669" className="rebar-btn-primary">Call to Reserve</a>
        </div>

        {/* ── Hero ── */}
        <section className="rebar-hero">
          <Image
            src="/sites/rebar/hero.png"
            alt="Rebar interior — warm, intimate bar in Aguadilla"
            fill
            className="rebar-hero-img"
            priority
            style={{ objectFit: 'cover' }}
          />
          <div className="rebar-hero-bg" />
          <div className="rebar-hero-content">
            <p className="rebar-hero-location">Aguadilla, Puerto Rico · Carr. 110 Km 32.4</p>
            <h1 className="rebar-hero-name">
              Rebar<br /><em>Gastronomía</em>
            </h1>
            <p className="rebar-hero-sub">& Cocteles</p>
            <div className="rebar-hero-btns">
              <button className="rebar-btn-primary" onClick={() => scrollTo('menu')}>Explore the Menu</button>
              <a href="tel:+17876581669" className="rebar-btn-ghost">Reserve a Table</a>
            </div>
          </div>
        </section>

        {/* ── Signature Dishes ── */}
        <section className="signatures-section">
          <div className="signatures-inner">
            <div className="signatures-header">
              <p className="rebar-section-label">Chef&apos;s Selection</p>
              <h2 className="rebar-section-heading">Signatures</h2>
              <p>Three dishes that define who we are. Start here.</p>
            </div>
            <div className="signatures-grid">
              {SIGNATURES.map((item) => (
                <div key={item.name} className="signature-card">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={500}
                    height={700}
                    className="signature-card-img"
                    style={{ width: '100%', height: 'auto' }}
                  />
                  <div className="signature-card-body">
                    <p className="signature-card-category">{item.category}</p>
                    <h3 className="signature-card-name">{item.name}</h3>
                    <p className="signature-card-desc">{item.description}</p>
                    <p className="signature-card-price">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Story ── */}
        <section className="story-section" id="story">
          <div className="story-inner">
            <div className="story-left">
              <p className="rebar-section-label">Our Story</p>
              <h2 className="rebar-section-heading">{REBAR.story.heading}</h2>
              <p className="story-body">{REBAR.story.body}</p>
              <p className="story-body">{REBAR.story.body2}</p>
              <div className="story-quote">
                <p className="story-quote-text">&ldquo;{REBAR.story.quote.replace(/"/g, '')}&rdquo;</p>
                <p className="story-quote-attr">{REBAR.story.attribution}</p>
              </div>
            </div>
            <div className="story-right story-img-wrap">
              <Image
                src="/sites/rebar/hero.png"
                alt="Rebar interior"
                width={600}
                height={800}
                className="story-img"
                style={{ width: '100%', height: 'auto' }}
              />
              <div className="story-img-label">Est. Aguadilla, PR</div>
            </div>
          </div>
        </section>

        {/* ── Gallery ── */}
        <section className="gallery-section">
          <div className="gallery-inner">
            <div className="gallery-header">
              <p className="rebar-section-label">The Experience</p>
              <h2 className="rebar-section-heading">Inside <em>Rebar</em></h2>
              <p>An evening here is unlike anything else on the island.</p>
            </div>
            <div className="gallery-grid">
              {GALLERY.map((img) => (
                <div key={img.src} className="gallery-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt={img.alt} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Weekly Specials ── */}
        <section className="specials-section" id="specials">
          <div className="specials-inner">
            {WEEKLY_SPECIALS.map((s) => (
              <div key={s.day} className="special-card">
                <p className="special-day">{s.day}</p>
                <div className="special-icon">{s.icon}</div>
                <h3 className="special-title">{s.title}</h3>
                <p className="special-desc">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Full Menu ── */}
        <section className="menu-section" id="menu">
          <div className="menu-inner">
            <div className="menu-header">
              <p className="rebar-section-label">Rebar</p>
              <h2 className="rebar-section-heading">The Menu</h2>
              <p>Ask your server about tonight&apos;s chef specials and seasonal additions.</p>
            </div>
            <div className="menu-tabs">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  className={`menu-tab ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="menu-items">
              {(MENU_ITEMS[activeCategory] || []).map((item) => (
                <div key={item.name} className="menu-item">
                  <div className="menu-item-left">
                    <div className="menu-item-name">
                      {item.name}
                      {item.featured && <span className="menu-item-badge">Chef&apos;s Pick</span>}
                    </div>
                    <p className="menu-item-desc">{item.description}</p>
                  </div>
                  <div className="menu-item-price">{item.price}</div>
                </div>
              ))}
            </div>
            <p className="menu-footnote">
              Prices in USD · Consuming raw or undercooked items may increase risk of foodborne illness.<br />
              Menu items subject to seasonal availability · Please inform us of any allergies.
            </p>
          </div>
        </section>

        {/* ── Contact & Hours ── */}
        <section className="contact-section" id="contact">
          <div className="contact-inner">
            <div>
              <p className="rebar-section-label">We&apos;re Open</p>
              <h2 className="rebar-section-heading">Hours &amp; <em>Location</em></h2>
              <table className="hours-table">
                <tbody>
                  {REBAR.hours.map((h) => (
                    <tr key={h.day} className={h.closed ? 'closed' : ''}>
                      <td className={h.day === TODAY ? 'hours-today' : ''}>{h.day}</td>
                      <td className={h.day === TODAY ? 'hours-today' : ''}>{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className="rebar-section-label">Get in Touch</p>
              <h2 className="rebar-section-heading">Contact &amp; <em>Reservations</em></h2>
              <div className="contact-info">
                <div className="contact-row">
                  <span className="contact-label">Address</span>
                  <span className="contact-value">{REBAR.address}<br />{REBAR.city}</span>
                </div>
                <div className="contact-row">
                  <span className="contact-label">Reservations</span>
                  <span className="contact-value">Phone or WhatsApp only<br />Walk-ins welcome</span>
                </div>
              </div>
              <div className="contact-btns">
                <a href={`tel:+1${REBAR.phone.replace(/\D/g,'')}`} className="contact-btn">
                  <span className="contact-btn-icon">📞</span>
                  <span className="contact-btn-text">
                    <span className="contact-btn-label">Call Us</span>
                    <span className="contact-btn-val">{REBAR.phone}</span>
                  </span>
                </a>
                <a href={`https://wa.me/1${REBAR.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="contact-btn">
                  <span className="contact-btn-icon">💬</span>
                  <span className="contact-btn-text">
                    <span className="contact-btn-label">WhatsApp</span>
                    <span className="contact-btn-val">Send us a message</span>
                  </span>
                </a>
                <a href={`https://maps.google.com/?q=${encodeURIComponent('Carr. 110 Km 32.4 Bo. Maleza Alta Aguadilla PR')}`} target="_blank" rel="noopener noreferrer" className="contact-btn">
                  <span className="contact-btn-icon">🗺️</span>
                  <span className="contact-btn-text">
                    <span className="contact-btn-label">Navigate</span>
                    <span className="contact-btn-val">Get Directions</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Reserve CTA ── */}
        <section className="reserve-section">
          <h2>Ready for an <em>Unforgettable</em> Evening?</h2>
          <p>No online booking — we keep it personal. Call or message us to reserve your table.</p>
          <div className="reserve-btns">
            <a href="tel:+17876581669" className="rebar-btn-primary">📞 Call to Reserve</a>
            <a href="https://wa.me/17876581669" target="_blank" rel="noopener noreferrer" className="rebar-btn-ghost">💬 WhatsApp Us</a>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="rebar-footer">
          <div>
            <div className="footer-logo">Rebar <span>Gastronomía & Cocteles</span></div>
            <div className="footer-address">
              {REBAR.address}<br />
              {REBAR.city}<br />
              {REBAR.phone}
            </div>
            <div className="footer-social" style={{ marginTop: '16px' }}>
              <a href={REBAR.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href={REBAR.facebookUrl} target="_blank" rel="noopener noreferrer">Facebook</a>
            </div>
          </div>
          <div className="footer-links">
            <button onClick={() => scrollTo('menu')} style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', transition: 'color 0.2s' }}>Menu</button>
            <button onClick={() => scrollTo('specials')} style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Events</button>
            <button onClick={() => scrollTo('story')} style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>About</button>
            <button onClick={() => scrollTo('contact')} style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Contact</button>
          </div>
          <div className="footer-copy">
            <p>© 2026 Rebar Gastronomía &amp; Cocteles</p>
            <p style={{ marginTop: '6px', fontSize: '10px' }}>
              Site by <a href="https://saborweb.com" style={{ color: 'var(--gold)' }}>Sabor Web</a>
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}
