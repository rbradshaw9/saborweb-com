'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import QuickPreviewForm from '@/components/QuickPreviewForm';

export default function PortfolioPage() {
  const { lang } = useLanguage();
  const copy = {
    en: {
      eyebrow: 'Live proof',
      title: 'Previews owners can actually click.',
      sub: 'These examples show the range: elegant dining, energetic casual concepts, menu-first layouts, and strong calls to visit, call, or order.',
      cta: 'Request a preview like this',
    },
    es: {
      eyebrow: 'Prueba viva',
      title: 'Previews que los duenos pueden navegar.',
      sub: 'Estos ejemplos muestran el rango: alta cocina, conceptos casuales con energia, menus claros y llamadas fuertes para visitar, llamar u ordenar.',
      cta: 'Solicitar un preview asi',
    },
  }[lang];

  const sites = [
    {
      name: 'Rebar Gastronomia & Cocteles',
      location: 'Aguadilla',
      image: '/images/portfolio-rebar.png',
      href: 'https://rebar.saborweb.com',
      body: lang === 'es' ? 'Elegante, atmosferico y orientado a menu/reservaciones.' : 'Elegant, atmospheric, and built around menu/reservations.',
    },
    {
      name: 'Cinco de Maya',
      location: 'Aguadilla',
      image: '/sites/cinco-de-maya/hero.png',
      href: '/preview/cinco-de-maya',
      body: lang === 'es' ? 'Colorido, rapido y perfecto para ofertas, tacos y visitas.' : 'Colorful, fast, and ideal for specials, tacos, and visits.',
    },
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
        </div>
      </section>

      <section className="section-v2">
        <div className="section-v2__inner">
          <div className="portfolio-grid">
            {sites.map((site) => {
              const card = (
                <>
                  <Image src={site.image} alt={`${site.name} website preview`} fill sizes="(max-width: 900px) 100vw, 50vw" />
                  <div className="portfolio-card__body">
                    <p className="eyebrow">{site.location}</p>
                    <h3>{site.name}</h3>
                    <p>{site.body}</p>
                    <span className="button button--primary" style={{ marginTop: '1rem' }}>{lang === 'es' ? 'Abrir preview' : 'Open preview'} <ArrowRight size={16} /></span>
                  </div>
                </>
              );

              return site.href.startsWith('http') ? (
                <a className="portfolio-card" href={site.href} key={site.name}>
                  {card}
                </a>
              ) : (
                <Link className="portfolio-card" href={site.href} key={site.name}>
                  {card}
                </Link>
              );
            })}
            <article className="proof-card">
              <p className="eyebrow">{lang === 'es' ? 'Siguiente' : 'Next'}</p>
              <h3>{lang === 'es' ? 'Tu restaurante puede tener una prueba asi.' : 'Your restaurant can get a proof piece like this.'}</h3>
              <p>{lang === 'es' ? 'No tienes que imaginarlo. Te mostramos una version viva antes de venderte.' : 'You do not have to imagine it. We show you a live version before selling you.'}</p>
              <Link className="button button--primary" href="/contact">{copy.cta}</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section-v2 section-v2--paper">
        <div className="section-v2__inner">
          <QuickPreviewForm source="portfolio" />
        </div>
      </section>
    </div>
  );
}
