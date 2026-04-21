'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle, Loader2, Upload } from 'lucide-react';
import { FEATURE_OPTIONS, STYLE_OPTIONS } from '@/lib/intake/shared';
import { useLanguage } from '@/lib/LanguageContext';

type RequestSummary = {
  restaurant_name: string;
  owner_name: string;
  city: string;
  client_slug: string;
};

type IntakeFormState = {
  address: string;
  neighborhood: string;
  cuisine: string;
  currentWebsite: string;
  googleBusinessUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  menuUrl: string;
  menuSource: string;
  menuNotes: string;
  orderingUrl: string;
  reservationsUrl: string;
  domainStatus: string;
  launchUrgency: string;
  brandStyle: string;
  brandNotes: string;
  idealGuest: string;
  differentiators: string;
  ownerGoals: string;
  hours: string;
  assetLinks: string;
  featureRequests: string[];
};

const INITIAL_FORM: IntakeFormState = {
  address: '',
  neighborhood: '',
  cuisine: '',
  currentWebsite: '',
  googleBusinessUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  menuUrl: '',
  menuSource: '',
  menuNotes: '',
  orderingUrl: '',
  reservationsUrl: '',
  domainStatus: '',
  launchUrgency: '',
  brandStyle: '',
  brandNotes: '',
  idealGuest: '',
  differentiators: '',
  ownerGoals: '',
  hours: '',
  assetLinks: '',
  featureRequests: [],
};

function IntakeContent() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const { lang } = useLanguage();
  const [request, setRequest] = useState<RequestSummary | null>(null);
  const [form, setForm] = useState<IntakeFormState>(INITIAL_FORM);
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'complete' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const copy = useMemo(() => ({
    en: {
      eyebrow: 'Private restaurant intake',
      loading: 'Loading your intake...',
      title: 'Give us the raw ingredients. We will turn them into a build-ready brief.',
      sub: 'The more you share here, the faster we can build a preview that feels like your real restaurant.',
      save: 'Save intake and create brief',
      saving: 'Creating brief',
      complete: 'Your intake is complete.',
      completeSub: 'We have enough to prepare the preview brief. You can still send extra assets through WhatsApp.',
      error: 'We could not load or save this intake. Check the link or try again.',
      files: 'Logo, menu, or photos',
    },
    es: {
      eyebrow: 'Intake privado del restaurante',
      loading: 'Cargando tu intake...',
      title: 'Danos los ingredientes. Nosotros lo convertimos en un brief listo para construir.',
      sub: 'Mientras mas compartas aqui, mas rapido podemos crear un preview que se sienta como tu restaurante real.',
      save: 'Guardar intake y crear brief',
      saving: 'Creando brief',
      complete: 'Tu intake esta completo.',
      completeSub: 'Tenemos suficiente para preparar el brief del preview. Todavia puedes enviar mas assets por WhatsApp.',
      error: 'No pudimos cargar o guardar este intake. Revisa el enlace o intenta otra vez.',
      files: 'Logo, menu o fotos',
    },
  })[lang], [lang]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!token) {
        setStatus('error');
        setMessage(copy.error);
        return;
      }

      try {
        const res = await fetch(`/api/intake?token=${encodeURIComponent(token)}`);
        const data: unknown = await res.json();
        if (!res.ok || typeof data !== 'object' || data === null || !('request' in data)) {
          throw new Error('Invalid response');
        }

        const loadedRequest = data.request as RequestSummary;
        if (!active) return;
        setRequest(loadedRequest);
        setStatus('ready');
      } catch {
        if (!active) return;
        setStatus('error');
        setMessage(copy.error);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [copy.error, token]);

  const update = (key: keyof IntakeFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleFeature = (feature: string) => {
    setForm((current) => ({
      ...current,
      featureRequests: current.featureRequests.includes(feature)
        ? current.featureRequests.filter((item) => item !== feature)
        : [...current.featureRequests, feature],
    }));
  };

  const uploadFiles = async () => {
    if (!files?.length) return;
    const formData = new FormData();
    formData.set('token', token);
    formData.set('fileRole', 'intake-asset');
    Array.from(files).forEach((file) => formData.append('files', file));

    const res = await fetch('/api/intake/files', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('File upload failed');
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('saving');
    setMessage('');

    try {
      await uploadFiles();
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          token,
          assetLinks: form.assetLinks
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      setStatus('complete');
    } catch {
      setStatus('error');
      setMessage(copy.error);
    }
  };

  if (status === 'loading') {
    return (
      <section className="intake-page">
        <div className="intake-shell">
          <p className="lead">{copy.loading}</p>
        </div>
      </section>
    );
  }

  if (status === 'complete') {
    return (
      <section className="intake-page">
        <div className="intake-shell form-card form-card--success">
          <CheckCircle size={30} />
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.complete}</h1>
          <p>{copy.completeSub}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="intake-page">
      <div className="intake-shell">
        <div className="intake-header">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="lead">{copy.sub}</p>
          {request && (
            <p className="fine-print" style={{ textAlign: 'left' }}>
              {request.restaurant_name} · {request.city} · {request.client_slug}
            </p>
          )}
        </div>

        <form className="form-card" onSubmit={submit}>
          <div className="intake-section">
            <h3>{lang === 'es' ? 'Datos del restaurante' : 'Restaurant details'}</h3>
            <div className="form-grid">
              <input required value={form.address} onChange={(event) => update('address', event.target.value)} placeholder={lang === 'es' ? 'Direccion fisica' : 'Street address'} />
              <input value={form.neighborhood} onChange={(event) => update('neighborhood', event.target.value)} placeholder={lang === 'es' ? 'Sector / barrio' : 'Neighborhood'} />
              <input required value={form.cuisine} onChange={(event) => update('cuisine', event.target.value)} placeholder={lang === 'es' ? 'Tipo de comida' : 'Cuisine'} />
              <input value={form.currentWebsite} onChange={(event) => update('currentWebsite', event.target.value)} placeholder={lang === 'es' ? 'Pagina actual' : 'Current website'} />
              <input value={form.googleBusinessUrl} onChange={(event) => update('googleBusinessUrl', event.target.value)} placeholder="Google Business URL" />
              <input value={form.instagramUrl} onChange={(event) => update('instagramUrl', event.target.value)} placeholder="Instagram URL" />
              <input value={form.facebookUrl} onChange={(event) => update('facebookUrl', event.target.value)} placeholder="Facebook URL" />
              <input value={form.menuUrl} onChange={(event) => update('menuUrl', event.target.value)} placeholder={lang === 'es' ? 'Enlace al menu' : 'Menu link'} />
            </div>
            <textarea required value={form.hours} onChange={(event) => update('hours', event.target.value)} placeholder={lang === 'es' ? 'Horario por dia' : 'Hours by day'} rows={4} />
          </div>

          <div className="intake-section">
            <h3>{lang === 'es' ? 'Menu, ventas y herramientas' : 'Menu, sales, and tools'}</h3>
            <div className="form-grid">
              <input value={form.menuSource} onChange={(event) => update('menuSource', event.target.value)} placeholder={lang === 'es' ? 'Donde esta el menu mas actualizado?' : 'Where is the most current menu?'} />
              <input value={form.orderingUrl} onChange={(event) => update('orderingUrl', event.target.value)} placeholder={lang === 'es' ? 'Enlace de ordenar online' : 'Online ordering link'} />
              <input value={form.reservationsUrl} onChange={(event) => update('reservationsUrl', event.target.value)} placeholder={lang === 'es' ? 'Enlace de reservaciones' : 'Reservations link'} />
              <input value={form.domainStatus} onChange={(event) => update('domainStatus', event.target.value)} placeholder={lang === 'es' ? 'Tienes dominio?' : 'Do you have a domain?'} />
            </div>
            <textarea value={form.menuNotes} onChange={(event) => update('menuNotes', event.target.value)} placeholder={lang === 'es' ? 'Notas sobre menu, especiales, platos importantes' : 'Menu notes, specials, important dishes'} rows={4} />
          </div>

          <div className="intake-section">
            <h3>{lang === 'es' ? 'Estilo y objetivos' : 'Style and goals'}</h3>
            <select required value={form.brandStyle} onChange={(event) => update('brandStyle', event.target.value)}>
              <option value="">{lang === 'es' ? 'Selecciona un estilo' : 'Select a style'}</option>
              {STYLE_OPTIONS.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
            <div className="form-grid">
              <input value={form.launchUrgency} onChange={(event) => update('launchUrgency', event.target.value)} placeholder={lang === 'es' ? 'Que tan urgente es?' : 'How urgent is launch?'} />
              <input value={form.idealGuest} onChange={(event) => update('idealGuest', event.target.value)} placeholder={lang === 'es' ? 'Cliente ideal' : 'Ideal guest'} />
            </div>
            <textarea value={form.brandNotes} onChange={(event) => update('brandNotes', event.target.value)} placeholder={lang === 'es' ? 'Colores, vibe, palabras que describen la marca' : 'Colors, vibe, words that describe the brand'} rows={3} />
            <textarea value={form.differentiators} onChange={(event) => update('differentiators', event.target.value)} placeholder={lang === 'es' ? 'Que hace unico al restaurante?' : 'What makes the restaurant different?'} rows={3} />
            <textarea value={form.ownerGoals} onChange={(event) => update('ownerGoals', event.target.value)} placeholder={lang === 'es' ? 'Que quieres lograr con la pagina?' : 'What do you want the website to accomplish?'} rows={3} />
          </div>

          <div className="intake-section">
            <h3>{lang === 'es' ? 'Funciones esperadas' : 'Expected features'}</h3>
            <div className="checkbox-grid">
              {FEATURE_OPTIONS.map((feature) => (
                <label className="checkbox-pill" key={feature}>
                  <input type="checkbox" checked={form.featureRequests.includes(feature)} onChange={() => toggleFeature(feature)} />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="intake-section">
            <h3>{copy.files}</h3>
            <label className="checkbox-pill">
              <Upload size={18} />
              <span>{lang === 'es' ? 'Sube hasta 10MB por archivo: logo, menu PDF o fotos.' : 'Upload up to 10MB per file: logo, menu PDF, or photos.'}</span>
              <input type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setFiles(event.target.files)} />
            </label>
            <textarea value={form.assetLinks} onChange={(event) => update('assetLinks', event.target.value)} placeholder={lang === 'es' ? 'Enlaces de fotos, Drive, Dropbox o Instagram posts importantes, uno por linea' : 'Photo, Drive, Dropbox, or important Instagram links, one per line'} rows={4} />
          </div>

          {message && <p className="form-error">{message}</p>}

          <button className="button button--primary" type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? <Loader2 className="spin" size={16} /> : <ArrowRight size={16} />}
            {status === 'saving' ? copy.saving : copy.save}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function IntakePage() {
  return (
    <Suspense>
      <IntakeContent />
    </Suspense>
  );
}
