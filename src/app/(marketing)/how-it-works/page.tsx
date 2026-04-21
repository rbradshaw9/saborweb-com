'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import QuickPreviewForm from '@/components/QuickPreviewForm';

export default function HowItWorksPage() {
  const { lang } = useLanguage();
  const copy = {
    en: {
      eyebrow: 'The preview-first process',
      title: 'A clearer way to buy a restaurant website.',
      sub: 'The owner sees the site before making the purchase decision. The intake gives us enough structure to build faster and better.',
      cta: 'Start your preview',
    },
    es: {
      eyebrow: 'El proceso preview-first',
      title: 'Una forma mas clara de comprar una pagina web.',
      sub: 'El dueno ve la pagina antes de decidir comprar. El intake nos da la estructura para construir mas rapido y mejor.',
      cta: 'Comenzar preview',
    },
  }[lang];

  const steps = [
    [lang === 'es' ? 'Request inicial' : 'Initial request', lang === 'es' ? 'Capturamos nombre, restaurante, WhatsApp, pueblo y enlaces actuales.' : 'We capture name, restaurant, WhatsApp, city, and current links.'],
    [lang === 'es' ? 'Intake privado' : 'Private intake', lang === 'es' ? 'El restaurante comparte menu, horario, fotos, estilo y objetivos en un enlace privado.' : 'The restaurant shares menu, hours, photos, style, and goals through a private link.'],
    [lang === 'es' ? 'Brief de construccion' : 'Build brief', lang === 'es' ? 'Supabase guarda la informacion y generamos un brief listo para disenar y escribir.' : 'Supabase stores the information and we generate a design and copy-ready brief.'],
    [lang === 'es' ? 'Preview en Vercel' : 'Vercel preview', lang === 'es' ? 'Construimos el preview en un proyecto separado para que puedan navegarlo sin riesgo.' : 'We build the preview in a separate project so they can click around without risk.'],
    [lang === 'es' ? 'Pago y go-live' : 'Payment and go-live', lang === 'es' ? 'Si dicen que si, Stripe confirma el pago y el proyecto se mueve de preview a live.' : 'If they say yes, Stripe confirms payment and the project moves from preview to live.'],
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
          <div className="process-grid">
            {steps.map(([title, body], index) => (
              <article className="process-card" key={title}>
                <strong>0{index + 1}</strong>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section-v2 section-v2--paper">
        <div className="section-v2__inner">
          <QuickPreviewForm source="how-it-works" />
        </div>
      </section>
    </div>
  );
}
