'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import QuickPreviewForm from '@/components/QuickPreviewForm';

export default function LocalSeoPage() {
  const { lang } = useLanguage();
  const copy = {
    en: {
      eyebrow: 'Local SEO for restaurants',
      title: 'A beautiful site only matters if hungry people can find it.',
      sub: 'Sabor Web pairs restaurant design with the practical Google signals customers use: menu, location, hours, schema, phone, reviews, and clear local relevance.',
      cta: 'Start with a preview',
    },
    es: {
      eyebrow: 'SEO local para restaurantes',
      title: 'Una pagina bonita importa mas cuando la gente hambrienta la encuentra.',
      sub: 'Sabor Web combina diseno para restaurantes con las senales de Google que usan los clientes: menu, ubicacion, horario, schema, telefono, resenas y relevancia local.',
      cta: 'Empezar con un preview',
    },
  }[lang];

  const features = [
    [lang === 'es' ? 'Menu claro' : 'Clear menu', lang === 'es' ? 'Google y clientes necesitan texto real, no solo fotos de menu.' : 'Google and customers need real text, not only menu photos.'],
    [lang === 'es' ? 'Schema local' : 'Local schema', lang === 'es' ? 'Marcado de Restaurant/LocalBusiness para reforzar datos clave.' : 'Restaurant/LocalBusiness markup to reinforce key data.'],
    [lang === 'es' ? 'Google Business' : 'Google Business', lang === 'es' ? 'La pagina complementa el perfil, direcciones, llamadas y fotos.' : 'The site supports the listing, directions, calls, and photos.'],
    [lang === 'es' ? 'Espanol + ingles si conviene' : 'Spanish + English when useful', lang === 'es' ? 'Versiones claras para restaurantes que atienden clientes locales y visitantes.' : 'Clear versions for restaurants serving local guests and visitors.'],
    [lang === 'es' ? 'Velocidad' : 'Speed', lang === 'es' ? 'Next.js y Vercel ayudan a que la primera impresion cargue rapido.' : 'Next.js and Vercel help the first impression load quickly.'],
    [lang === 'es' ? 'Confianza' : 'Trust', lang === 'es' ? 'Fotos, direccion, telefono y CTA reducen la duda antes de visitar.' : 'Photos, address, phone, and CTAs reduce hesitation before visiting.'],
  ];

  return (
    <div className="page-shell">
      <section className="section-v2 section-v2--dark" style={{ paddingTop: '150px' }}>
        <div className="section-v2__inner">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
            </div>
            <p>{copy.sub}</p>
          </div>
          <Link className="button button--primary" href="/contact">{copy.cta} <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="section-v2">
        <div className="section-v2__inner">
          <div className="feature-grid">
            {features.map(([title, body]) => (
              <article className="feature-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2 section-v2--paper">
        <div className="section-v2__inner">
          <QuickPreviewForm source="local-seo" />
        </div>
      </section>
    </div>
  );
}
