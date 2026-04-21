'use client';

import { useLanguage } from '@/lib/LanguageContext';
import QuickPreviewForm from '@/components/QuickPreviewForm';

export default function ContactPage() {
  const { lang } = useLanguage();
  const copy = {
    en: {
      eyebrow: 'Free preview request',
      title: 'Start with a short request. Then fill the private intake when you are ready.',
      sub: 'The first form creates your private link. The intake gathers the menu, hours, links, assets, and goals we need to build the preview brief.',
    },
    es: {
      eyebrow: 'Solicitud de preview gratis',
      title: 'Empieza con un request corto. Luego llenas el intake privado cuando estes listo.',
      sub: 'El primer formulario crea tu enlace privado. El intake recoge menu, horario, enlaces, assets y metas para crear el brief del preview.',
    },
  }[lang];

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
          <QuickPreviewForm source="contact" />
          <p className="fine-print">
            {lang === 'es' ? 'Tambien puedes escribir directo por WhatsApp: ' : 'You can also message us directly on WhatsApp: '}
            <a href="https://wa.me/18019106171" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sw-leaf)', fontWeight: 800 }}>801-910-6171</a>
          </p>
        </div>
      </section>
    </div>
  );
}
