'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function ComoFuncionaPage() {
  const { t, lang } = useLanguage();

  const steps = [
    {
      num: '01',
      title: { en: 'We research your restaurant', es: 'Investigamos tu restaurante' },
      body: { en: 'We pull your menu, photos, hours, and branding from your existing social media and Google listing — no paperwork from you required upfront.', es: 'Usamos tu menú, fotos, horarios y marca desde tus redes sociales y listado de Google — no necesitamos nada tuyo por adelantado.' },
    },
    {
      num: '02',
      title: { en: 'We build your complete site', es: 'Construimos tu sitio completo' },
      body: { en: 'We design and build a full professional website using our restaurant-specific templates. It\'s bilingual, mobile-optimized, and SEO-ready from day one.', es: 'Diseñamos y construimos un sitio web profesional completo usando nuestras plantillas específicas para restaurantes. Es bilingüe, optimizado para móvil y listo para SEO desde el día uno.' },
    },
    {
      num: '03',
      title: { en: 'You receive your preview link', es: 'Recibes el enlace de tu preview' },
      body: { en: 'We reach out with a live link — your real restaurant, your real menu, your real branding — fully built. No imagination required. You see exactly what you\'re getting.', es: 'Te contactamos con un enlace en vivo — tu restaurante real, tu menú real, tu marca real — completamente construido. No necesitas imaginarlo. Ves exactamente lo que obtienes.' },
    },
    {
      num: '04',
      title: { en: 'You choose your package and pay', es: 'Eliges tu paquete y pagas' },
      body: { en: 'If you love it, pick a package and pay the setup fee. We deliver the payment link directly — no lengthy contract negotiation, no deposits before you see the work.', es: 'Si te gusta, elige un paquete y paga el cargo de configuración. Te enviamos el enlace de pago directamente — sin largas negociaciones, sin depósitos antes de ver el trabajo.' },
    },
    {
      num: '05',
      title: { en: 'Your site goes live', es: 'Tu sitio sale en vivo' },
      body: { en: 'Payment confirmed → your site goes live instantly. We handle the domain, hosting, SSL, and security setup. You get login credentials for your content management system.', es: 'Pago confirmado → tu sitio sale en vivo al instante. Nosotros manejamos el dominio, hosting, SSL y configuración de seguridad. Recibes credenciales de acceso a tu sistema de gestión de contenido.' },
    },
    {
      num: '06',
      title: { en: 'We stay by your side', es: 'Nos quedamos a tu lado' },
      body: { en: 'Monthly retainer keeps your site updated, secure, and growing. Need to change the menu? Announce a special? Up to Visibilidad or Crecimiento for full SEO management.', es: 'El retainer mensual mantiene tu sitio actualizado, seguro y creciendo. ¿Necesitas cambiar el menú? ¿Anunciar una especial? Sube a Visibilidad o Crecimiento para gestión completa de SEO.' },
    },
  ];

  const faqs = [
    {
      q: { en: 'What if I don\'t like the preview?', es: '¿Qué pasa si no me gusta el preview?' },
      a: { en: 'No problem — and no obligation. The preview is a free gift. If it\'s not right for you, we part as friends. Many restaurants ask us to adjust colors, photos, or copy before they commit.', es: 'No hay problema — y sin obligación. El preview es un regalo gratis. Si no es para ti, nos despedimos como amigos. Muchos restaurantes nos piden ajustar colores, fotos o texto antes de comprometerse.' },
    },
    {
      q: { en: 'Do I own my website?', es: '¿Soy dueño de mi sitio web?' },
      a: { en: 'You own your domain — always. The site code stays with Sabor Web unless you request a one-time "handoff package." If you ever cancel, your domain is yours to take elsewhere.', es: 'Tu dominio siempre es tuyo. El código del sitio se queda con Sabor Web a menos que solicites un "paquete de transferencia" único. Si cancelas, tu dominio es tuyo para llevarlo a otro lado.' },
    },
    {
      q: { en: 'Can I update my own menu?', es: '¿Puedo actualizar mi propio menú?' },
      a: { en: 'Yes, on the Visibilidad and Crecimiento plans. You get access to a simple content editor where you can add, edit, or remove menu sections and items without touching any code.', es: 'Sí, en los planes Visibilidad y Crecimiento. Obtienes acceso a un editor de contenido simple donde puedes agregar, editar o eliminar secciones e ítems del menú sin tocar ningún código.' },
    },
    {
      q: { en: 'What if I want to cancel?', es: '¿Qué pasa si quiero cancelar?' },
      a: { en: 'Cancel any time with 30 days notice. Your domain stays yours. Site goes offline after the grace period. No long-term contracts, no penalties.', es: 'Cancela cuando quieras con 30 días de aviso. Tu dominio sigue siendo tuyo. El sitio se desactiva después del período de gracia. Sin contratos a largo plazo, sin penalidades.' },
    },
  ];

  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: '140px', paddingBottom: '40px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, oklch(0.58 0.16 28 / 0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p className="label" style={{ marginBottom: '1rem' }}>{t.howItWorks.heroLabel}</p>
          <h1 style={{ marginBottom: '1rem' }}>{t.howItWorks.heroHeading}</h1>
          <p style={{ color: 'var(--color-sw-muted)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.7 }}>{t.howItWorks.heroSub}</p>
        </div>
      </section>

      {/* Steps */}
      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{ display: 'flex', gap: '2rem', paddingBottom: '2.5rem', position: 'relative' }}>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', left: '19px', top: '40px', bottom: 0, width: '1px', background: 'var(--color-sw-border-subtle)' }} />
                )}
                <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-sw-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-label)', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                  {step.num}
                </div>
                <div style={{ paddingTop: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>{step.title[lang as 'en' | 'es']}</h3>
                  <p style={{ color: 'var(--color-sw-muted)', fontSize: '0.95rem', lineHeight: 1.75 }}>{step.body[lang as 'en' | 'es']}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ background: 'var(--color-sw-surface)' }}>
        <div className="container" style={{ maxWidth: '720px' }}>
          <p className="label" style={{ textAlign: 'center', marginBottom: '1rem' }}>{t.howItWorks.faqLabel}</p>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>
            {lang === 'es' ? 'Preguntas frecuentes' : 'Common questions'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {faqs.map(faq => (
              <div key={faq.q.en} style={{ padding: '1.5rem', background: 'var(--color-sw-card)', border: '1px solid var(--color-sw-border-subtle)', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.6rem', fontFamily: 'var(--font-label)', fontWeight: 600, color: 'var(--color-sw-cream)' }}>
                  {faq.q[lang as 'en' | 'es']}
                </h3>
                <p style={{ color: 'var(--color-sw-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{faq.a[lang as 'en' | 'es']}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/contacto" className="btn-primary">
              {lang === 'es' ? 'Solicitar preview gratis' : 'Request free preview'} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
