'use client';
import Link from 'next/link';
import { ArrowRight, Search, MapPin, Star, TrendingUp, FileText, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const FEATURES = [
  { icon: MapPin, en: { t: 'Local Citations', b: 'We list your restaurant on 30+ directories: Yelp, TripAdvisor, Foursquare, and dozens of local PR listings. Consistent NAP data is the foundation of local SEO.' }, es: { t: 'Citas Locales', b: 'Listamos tu restaurante en más de 30 directorios: Yelp, TripAdvisor, Foursquare y docenas de listados locales de PR. Los datos NAP consistentes son la base del SEO local.' } },
  { icon: Search, en: { t: 'Google Business Profile', b: 'We set up and optimize your GBP from scratch — hours, photos, menu link, booking link, Q&A. Ongoing posts keep your listing fresh and active.' }, es: { t: 'Google Business Profile', b: 'Configuramos y optimizamos tu GBP desde cero — horarios, fotos, enlace de menú, enlace de reservaciones, Q&A. Las publicaciones continuas mantienen tu listado fresco y activo.' } },
  { icon: TrendingUp, en: { t: 'Keyword Rank Tracking', b: 'Monthly report showing where you rank for the keywords that matter: "restaurant [city] PR", "best [cuisine] Puerto Rico", and your specific restaurant name.' }, es: { t: 'Seguimiento de Posicionamiento', b: 'Informe mensual que muestra dónde te posicionas para las palabras clave que importan: "restaurante [ciudad] PR", "mejor [cocina] Puerto Rico" y el nombre específico de tu restaurante.' } },
  { icon: FileText, en: { t: 'On-Page SEO', b: 'Proper title tags, meta descriptions, schema markup (LocalBusiness + Restaurant + Menu), and geographic targeting for every page of your site.' }, es: { t: 'SEO en Página', b: 'Títulos, meta descripciones, marcado schema correctos (LocalBusiness + Restaurant + Menu) y orientación geográfica para cada página de tu sitio.' } },
  { icon: Star, en: { t: 'Review Management', b: 'On the Crecimiento plan: we monitor Google and Yelp daily and respond to reviews — positive and negative — on your behalf with your voice and tone.' }, es: { t: 'Gestión de Reseñas', b: 'En el plan Crecimiento: monitoreamos Google y Yelp diariamente y respondemos a las reseñas — positivas y negativas — en tu nombre con tu voz y tono.' } },
  { icon: MessageSquare, en: { t: 'GMB Posts', b: 'Regular Google Business posts keep your listing active and signal freshness to Google — promotions, events, new menu items, holiday hours.' }, es: { t: 'Publicaciones GMB', b: 'Las publicaciones regulares en Google Business mantienen tu listado activo y señalan frescura a Google — promociones, eventos, nuevos platos, horarios de feriados.' } },
];

const STATS = [
  { en: { n: '76%', l: 'of "near me" searches result in a same-day visit' }, es: { n: '76%', l: 'de las búsquedas "cerca de mí" resultan en una visita el mismo día' } },
  { en: { n: '88%', l: 'of local mobile searches visit or call within 24 hours' }, es: { n: '88%', l: 'de las búsquedas móviles locales visitan o llaman dentro de 24 horas' } },
  { en: { n: '#1', l: 'Google Maps ranking = 10–30% more foot traffic' }, es: { n: '#1', l: 'Ranking #1 en Google Maps = 10–30% más tráfico peatonal' } },
];

export default function SeoLocalPage() {
  const { t, lang } = useLanguage();

  return (
    <>
      <section style={{ paddingTop: '140px', paddingBottom: '40px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, oklch(0.58 0.16 28 / 0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p className="label" style={{ marginBottom: '1rem' }}>{t.localSeo.heroLabel}</p>
          <h1 style={{ marginBottom: '1rem' }}>{t.localSeo.heroHeading}</h1>
          <p style={{ color: 'var(--color-sw-muted)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>{t.localSeo.heroSub}</p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--color-sw-surface)', padding: '3rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
            {STATS.map(s => (
              <div key={s.en.n} style={{ padding: '2rem 1rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 700, color: 'var(--color-sw-coral)', lineHeight: 1, marginBottom: '0.75rem' }}>{s[lang as 'en' | 'es'].n}</div>
                <p style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{s[lang as 'en' | 'es'].l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2>{lang === 'es' ? 'Lo que hacemos por tu restaurante' : 'What we do for your restaurant'}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
            {FEATURES.map(f => {
              const Icon = f.icon;
              const copy = f[lang as 'en' | 'es'];
              return (
                <div key={f.en.t} style={{ padding: '1.75rem', background: 'var(--color-sw-card)', border: '1px solid var(--color-sw-border-subtle)', borderRadius: '4px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-sw-coral-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Icon size={20} style={{ color: 'var(--color-sw-coral)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>{copy.t}</h3>
                  <p style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{copy.b}</p>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-sw-muted)', marginBottom: '1.5rem' }}>
              {lang === 'es' ? 'El SEO local está incluido en los planes Visibilidad y Crecimiento.' : 'Local SEO is included in the Visibilidad and Crecimiento plans.'}
            </p>
            <Link href="/servicios" className="btn-primary">
              {lang === 'es' ? 'Ver paquetes' : 'View packages'} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
