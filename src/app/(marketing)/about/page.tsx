'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function NosotrosPage() {
  const { t, lang } = useLanguage();

  const VALUES = [
    {
      en: { t: 'Restaurant-only focus', b: 'We don\'t build e-commerce stores, law firm websites, or anything else. Every feature we build, every template we design, every improvement we make — is for restaurants.' },
      es: { t: 'Enfoque exclusivo en restaurantes', b: 'No construimos tiendas en línea, páginas de bufetes ni nada más. Cada función que construimos, cada plantilla que diseñamos, cada mejora que hacemos — es para restaurantes.' },
    },
    {
      en: { t: 'Build first, sell second', b: 'Our entire model is built around respect for your time. You don\'t pay until you see the finished product. We believe in our work enough to show it first.' },
      es: { t: 'Construimos primero, vendemos después', b: 'Todo nuestro modelo está construido alrededor del respeto por tu tiempo. No pagas hasta que ves el producto terminado. Creemos en nuestro trabajo lo suficiente como para mostrarlo primero.' },
    },
    {
      en: { t: 'Truly bilingual', b: 'Every site we build is written in both languages — not translated, written. We speak Spanish natively and understand how Puerto Rican menus, service language, and culture translate to English.' },
      es: { t: 'Verdaderamente bilingüe', b: 'Cada sitio que construimos está escrito en ambos idiomas — no traducido, escrito. Hablamos español de forma nativa y entendemos cómo los menús puertorriqueños, el lenguaje de servicio y la cultura se traducen al inglés.' },
    },
    {
      en: { t: 'Transparent pricing', b: 'No long negotiations. No surprise fees. Our prices are public. You pick the plan that works for your budget and you own that decision.' },
      es: { t: 'Precios transparentes', b: 'Sin largas negociaciones. Sin cargos sorpresa. Nuestros precios son públicos. Eliges el plan que funciona para tu presupuesto y eres dueño de esa decisión.' },
    },
  ];

  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: '140px', paddingBottom: '40px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, oklch(0.58 0.16 28 / 0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p className="label" style={{ marginBottom: '1rem' }}>{t.about.heroLabel}</p>
          <h1 style={{ marginBottom: '1rem' }}>{t.about.heroHeading}</h1>
          <p style={{ color: 'var(--color-sw-muted)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>{t.about.heroSub}</p>
        </div>
      </section>

      {/* Story */}
      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container" style={{ maxWidth: '780px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '5rem', alignItems: 'start' }}>
            <div>
              <div className="coral-line" />
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)', marginBottom: '1.25rem' }}>
                {lang === 'es' ? 'La historia' : 'The story'}
              </h2>
              <p style={{ color: 'var(--color-sw-muted)', lineHeight: 1.8, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                {lang === 'es'
                  ? 'Sabor Web nació de una observación simple: los mejores restaurantes de Puerto Rico merecen páginas web tan buenas como su comida. La mayoría lucha con sitios anticuados, o peor, sin sitio en absoluto — perdiendo clientes que los buscan en Google cada día.'
                  : 'Sabor Web was born from a simple observation: the best restaurants in Puerto Rico deserve websites as good as their food. Most struggle with outdated sites, or worse, no site at all — losing customers who search for them on Google every day.'}
              </p>
              <p style={{ color: 'var(--color-sw-muted)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                {lang === 'es'
                  ? 'Somos un equipo pequeño — dos personas en Puerto Rico — que construye, mantiene y hace crecer tu presencia en línea. Sin intermediarios. Sin promesas vacías. Solo trabajo real.'
                  : 'We\'re a small team — two people in Puerto Rico — who build, maintain, and grow your online presence. No middlemen. No empty promises. Just real work.'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { n: '10+', l: { en: 'years combined web experience', es: 'años de experiencia web combinada' } },
                { n: '100%', l: { en: 'restaurant-focused', es: 'enfocados en restaurantes' } },
                { n: '2', l: { en: 'people. No outsourcing.', es: 'personas. Sin subcontratación.' } },
              ].map(stat => (
                <div key={stat.n} style={{ padding: '1.5rem', background: 'var(--color-sw-card)', border: '1px solid var(--color-sw-border-subtle)', borderRadius: '4px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-sw-coral)', lineHeight: 1, marginBottom: '0.35rem' }}>{stat.n}</div>
                  <p style={{ color: 'var(--color-sw-muted)', fontSize: '0.85rem' }}>{stat.l[lang as 'en' | 'es']}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
              {lang === 'es' ? 'Nuestros valores' : 'Our values'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {VALUES.map(v => (
                <div key={v.en.t} style={{ padding: '1.75rem', background: 'var(--color-sw-card)', border: '1px solid var(--color-sw-border-subtle)', borderRadius: '4px' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.6rem' }}>{v[lang as 'en' | 'es'].t}</h3>
                  <p style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{v[lang as 'en' | 'es'].b}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/contacto" className="btn-primary">
              {lang === 'es' ? 'Trabaja con nosotros' : 'Work with us'} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
