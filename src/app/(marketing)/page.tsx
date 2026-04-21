'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import PackageGrid from '@/components/PackageGrid';

export default function Home() {
  const { lang } = useLanguage();

  const copy = {
    en: {
      heroEyebrow: 'Restaurant websites · Puerto Rico',
      heroTitle: 'Your restaurant website, built before you pay.',
      heroSub: 'We build a real, working preview — specific to your restaurant — at no cost. If you love it, you launch. If not, you walk away with nothing owed.',
      heroCta: 'Get my free preview',
      heroSecondary: 'See live examples',

      proofEyebrow: 'Already live',

      howEyebrow: 'How it works',
      howTitle: 'Three steps, then you\'re online.',
      howSteps: [
        ['Fill out the short form.', 'Name, WhatsApp, and your existing links. Takes under 2 minutes. We use this to start building immediately.'],
        ['We build your preview.', 'Our team researches your restaurant — Google, Instagram, your menu — and builds a real, working website in 1–3 business days.'],
        ['Approve it, then launch.', 'Like what you see? Pick a plan and go live the same day. Not feeling it? You owe us nothing.'],
      ],

      examplesEyebrow: 'See the work',
      examplesTitle: 'Real sites. Real restaurants.',
      examplesSub: 'These are fully working sites built for restaurants across Puerto Rico. Click through the menus, check the hours, try the reservations.',

      whatEyebrow: 'What we need from you',
      whatTitle: 'Less than you\'d expect.',
      whatItems: [
        ['Your menu.', 'A photo, a PDF, a link, even just a handwritten list. We take what you have and fill in the rest from your public profiles.'],
        ['A few photos.', 'Phone shots, Instagram posts, anything from Google — all usable. Professional photography is never required.'],
        ['What success looks like.', 'More phone calls? Show up on Google? Reach tourists? One sentence from you shapes the entire build.'],
      ],

      packagesEyebrow: 'Pricing',
      packagesTitle: 'Know the price before you decide.',
      packagesSub: 'Every engagement starts with a free preview. No sales call, no contract — see your site first, then choose.',

      faqEyebrow: 'Common questions',
      faqTitle: 'Honest answers before you start.',
      faqs: lang === 'es' ? [] : [
        ['Do I have to pay anything upfront?', 'No. We build your preview completely free. You only pay if you love it and want to launch. No card required to get started.'],
        ['What if my restaurant doesn\'t have great photos?', 'Most don\'t. We pull from your Instagram, Google Business, and Facebook to assemble something solid. We\'ll tell you if we need more.'],
        ['How long does the preview take?', '1 to 3 business days for most restaurants. Larger or more complex sites may take an extra day.'],
        ['Can the site be in both English and Spanish?', 'Yes — and we\'d recommend it if you serve both locals and tourists. We write and manage both versions.'],
        ['What happens after I approve the preview?', 'You pick a plan, we collect payment, and your site goes live the same day. We also handle hosting and updates going forward.'],
      ],

      finalEyebrow: 'Zero risk. Real results.',
      finalTitle: 'See your restaurant online before you spend a dollar.',
      finalSub: 'A 2-minute form. A real preview in 1–3 days. No obligation.',
    },
    es: {
      heroEyebrow: 'Páginas web para restaurantes · Puerto Rico',
      heroTitle: 'Tu página web lista antes de que pagues.',
      heroSub: 'Construimos un preview real de tu restaurante — sin costo. Si te gusta, lo lanzamos. Si no, no debes nada.',
      heroCta: 'Obtener mi preview gratis',
      heroSecondary: 'Ver ejemplos reales',

      proofEyebrow: 'Ya en vivo',

      howEyebrow: 'Cómo funciona',
      howTitle: 'Tres pasos y estás en línea.',
      howSteps: [
        ['Llena el formulario corto.', 'Nombre, WhatsApp y tus enlaces existentes. Menos de 2 minutos. Empezamos a construir de inmediato.'],
        ['Construimos tu preview.', 'Investigamos tu restaurante — Google, Instagram, tu menú — y construimos una página real y funcional en 1–3 días hábiles.'],
        ['Apruébala y la lanzamos.', '¿Te gusta? Elige un plan y salimos en vivo ese mismo día. ¿No te convence? No nos debes nada.'],
      ],

      examplesEyebrow: 'Ve el trabajo',
      examplesTitle: 'Páginas reales. Restaurantes reales.',
      examplesSub: 'Páginas completamente funcionales para restaurantes en Puerto Rico. Navega los menús, revisa los horarios, prueba las reservaciones.',

      whatEyebrow: 'Lo que necesitamos de ti',
      whatTitle: 'Menos de lo que esperas.',
      whatItems: [
        ['Tu menú.', 'Foto, PDF, enlace, o hasta una lista escrita a mano. Tomamos lo que tienes y llenamos lo demás con tus perfiles públicos.'],
        ['Algunas fotos.', 'Fotos del celular, posts de Instagram, imágenes de Google — todo sirve. No se necesita fotografía profesional.'],
        ['Lo que quieres lograr.', '¿Más llamadas? ¿Aparecer en Google? ¿Llegar a turistas? Una oración tuya define toda la construcción.'],
      ],

      packagesEyebrow: 'Precios',
      packagesTitle: 'Conoce el precio antes de decidir.',
      packagesSub: 'Todo empieza con un preview gratis. Sin llamada de ventas, sin contrato — ve tu página primero y luego decides.',

      faqEyebrow: 'Preguntas frecuentes',
      faqTitle: 'Respuestas honestas antes de comenzar.',
      faqs: [
        ['¿Tengo que pagar algo por adelantado?', 'No. Construimos tu preview completamente gratis. Solo pagas si te encanta y quieres lanzarlo. No se requiere tarjeta para empezar.'],
        ['¿Qué pasa si mi restaurante no tiene buenas fotos?', 'La mayoría no las tiene. Usamos tu Instagram, Google Business y Facebook para armar algo sólido. Te avisamos si necesitamos más.'],
        ['¿Cuánto tarda el preview?', '1 a 3 días hábiles para la mayoría. Restaurantes más complejos pueden tomar un día extra.'],
        ['¿Puede la página estar en español e inglés?', 'Sí — y lo recomendamos si atiendes tanto a locales como turistas. Escribimos y manejamos las dos versiones.'],
        ['¿Qué pasa después de aprobar el preview?', 'Eliges un plan, procesamos el pago y tu página sale en vivo ese mismo día. Nosotros manejamos el hosting y las actualizaciones.'],
      ],

      finalEyebrow: 'Sin riesgo. Resultados reales.',
      finalTitle: 'Ve tu restaurante en línea antes de gastar un dólar.',
      finalSub: 'Un formulario de 2 minutos. Un preview real en 1–3 días. Sin compromiso.',
    },
  }[lang];

  const proofRestaurants = [
    { name: 'Rebar Gastronomía', city: 'Aguadilla' },
    { name: 'Cinco de Maya', city: 'Aguadilla' },
  ];

  return (
    <div className="page-shell">

      {/* ── Hero ── */}
      <section className="hero-v2">
        <div className="hero-v2__inner hero-v2__inner--single">
          <div className="hero-copy">
            <p className="eyebrow">{copy.heroEyebrow}</p>
            <h1>{copy.heroTitle}</h1>
            <p className="hero-sub">{copy.heroSub}</p>
            <div className="hero-actions">
              <Link className="button button--primary button--lg" href="/brief-builder">
                {copy.heroCta} <ArrowRight size={15} />
              </Link>
              <Link className="button button--ghost" href="#examples">
                {copy.heroSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <div className="proof-bar">
        <span className="proof-bar__label">{copy.proofEyebrow}</span>
        <div className="proof-bar__restaurants">
          {proofRestaurants.map((r) => (
            <span key={r.name} className="proof-bar__item">
              <CheckCircle size={13} />
              {r.name} · <span>{r.city}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="section-v2 section-v2--mid">
        <div className="section-v2__inner">
          <div className="section-heading">
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.85rem' }}>{copy.howEyebrow}</p>
              <h2>{copy.howTitle}</h2>
            </div>
          </div>
          <div className="process-grid process-grid--numbered">
            {copy.howSteps.map(([title, body], i) => (
              <article className="process-card" key={title}>
                <strong className="process-card__num">0{i + 1}</strong>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live examples / Portfolio ── */}
      <section className="section-v2" id="examples">
        <div className="section-v2__inner">
          <div className="section-heading">
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.85rem' }}>{copy.examplesEyebrow}</p>
              <h2>{copy.examplesTitle}</h2>
            </div>
            <p>{copy.examplesSub}</p>
          </div>
          <div className="portfolio-grid">
            <Link className="portfolio-card" href="/preview/rebar">
              <Image src="/images/portfolio-rebar.png" alt="Rebar Gastronomía preview" fill sizes="(max-width: 900px) 100vw, 50vw" />
              <div className="portfolio-card__body">
                <p className="eyebrow">Aguadilla</p>
                <h3>Rebar Gastronomía &amp; Cocteles</h3>
                <p>{lang === 'es' ? 'Coctelería de autor, cocina local, y sistema de reservaciones en línea.' : 'Craft cocktails, local kitchen, and online reservations — fully functional.'}</p>
              </div>
            </Link>
            <Link className="portfolio-card" href="/preview/cinco-de-maya">
              <Image src="/sites/cinco-de-maya/hero.png" alt="Cinco de Maya preview" fill sizes="(max-width: 900px) 100vw, 50vw" />
              <div className="portfolio-card__body">
                <p className="eyebrow">Aguadilla</p>
                <h3>Cinco de Maya</h3>
                <p>{lang === 'es' ? 'Taquería vibrante con menú completo, especiales del día y acceso rápido al cliente.' : 'Vibrant taquería with full menu, daily specials, and fast customer access.'}</p>
              </div>
            </Link>
            <div className="proof-card proof-card--cta">
              <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>
                {lang === 'es' ? 'Tu restaurante aquí' : 'Your restaurant, next'}
              </p>
              <h3>{lang === 'es' ? 'El próximo preview es el tuyo.' : 'The next preview is yours.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Comparte tus links o danos tu nombre. Hacemos el resto.'
                  : 'Share your links or just your name. We do the rest.'}
              </p>
              <Link className="button button--primary" href="/brief-builder" style={{ marginTop: '1.5rem' }}>
                {copy.heroCta} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── What we need ── */}
      <section className="section-v2 section-v2--mid">
        <div className="section-v2__inner">
          <div className="section-heading">
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.85rem' }}>{copy.whatEyebrow}</p>
              <h2>{copy.whatTitle}</h2>
            </div>
            <p>
              {lang === 'es'
                ? 'No necesitas tener todo listo. Investigamos, llenamos vacíos, y usamos lo que ya tienes en línea.'
                : 'You don\'t need to have everything ready. We research, fill gaps, and use what you already have online.'}
            </p>
          </div>
          <div className="pain-grid">
            {copy.whatItems.map(([title, body]) => (
              <article className="pain-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Packages ── */}
      <section className="section-v2">
        <div className="section-v2__inner">
          <div className="section-heading">
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.85rem' }}>{copy.packagesEyebrow}</p>
              <h2>{copy.packagesTitle}</h2>
            </div>
            <p>{copy.packagesSub}</p>
          </div>
          <PackageGrid homeMode requestHref="/brief-builder" />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section-v2 section-v2--mid">
        <div className="section-v2__inner">
          <div className="section-heading">
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.85rem' }}>{copy.faqEyebrow}</p>
              <h2>{copy.faqTitle}</h2>
            </div>
          </div>
          <div className="feature-grid">
            {copy.faqs.map(([q, a]) => (
              <article className="feature-card" key={q}>
                <h3>{q}</h3>
                <p>{a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="section-v2 section-v2--coral" id="request">
        <div className="section-v2__inner">
          <div className="final-cta-band final-cta-band--centered">
            <p className="eyebrow eyebrow--light">{copy.finalEyebrow}</p>
            <h2>{copy.finalTitle}</h2>
            <p>{copy.finalSub}</p>
            <Link className="button button--white button--lg" href="/brief-builder">
              {copy.heroCta} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
