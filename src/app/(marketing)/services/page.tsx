'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import PackageGrid from '@/components/PackageGrid';
import QuickPreviewForm from '@/components/QuickPreviewForm';

export default function ServicesPage() {
  const { lang } = useLanguage();
  const copy = {
    en: {
      eyebrow: 'Pricing after proof',
      title: 'Simple packages for the site you already saw.',
      sub: 'Most owners start with a free preview. Once the preview feels right, these packages cover launch, hosting, care, and visibility.',
      modules: 'Add-ons when the restaurant needs them',
      talk: 'Not sure which plan fits?',
      cta: 'Request a free preview',
    },
    es: {
      eyebrow: 'Precios despues de ver la prueba',
      title: 'Paquetes simples para la pagina que ya viste.',
      sub: 'La mayoria empieza con un preview gratis. Cuando el preview se siente correcto, estos paquetes cubren lanzamiento, hosting, cuidado y visibilidad.',
      modules: 'Add-ons cuando el restaurante los necesita',
      talk: 'No sabes que plan encaja?',
      cta: 'Solicitar preview gratis',
    },
  }[lang];

  const modules = [
    ['Online ordering', lang === 'es' ? 'Conecta pedidos sin rehacer la pagina.' : 'Connect ordering without rebuilding the site.'],
    ['Reservations', lang === 'es' ? 'Enlaza OpenTable, Resy, WhatsApp o telefono.' : 'Link OpenTable, Resy, WhatsApp, or phone.'],
    ['Review collector', lang === 'es' ? 'QR y mensajes para pedir resenas con tacto.' : 'QR and messaging flow to request reviews gracefully.'],
    ['Photo refresh', lang === 'es' ? 'Actualiza galeria, platos y especiales.' : 'Refresh gallery, dishes, and specials.'],
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
          <div className="button-row">
            <Link className="button button--primary" href="/contact">{copy.cta} <ArrowRight size={16} /></Link>
            <Link className="button button--secondary" href="/portfolio">{lang === 'es' ? 'Ver ejemplos' : 'See examples'}</Link>
          </div>
        </div>
      </section>

      <section className="section-v2">
        <div className="section-v2__inner">
          <PackageGrid />
        </div>
      </section>

      <section className="section-v2 section-v2--paper">
        <div className="section-v2__inner">
          <div className="section-heading">
            <h2>{copy.modules}</h2>
            <p>{lang === 'es' ? 'El stack puede crecer con el restaurante, pero el v1 se mantiene enfocado.' : 'The stack can grow with the restaurant, but v1 stays focused.'}</p>
          </div>
          <div className="feature-grid">
            {modules.map(([title, body]) => (
              <article className="feature-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2">
        <div className="section-v2__inner">
          <div className="section-heading">
            <h2>{copy.talk}</h2>
            <p>{lang === 'es' ? 'Empieza con el preview. El plan correcto se vuelve mucho mas claro cuando puedes verlo.' : 'Start with the preview. The right plan becomes much clearer when you can see it.'}</p>
          </div>
          <QuickPreviewForm source="services" />
        </div>
      </section>
    </div>
  );
}
