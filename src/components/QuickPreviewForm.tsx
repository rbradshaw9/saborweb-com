'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

type FormState = {
  ownerName: string;
  restaurantName: string;
  phone: string;
  email: string;
  city: string;
  instagramUrl: string;
  googleUrl: string;
  websiteUrl: string;
  notes: string;
};

const INITIAL_FORM: FormState = {
  ownerName: '',
  restaurantName: '',
  phone: '',
  email: '',
  city: '',
  instagramUrl: '',
  googleUrl: '',
  websiteUrl: '',
  notes: '',
};

type SuccessState = {
  intakeUrl: string;
  clientSlug: string;
};

export default function QuickPreviewForm({ source = 'website' }: { source?: string }) {
  const { lang } = useLanguage();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const copy = {
    en: {
      eyebrow: 'Start your free preview',
      title: 'Tell us where to look. We will build the brief from there.',
      sub: 'This starts your private intake link. No payment, no obligation.',
      ownerName: 'Your name',
      restaurantName: 'Restaurant name',
      phone: 'Phone / WhatsApp',
      email: 'Email',
      city: 'City or town',
      instagramUrl: 'Instagram link',
      googleUrl: 'Google Business link',
      websiteUrl: 'Current website, if any',
      notes: 'Anything we should know?',
      submit: 'Create my intake link',
      loading: 'Creating link',
      success: 'Your private intake link is ready.',
      continue: 'Continue intake',
      error: 'Something went wrong. Please try again or message us on WhatsApp.',
    },
    es: {
      eyebrow: 'Comienza tu preview gratis',
      title: 'Dinos donde mirar. Nosotros armamos el brief desde ahi.',
      sub: 'Esto crea tu enlace privado de intake. Sin pago, sin compromiso.',
      ownerName: 'Tu nombre',
      restaurantName: 'Nombre del restaurante',
      phone: 'Telefono / WhatsApp',
      email: 'Email',
      city: 'Pueblo o ciudad',
      instagramUrl: 'Enlace de Instagram',
      googleUrl: 'Enlace de Google Business',
      websiteUrl: 'Pagina actual, si existe',
      notes: 'Algo que debamos saber?',
      submit: 'Crear mi enlace de intake',
      loading: 'Creando enlace',
      success: 'Tu enlace privado de intake esta listo.',
      continue: 'Continuar intake',
      error: 'Algo salio mal. Intenta otra vez o escribenos por WhatsApp.',
    },
  }[lang];

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/preview-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          preferredLanguage: lang,
          source,
        }),
      });
      const data: unknown = await res.json();

      if (!res.ok || typeof data !== 'object' || data === null) {
        throw new Error('Preview request failed');
      }

      const intakeUrl = 'intakeUrl' in data && typeof data.intakeUrl === 'string' ? data.intakeUrl : '';
      const clientSlug = 'clientSlug' in data && typeof data.clientSlug === 'string' ? data.clientSlug : '';

      if (!intakeUrl) throw new Error('Missing intake URL');

      setSuccess({ intakeUrl, clientSlug });
      setStatus('success');
      setForm(INITIAL_FORM);
    } catch {
      setStatus('error');
      setMessage(copy.error);
    }
  };

  if (status === 'success' && success) {
    return (
      <div className="form-card form-card--success">
        <CheckCircle size={24} aria-hidden />
        <p className="eyebrow">{copy.eyebrow}</p>
        <h3>{copy.success}</h3>
        <p>
          {lang === 'es'
            ? `Codigo del cliente: ${success.clientSlug}. Tambien te contactaremos si dejaste email o WhatsApp.`
            : `Client code: ${success.clientSlug}. We will also reach out if you left email or WhatsApp.`}
        </p>
        <a className="button button--primary" href={success.intakeUrl}>
          {copy.continue} <ArrowRight size={16} />
        </a>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <div>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.sub}</p>
      </div>

      <div className="form-grid">
        <input required value={form.ownerName} onChange={(event) => update('ownerName', event.target.value)} placeholder={copy.ownerName} />
        <input required value={form.restaurantName} onChange={(event) => update('restaurantName', event.target.value)} placeholder={copy.restaurantName} />
        <input required value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder={copy.phone} />
        <input value={form.email} onChange={(event) => update('email', event.target.value)} placeholder={copy.email} type="email" />
        <input required value={form.city} onChange={(event) => update('city', event.target.value)} placeholder={copy.city} />
        <input value={form.instagramUrl} onChange={(event) => update('instagramUrl', event.target.value)} placeholder={copy.instagramUrl} />
        <input value={form.googleUrl} onChange={(event) => update('googleUrl', event.target.value)} placeholder={copy.googleUrl} />
        <input value={form.websiteUrl} onChange={(event) => update('websiteUrl', event.target.value)} placeholder={copy.websiteUrl} />
      </div>

      <textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder={copy.notes} rows={4} />

      {message && <p className="form-error">{message}</p>}

      <button className="button button--primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="spin" size={16} /> : <ArrowRight size={16} />}
        {status === 'loading' ? copy.loading : copy.submit}
      </button>
    </form>
  );
}
