'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function AboutPage() {
  const { lang } = useLanguage();
  const copy = {
    en: {
      eyebrow: 'Built for Puerto Rico restaurants',
      title: 'Sabor Web is not a general agency with a restaurant page.',
      sub: 'The whole offer is built around a specific local problem: restaurants need a site customers can trust before the owner wants to commit to a web project.',
      cta: 'Request your preview',
    },
    es: {
      eyebrow: 'Hecho para restaurantes en Puerto Rico',
      title: 'Sabor Web no es una agencia generica con una pagina para restaurantes.',
      sub: 'Toda la oferta responde a un problema local: los restaurantes necesitan una pagina que de confianza antes de que el dueno quiera comprometerse con un proyecto web.',
      cta: 'Solicitar preview',
    },
  }[lang];

  const values = [
    [lang === 'es' ? 'Solo restaurantes' : 'Restaurant-only', lang === 'es' ? 'Cada seccion, formulario y proceso esta pensado para menus, horarios, Google, WhatsApp y visitas.' : 'Every section, form, and process is designed around menus, hours, Google, WhatsApp, and visits.'],
    [lang === 'es' ? 'Preview antes del pago' : 'Preview before payment', lang === 'es' ? 'Vendemos con evidencia: una pagina viva, no una promesa abstracta.' : 'We sell with evidence: a live page, not an abstract promise.'],
    [lang === 'es' ? 'Puerto Rico primero' : 'Puerto Rico first', lang === 'es' ? 'Menus, WhatsApp, Google, pueblos, horarios y detalles que importan aqui.' : 'Menus, WhatsApp, Google, local towns, hours, and the details that matter here.'],
    [lang === 'es' ? 'Proceso repetible' : 'Repeatable process', lang === 'es' ? 'Supabase, Vercel y Stripe convierten cada preview en un flujo claro.' : 'Supabase, Vercel, and Stripe make every preview part of a clear workflow.'],
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
            {values.map(([title, body]) => (
              <article className="feature-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
